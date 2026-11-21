/**
 * API หลังบ้าน Admin: /api/admin/[...slug] — ตรวจสิทธิ์จาก Backend ทุกคำขอ
 * GET: stats | products | categories | packages | orders | deposits | users | settings | payment-methods | reviews | reset-requests
 * POST: products | categories | packages
 * PATCH: products/:id | categories/:id | packages/:id | orders/:id | deposits/:id | users/:id | settings | payment-methods/:id | reviews/:id
 * DELETE: products/:id | categories/:id | packages/:id | reviews/:id
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, err, handleError, requireAdmin } from '@/lib/api-helpers';
import { hashPassword, makeRef } from '@/lib/auth';
import { parseJson } from '@/lib/api-helpers';

function mapProduct<T extends { images?: string; details?: string; credentialStock?: string }>(p: T) {
  return {
    ...p,
    images: parseJson<string[]>(p.images ?? '[]', []),
    details: parseJson<{ label: string; value: string }[]>(p.details ?? '[]', []),
    credentials: parseJson<{ username: string; password: string }[]>(p.credentialStock ?? '[]', []),
  };
}

const productBody = z.object({
  code: z.string().trim().min(2, 'รหัสสินค้าต้องมีอย่างน้อย 2 ตัวอักษร').max(30),
  title: z.string().trim().min(5, 'ชื่อสินค้าต้องมีอย่างน้อย 5 ตัวอักษร').max(150),
  description: z.string().trim().min(10, 'รายละเอียดต้องมีอย่างน้อย 10 ตัวอักษร').max(3000),
  categoryId: z.string(),
  price: z.number().min(1, 'ราคาต้องมากกว่า 0').max(1000000),
  stock: z.number().int().min(0).max(100000).default(1),
  privateDelivery: z.string().max(2000).nullable().optional(),
  credentials: z.array(z.object({ username: z.string().trim().min(1).max(120), password: z.string().min(1).max(200) })).max(500).optional(),
  images: z.array(z.string().max(300)).max(8),
  details: z.array(z.object({ label: z.string().max(60), value: z.string().max(200) })).max(15),
  status: z.enum(['AVAILABLE', 'SOLD', 'HIDDEN']),
  featured: z.boolean(),
});

const categoryBody = z.object({
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'slug ใช้ a-z 0-9 และ - เท่านั้น'),
  name: z.string().trim().min(2).max(80),
  type: z.enum(['GAME_ID', 'TOPUP']),
  game: z.enum(['freefire', 'roblox', 'giftpass']).nullable().optional(),
  deliveryMode: z.enum(['PAGE', 'ACCOUNT']).default('PAGE'),
  image: z.string().max(300).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().min(0).max(99).default(0),
  active: z.boolean().default(true),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    await requireAdmin(req);
    const { slug } = await ctx.params;
    const [head, second] = slug;
    const sp = req.nextUrl.searchParams;

    if (head === 'stats') {
      const [orderCount, users, productsAvailable, productsSold, depositPending, completedOrders] = await Promise.all([
        db.order.count(),
        db.user.count({ where: { role: 'USER' } }),
        db.product.count({ where: { status: 'AVAILABLE' } }),
        db.product.count({ where: { status: 'SOLD' } }),
        db.deposit.count({ where: { status: 'PENDING' } }),
        db.order.findMany({ where: { status: 'COMPLETED' }, select: { total: true, createdAt: true } }),
      ]);
      const revenue = completedOrders.reduce((s, o) => s + o.total, 0);
      const statuses: Record<string, number> = {};
      const allOrders = await db.order.findMany({ select: { status: true } });
      for (const o of allOrders) statuses[o.status] = (statuses[o.status] ?? 0) + 1;

      // ยอดขาย 7 วันล่าสุด
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentPaid = await db.order.findMany({
        where: { createdAt: { gte: weekAgo }, status: { in: ['COMPLETED', 'PROCESSING', 'REVIEWING'] } },
        select: { total: true, createdAt: true },
      });
      const salesByDay: { day: string; total: number; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        const items = recentPaid.filter((o) => o.createdAt.toISOString().slice(0, 10) === key);
        salesByDay.push({ day: key, total: items.reduce((s, o) => s + o.total, 0), count: items.length });
      }

      const recentOrders = await db.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { user: { select: { username: true } }, items: { select: { name: true } } },
      });

      return ok({
        stats: {
          orderCount, userCount: users, productsAvailable, productsSold,
          depositPending, revenue, statuses, salesByDay,
        },
        recentOrders,
      });
    }

    if (head === 'products') {
      const products = await db.product.findMany({
        orderBy: { createdAt: 'desc' },
        include: { category: { select: { name: true, slug: true } }, _count: { select: { orderItems: true } } },
      });
      return ok({ products: products.map(mapProduct) });
    }

    if (head === 'categories') {
      const cats = await db.category.findMany({
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { products: true, packages: true } } },
      });
      return ok({ categories: cats });
    }

    if (head === 'packages') {
      const categoryId = sp.get('categoryId');
      if (!categoryId) return err('BAD_REQUEST: ต้องระบุ categoryId', 400);
      const packages = await db.topupPackage.findMany({
        where: { categoryId },
        orderBy: { sortOrder: 'asc' },
      });
      return ok({ packages });
    }

    if (head === 'orders') {
      const status = sp.get('status');
      const q = (sp.get('q') ?? '').trim();
      const where: Record<string, unknown> = {};
      if (status && status !== 'ALL') where.status = status;
      if (q) {
        where.OR = [{ orderNo: { contains: q } }, { user: { username: { contains: q } } }];
      }
      const orders = await db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { username: true, email: true } },
          items: { include: { product: { select: { code: true } } } },
        },
      });
      return ok({ orders });
    }

    if (head === 'deposits') {
      const status = sp.get('status');
      const where: Record<string, unknown> = status && status !== 'ALL' ? { status } : {};
      const deposits = await db.deposit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { user: { select: { username: true, email: true } } },
      });
      return ok({ deposits });
    }

    if (head === 'users') {
      const users = await db.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { wallet: { select: { balance: true } }, _count: { select: { orders: true } } },
      });
      return ok({
        users: users.map((u) => ({
          id: u.id, username: u.username, email: u.email, role: u.role, status: u.status,
          createdAt: u.createdAt, walletBalance: u.wallet?.balance ?? 0, orderCount: u._count.orders,
        })),
      });
    }

    if (head === 'settings') {
      const rows = await db.setting.findMany();
      const settings: Record<string, string> = {};
      for (const r of rows) settings[r.key] = r.value;
      const methods = await db.paymentMethod.findMany();
      return ok({ settings, methods });
    }

    if (head === 'reviews') {
      const reviews = await db.review.findMany({
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true } } },
      });
      return ok({ reviews });
    }

    if (head === 'reset-requests') {
      const requests = await db.passwordResetToken.findMany({
        where: { usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { username: true, email: true } } },
      });
      return ok({ requests });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    await requireAdmin(req);
    const { slug } = await ctx.params;
    const [head] = slug;

    if (head === 'products') {
      const body = productBody.parse(await req.json());
      const exists = await db.product.findUnique({ where: { code: body.code } });
      if (exists) return err('รหัสสินค้านี้มีอยู่แล้วในระบบ');
      const category = await db.category.findUnique({ where: { id: body.categoryId } });
      if (!category || category.type !== 'GAME_ID') return err('กรุณาเลือกหมวดไอดีเกมที่ถูกต้อง');
      const credentials = category.deliveryMode === 'ACCOUNT' ? (body.credentials ?? []) : [];
      const stock = category.deliveryMode === 'ACCOUNT' ? credentials.length : 1;
      const { credentials: _credentials, ...fields } = body;
      const product = await db.product.create({
        data: { ...fields, stock, status: stock === 0 ? 'SOLD' : (body.status === 'HIDDEN' ? 'HIDDEN' : 'AVAILABLE'), credentialStock: JSON.stringify(credentials), images: JSON.stringify(body.images), details: JSON.stringify(body.details) },
      });
      return ok({ product }, { status: 201 });
    }

    if (head === 'categories') {
      const body = categoryBody.parse(await req.json());
      const exists = await db.category.findUnique({ where: { slug: body.slug } });
      if (exists) return err('slug นี้มีอยู่แล้วในระบบ');
      const cat = await db.category.create({ data: { ...body, game: body.game ?? null, image: body.image ?? null, description: body.description ?? null } });
      return ok({ category: cat }, { status: 201 });
    }

    if (head === 'packages') {
      const body = z
        .object({
          categoryId: z.string(),
          name: z.string().trim().min(2).max(80),
          amount: z.number().int().min(0).nullable().optional(),
          price: z.number().min(1).max(1000000),
          badge: z.string().max(30).nullable().optional(),
          sortOrder: z.number().int().min(0).max(99).default(0),
          active: z.boolean().default(true),
        })
        .parse(await req.json());
      const pack = await db.topupPackage.create({ data: { ...body, amount: body.amount ?? null, badge: body.badge ?? null } });
      return ok({ package: pack }, { status: 201 });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    await requireAdmin(req);
    const { slug } = await ctx.params;
    const [head, second] = slug;

    // ===== อนุมัติ/ปฏิเสธคำขอเติมเงิน =====
    if (head === 'deposits' && second) {
      const body = z
        .object({ action: z.enum(['approve', 'reject']), adminNote: z.string().max(300).optional() })
        .parse(await req.json());

      const result = await db.$transaction(async (tx) => {
        const deposit = await tx.deposit.findUnique({ where: { id: second } });
        if (!deposit) throw new Error('NOT_FOUND: ไม่พบคำขอเติมเงิน');
        if (deposit.status !== 'PENDING') throw new Error('BAD_REQUEST: คำขอนี้ถูกตรวจสอบไปแล้ว ป้องกันการอนุมัติซ้ำ');

        if (body.action === 'approve') {
          const wallet = await tx.wallet.upsert({ where: { userId: deposit.userId }, create: { userId: deposit.userId }, update: {} });
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: deposit.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              refCode: makeRef('WT'),
              walletId: wallet.id,
              userId: deposit.userId,
              type: 'TOPUP',
              direction: 'IN',
              amount: deposit.amount,
              balanceAfter: updated.balance,
              description: `เติมเงินสำเร็จ (${deposit.method === 'TRUEMONEY_ANGPAO' ? 'ซองอังเปา' : 'โอนธนาคาร'}) ${deposit.refNo}`,
            },
          });
          return tx.deposit.update({
            where: { id: deposit.id },
            data: { status: 'SUCCESS', adminNote: body.adminNote ?? null, reviewedAt: new Date() },
          });
        }
        return tx.deposit.update({
          where: { id: deposit.id },
          data: { status: 'REJECTED', adminNote: body.adminNote ?? 'ไม่พบรายการชำระเงิน', reviewedAt: new Date() },
        });
      });
      return ok({ deposit: result });
    }

    // ===== เปลี่ยนสถานะคำสั่งซื้อ =====
    if (head === 'orders' && second) {
      const body = z
        .object({
          status: z.enum(['PENDING_PAYMENT', 'REVIEWING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED']).optional(),
          adminNote: z.string().max(300).optional(),
          deliveryInfo: z.string().max(500).optional(),
        })
        .parse(await req.json());

      const result = await db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: second }, include: { items: true } });
        if (!order) throw new Error('NOT_FOUND: ไม่พบคำสั่งซื้อ');

        if (body.status && body.status !== order.status) {
          // กรณียกเลิก/คืนเงิน: ถ้าชำระผ่านกระเป๋าและเดิมยังไม่ถูกยกเลิก → คืนเงินเข้ากระเป๋าอัตโนมัติ
          const refundable = ['REVIEWING', 'PROCESSING', 'COMPLETED'].includes(order.status);
          if ((body.status === 'CANCELLED' || body.status === 'REFUNDED') && refundable && order.paymentMethod === 'WALLET') {
            const wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
            if (wallet) {
              const updated = await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: order.total } } });
              await tx.walletTransaction.create({
                data: {
                  refCode: makeRef('WT'),
                  walletId: wallet.id,
                  userId: order.userId,
                  type: 'REFUND',
                  direction: 'IN',
                  amount: order.total,
                  balanceAfter: updated.balance,
                  description: `คืนเงินคำสั่งซื้อ ${order.orderNo}`,
                  orderId: order.id,
                },
              });
            }
          }
          // คืนสินค้าไอดีกลับมาพร้อมขาย ถ้ายกเลิกก่อนจัดส่งสำเร็จ
          if (body.status === 'CANCELLED' && order.type === 'GAME_ID' && order.status !== 'COMPLETED') {
            for (const item of order.items) {
              if (!item.productId) continue;
              const product = await tx.product.findUnique({ where: { id: item.productId }, include: { category: { select: { deliveryMode: true } } } });
              if (!product) continue;
              if (product.category.deliveryMode === 'ACCOUNT' && item.deliveryInfo) {
                const username = item.deliveryInfo.match(/User\\s*:\\s*(.*)/i)?.[1]?.trim();
                const password = item.deliveryInfo.match(/Pass\\s*:\\s*(.*)/i)?.[1]?.trim();
                if (username && password) {
                  const inventory = parseJson<{ username: string; password: string }[]>(product.credentialStock, []);
                  inventory.push({ username, password });
                  await tx.product.update({ where: { id: product.id }, data: { credentialStock: JSON.stringify(inventory), stock: inventory.length, status: 'AVAILABLE', soldCount: { decrement: 1 } } });
                }
              } else {
                await tx.product.update({ where: { id: product.id }, data: { stock: 1, status: 'AVAILABLE', soldCount: { decrement: 1 } } });
              }
            }
          }
        }

        const data: Record<string, unknown> = {};
        if (body.status) data.status = body.status;
        if (body.adminNote !== undefined) data.adminNote = body.adminNote;
        const updated = await tx.order.update({
          where: { id: order.id },
          data,
          include: { items: true },
        });
        if (body.deliveryInfo !== undefined && body.deliveryInfo !== '') {
          for (const item of updated.items) {
            await tx.orderItem.update({ where: { id: item.id }, data: { deliveryInfo: body.deliveryInfo } });
          }
        }
        return updated;
      });
      return ok({ order: result });
    }
    if (head === 'products' && second) {
      const body = productBody.partial().parse(await req.json());
      const existing = await db.product.findUnique({ where: { id: second }, include: { category: true } });
      if (!existing) return err('ไม่พบสินค้า', 404);
      const categoryId = body.categoryId ?? existing.categoryId;
      const category = await db.category.findUnique({ where: { id: categoryId } });
      if (!category || category.type !== 'GAME_ID') return err('กรุณาเลือกหมวดไอดีเกมที่ถูกต้อง');
      const credentials = category.deliveryMode === 'ACCOUNT'
        ? (body.credentials ?? parseJson<{ username: string; password: string }[]>(existing.credentialStock, []))
        : [];
      const stock = category.deliveryMode === 'ACCOUNT' ? credentials.length : 1;
      const { credentials: _credentials, stock: _stock, ...fields } = body;
      const data: Record<string, unknown> = { ...fields, categoryId, stock, credentialStock: JSON.stringify(credentials), status: stock === 0 ? 'SOLD' : (body.status === 'HIDDEN' ? 'HIDDEN' : 'AVAILABLE') };
      if (body.images) data.images = JSON.stringify(body.images);
      if (body.details) data.details = JSON.stringify(body.details);
      const product = await db.product.update({ where: { id: second }, data });
      return ok({ product });
    }

    // ===== แพ็กเกจเติมเกม =====
    if (head === 'packages' && second) {
      const body = z
        .object({
          name: z.string().trim().min(2).max(80).optional(),
          amount: z.number().int().min(0).max(10000000).nullable().optional(),
          price: z.number().min(1).max(1000000).optional(),
          badge: z.string().max(30).nullable().optional(),
          sortOrder: z.number().int().min(0).max(99).optional(),
          active: z.boolean().optional(),
        })
        .refine((d) => Object.keys(d).length > 0, { message: 'ไม่มีข้อมูลที่จะอัปเดต' })
        .parse(await req.json());
      const pkg = await db.topupPackage.update({ where: { id: second }, data: body });
      return ok({ package: pkg });
    }

    // ===== หมวดหมู่ =====
    if (head === 'categories' && second) {
      const body = categoryBody.partial().parse(await req.json());
      const cat = await db.category.update({ where: { id: second }, data: body });
      if (body.deliveryMode) {
        const products = await db.product.findMany({ where: { categoryId: second } });
        await db.$transaction(products.map((p) => {
          const credentials = body.deliveryMode === 'ACCOUNT' ? parseJson<{ username: string; password: string }[]>(p.credentialStock, []) : [];
          const stock = body.deliveryMode === 'ACCOUNT' ? credentials.length : 1;
          return db.product.update({ where: { id: p.id }, data: { stock, credentialStock: JSON.stringify(credentials), status: stock === 0 ? 'SOLD' : (p.status === 'HIDDEN' ? 'HIDDEN' : 'AVAILABLE') } });
        }));
      }
      return ok({ category: cat });
    }

    // ===== สมาชิก =====
    if (head === 'users' && second) {
      const body = z
        .object({
          role: z.enum(['USER', 'ADMIN']).optional(),
          status: z.enum(['ACTIVE', 'BANNED']).optional(),
          newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร').max(72).optional(),
          adjustBalance: z.object({ amount: z.number().min(-1000000).max(1000000), note: z.string().max(200) }).optional(),
        })
        .refine((d) => Object.keys(d).length > 0, { message: 'ไม่มีข้อมูลที่จะอัปเดต' })
        .parse(await req.json());

      if (body.adjustBalance) {
        await db.$transaction(async (tx) => {
          const wallet = await tx.wallet.upsert({ where: { userId: second }, create: { userId: second }, update: {} });
          if (wallet.balance + body.adjustBalance!.amount < 0) {
            throw new Error('BAD_REQUEST: การปรับยอดจะทำให้ยอดติดลบ ไม่อนุญาต');
          }
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: body.adjustBalance!.amount } },
          });
          await tx.walletTransaction.create({
            data: {
              refCode: makeRef('WT'),
              walletId: wallet.id,
              userId: second,
              type: 'ADMIN_ADJUST',
              direction: body.adjustBalance!.amount >= 0 ? 'IN' : 'OUT',
              amount: Math.abs(body.adjustBalance!.amount),
              balanceAfter: updated.balance,
              description: `แอดมินปรับยอด: ${body.adjustBalance!.note}`,
            },
          });
        });
      }

      const data: Record<string, unknown> = {};
      if (body.role) data.role = body.role;
      if (body.status) data.status = body.status;
      if (body.newPassword) data.passwordHash = hashPassword(body.newPassword);
      if (Object.keys(data).length > 0) {
        await db.user.update({ where: { id: second }, data });
      }
      return ok({ success: true });
    }

    // ===== ตั้งค่าร้าน =====
    if (head === 'settings') {
      const body = z.object({ settings: z.record(z.string(), z.string().max(2000)) }).parse(await req.json());
      for (const [key, value] of Object.entries(body.settings)) {
        await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
      }
      return ok({ success: true });
    }

    // ===== ช่องทางชำระเงิน =====
    if (head === 'payment-methods' && second) {
      const body = z
        .object({
          bankName: z.string().max(80).optional(),
          accountName: z.string().max(120).optional(),
          accountNumber: z.string().max(40).optional(),
          promptPay: z.string().max(40).optional(),
          active: z.boolean().optional(),
        })
        .parse(await req.json());
      const method = await db.paymentMethod.update({ where: { id: second }, data: body });
      return ok({ method });
    }

    // ===== รีวิว =====
    if (head === 'reviews' && second) {
      const body = z.object({ approved: z.boolean() }).parse(await req.json());
      const review = await db.review.update({ where: { id: second }, data: body });
      return ok({ review });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    await requireAdmin(req);
    const { slug } = await ctx.params;
    const [head, second] = slug;

    if (head === 'products' && second) {
      const product = await db.product.findUnique({ where: { id: second }, include: { _count: { select: { orderItems: true } } } });
      if (!product) return err('NOT_FOUND: ไม่พบสินค้า', 404);
      if (product._count.orderItems > 0) {
        // มีประวัติการซื้อ → ซ่อนแทนการลบ เพื่อรักษาประวัติคำสั่งซื้อ
        await db.product.update({ where: { id: second }, data: { status: 'HIDDEN' } });
        return ok({ success: true, action: 'hidden', message: 'สินค้ามีประวัติการซื้อ จึงเปลี่ยนเป็นซ่อนแทนการลบ' });
      }
      await db.product.delete({ where: { id: second } });
      return ok({ success: true, action: 'deleted' });
    }

    if (head === 'categories' && second) {
      const cat = await db.category.findUnique({ where: { id: second }, include: { _count: { select: { products: true, packages: true } } } });
      if (!cat) return err('NOT_FOUND: ไม่พบหมวดหมู่', 404);
      if (cat._count.products > 0 || cat._count.packages > 0) {
        return err('BAD_REQUEST: หมวดหมู่นี้ยังมีสินค้า/แพ็กเกจอยู่ ให้ย้ายหรือลบก่อน หรือปิดใช้งานหมวดแทน');
      }
      await db.category.delete({ where: { id: second } });
      return ok({ success: true });
    }

    if (head === 'packages' && second) {
      await db.topupPackage.delete({ where: { id: second } });
      return ok({ success: true });
    }

    if (head === 'reviews' && second) {
      await db.review.delete({ where: { id: second } });
      return ok({ success: true });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

