/**
 * API ข้อมูลร้านค้า / คำสั่งซื้อ / กระเป๋าเงิน: /api/data/[...slug]
 * GET: categories | products | packages | reviews | settings | payment-methods | search | wallet | orders | deposits
 * POST: order | deposit | review
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ok, err, handleError, requireUser, clientIp } from '@/lib/api-helpers';
import { rateLimit, makeRef, hashPassword, verifyPassword } from '@/lib/auth';
import { parseJson } from '@/lib/api-helpers';

/** แปลงสินค้า: images/details เป็น array ก่อนส่งให้ client */
function mapProduct<T extends { images?: string; details?: string }>(p: T) {
  const { privateDelivery: _privateDelivery, credentialStock: _credentialStock, ...safeProduct } = p as T & { privateDelivery?: string | null; credentialStock?: string };
  return {
    ...safeProduct,
    images: parseJson<string[]>(p.images ?? '[]', []),
    details: parseJson<{ label: string; value: string }[]>(p.details ?? '[]', []),
  };
}

// ================= GET =================

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await ctx.params;
    const [head, second] = slug;
    const sp = req.nextUrl.searchParams;

    if (head === 'categories') {
      const cats = await db.category.findMany({
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { products: { where: { status: 'AVAILABLE' } }, packages: { where: { active: true } } } },
        },
      });
      return ok({ categories: cats });
    }

    if (head === 'category' && second) {
      const cat = await db.category.findUnique({
        where: { slug: second },
        include: {
          _count: { select: { products: { where: { status: 'AVAILABLE' } }, packages: { where: { active: true } } } },
        },
      });
      if (!cat || !cat.active) return err('NOT_FOUND: ไม่พบหมวดหมู่นี้', 404);
      return ok({ category: cat });
    }

    if (head === 'products') {
      // รายการสินค้าตามหมวด / แนะนำ / ขายดี
      const catSlug = sp.get('category');
      const featured = sp.get('featured') === '1';
      const limit = Math.min(parseInt(sp.get('limit') ?? '24', 10) || 24, 60);
      const where: Record<string, unknown> = { status: { not: 'HIDDEN' } };
      if (catSlug) {
        const cat = await db.category.findUnique({ where: { slug: catSlug } });
        if (!cat) return ok({ products: [], category: null });
        where.categoryId = cat.id;
      }
      if (featured) where.featured = true;
      const products = await db.product.findMany({
        where,
        orderBy: featured ? { createdAt: 'desc' } : [{ status: 'asc' }, { soldCount: 'desc' }],
        take: limit,
        include: { category: { select: { slug: true, name: true, game: true } } },
      });
      return ok({ products: products.map(mapProduct) });
    }

    if (head === 'product' && second) {
      const product = await db.product.findUnique({
        where: { id: second },
        include: { category: { select: { slug: true, name: true, game: true } } },
      });
      if (!product || product.status === 'HIDDEN') return err('NOT_FOUND: ไม่พบสินค้านี้', 404);
      // สินค้าที่เกี่ยวข้อง (หมวดเดียวกัน)
      const related = await db.product.findMany({
        where: { categoryId: product.categoryId, status: 'AVAILABLE', id: { not: product.id } },
        take: 4,
        orderBy: { soldCount: 'desc' },
        include: { category: { select: { slug: true, name: true, game: true } } },
      });
      return ok({ product: mapProduct(product), related: related.map(mapProduct) });
    }

    if (head === 'packages') {
      const catSlug = sp.get('category');
      if (!catSlug) return err('BAD_REQUEST: ต้องระบุ category');
      const cat = await db.category.findUnique({ where: { slug: catSlug } });
      if (!cat) return err('NOT_FOUND: ไม่พบหมวดหมู่นี้', 404);
      const packages = await db.topupPackage.findMany({
        where: { categoryId: cat.id, active: true },
        orderBy: { sortOrder: 'asc' },
      });
      return ok({ category: cat, packages });
    }

    if (head === 'reviews') {
      const limit = Math.min(parseInt(sp.get('limit') ?? '8', 10) || 8, 30);
      const reviews = await db.review.findMany({
        where: { approved: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return ok({ reviews });
    }

    if (head === 'settings') {
      const rows = await db.setting.findMany();
      const settings: Record<string, string> = {};
      for (const r of rows) settings[r.key] = r.value;
      return ok({ settings });
    }

    if (head === 'payment-methods') {
      const methods = await db.paymentMethod.findMany({ where: { active: true } });
      return ok({ methods });
    }

    if (head === 'search') {
      const q = (sp.get('q') ?? '').trim();
      if (q.length < 1) return ok({ products: [], packages: [] });
      const products = await db.product.findMany({
        where: {
          status: { not: 'HIDDEN' },
          OR: [{ title: { contains: q } }, { code: { contains: q } }],
        },
        take: 12,
        include: { category: { select: { slug: true, name: true, game: true } } },
      });
      const packages = await db.topupPackage.findMany({
        where: { active: true, name: { contains: q } },
        take: 12,
        include: { category: { select: { slug: true, name: true, game: true } } },
      });
      return ok({ products: products.map(mapProduct), packages });
    }

    // ===== ส่วนที่ต้องล็อกอิน =====
    const user = await requireUser(req);

    if (head === 'wallet') {
      const wallet = await db.wallet.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
      const transactions = await db.walletTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return ok({ balance: wallet.balance, transactions });
    }

    if (head === 'orders') {
      const orders = await db.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { select: { code: true } } } } },
      });
      const safeOrders = orders.map((order) => ({ ...order, items: order.items.map((item) => ({ ...item, deliveryInfo: order.status === 'COMPLETED' ? item.deliveryInfo : null })) }));
      return ok({ orders: safeOrders });
    }

    if (head === 'order' && second) {
      const order = await db.order.findFirst({
        where: { id: second, userId: user.id },
        include: { items: { include: { product: { select: { code: true } } } } },
      });
      if (!order) return err('NOT_FOUND: ไม่พบคำสั่งซื้อนี้', 404);
      const safeOrder = { ...order, items: order.items.map((item) => ({ ...item, deliveryInfo: order.status === 'COMPLETED' ? item.deliveryInfo : null })) };
      return ok({ order: safeOrder });
    }

    if (head === 'deposits') {
      const deposits = await db.deposit.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });
      return ok({ deposits });
    }

    if (head === 'profile') {
      return ok({
        profile: {
          id: user.id, username: user.username, email: user.email, role: user.role,
          status: user.status, avatar: user.avatar, createdAt: user.createdAt, walletBalance: user.wallet?.balance ?? 0,
        },
      });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

// ================= POST =================

const orderSchema = z.object({
  type: z.enum(['GAME_ID', 'TOPUP', 'GIFT_PASS']),
  paymentMethod: z.enum(['WALLET', 'BANK_TRANSFER']),
  items: z
    .array(
      z.object({
        productId: z.string().max(64).optional(),
        packageId: z.string().max(64).optional(),
        quantity: z.number().int().min(1).max(1).default(1),
      })
    )
    .min(1, 'กรุณาเลือกสินค้า')
    .max(3),
  contact: z
    .object({
      playerId: z.string().trim().max(30, 'Player ID ยาวเกินไป').optional(),
      robloxUsername: z.string().trim().max(30).optional(),
      email: z.string().trim().max(100).optional(),
      note: z.string().trim().max(300, 'หมายเหตุยาวเกินไป').optional(),
    })
    .optional(),
  slipImage: z.string().max(300).optional(),
});

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await ctx.params;
    const [head] = slug;
    const user = await requireUser(req);
    const ip = clientIp(req);

    // ===== สร้างคำสั่งซื้อ (ซื้อไอดี / เติมเกม / gift pass) =====
    if (head === 'order') {
      const limited = rateLimit(`order:${user.id}`, 10, 60 * 1000);
      if (!limited.ok) return err('ส่งคำสั่งซื้อถี่เกินไป กรุณารอสักครู่', 429);
      const body = orderSchema.parse(await req.json());

      // ตรวจข้อมูลติดต่อตามประเภท
      if ((body.type === 'TOPUP' || body.type === 'GIFT_PASS') && !body.contact?.playerId && !body.contact?.robloxUsername) {
        return err('กรุณากรอก Player ID หรือชื่อผู้ใช้ที่จะรับบริการ');
      }
      if (body.paymentMethod === 'BANK_TRANSFER' && !body.slipImage) {
        return err('กรุณาแนบสลิปการโอนเงิน');
      }

      const result = await db.$transaction(async (tx) => {
        const lines: { name: string; price: number; productId?: string; packageId?: string; meta?: string; deliveryInfo?: string | null; credentialSnapshot?: string | null }[] = [];
        let total = 0;

        for (const item of body.items) {
          if (body.type === 'GAME_ID') {
            // สินค้าไอดี: ต้องมี productId และขายได้คนละชิ้น ห้ามซื้อชิ้นเดียวกันซ้ำ
            if (!item.productId) throw new Error('BAD_REQUEST: รายการไอดีเกมต้องระบุสินค้า');
            if (lines.some((l) => l.productId === item.productId)) {
              throw new Error('BAD_REQUEST: ห้ามเลือกสินค้าไอดีชิ้นเดียวกันซ้ำ');
            }
            const product = await tx.product.findUnique({ where: { id: item.productId }, include: { category: { select: { game: true, deliveryMode: true } } } });
            if (!product || product.status === 'HIDDEN') throw new Error('BAD_REQUEST: ไม่พบสินค้านี้ในระบบ');
            if (product.status !== 'AVAILABLE' || product.stock < 1) throw new Error('BAD_REQUEST: สินค้าชิ้นนี้หมดสต็อกแล้ว');
            if (product.category.deliveryMode === 'ACCOUNT' && parseJson<{ username: string; password: string }[]>(product.credentialStock, []).length < 1) throw new Error('BAD_REQUEST: สินค้าชิ้นนี้หมดสต็อกแล้ว');
            total += product.price;
            lines.push({
              name: product.title, price: product.price, productId: product.id,
              meta: JSON.stringify({ code: product.code, game: product.category.game }),
              deliveryInfo: product.category.deliveryMode === 'ACCOUNT' ? null : null,
              credentialSnapshot: product.category.deliveryMode === 'ACCOUNT' ? product.credentialStock : null,
            });
          } else {
            if (!item.packageId) throw new Error('BAD_REQUEST: รายการเติมเกมต้องระบุแพ็กเกจ');
            const pack = await tx.topupPackage.findUnique({ where: { id: item.packageId }, include: { category: true } });
            if (!pack || !pack.active) throw new Error('BAD_REQUEST: ไม่พบแพ็กเกจนี้ในระบบ');
            total += pack.price;
            lines.push({
              name: pack.name, price: pack.price, packageId: pack.id,
              meta: JSON.stringify({ amount: pack.amount, game: pack.category.name }),
            });
          }
        }

        let orderStatus = 'PENDING_PAYMENT';
        let walletBalanceAfter: number | null = null;
        let paidWalletId: string | null = null;

        if (body.paymentMethod === 'WALLET') {
          // หักเงินจากกระเป๋าทันทีภายใน Transaction เดียวกัน
          const wallet = await tx.wallet.findUnique({ where: { userId: user.id } });
          if (!wallet) throw new Error('BAD_REQUEST: ไม่พบกระเป๋าเงิน');
          if (wallet.balance < total) throw new Error(`BAD_REQUEST: ยอดเงินในกระเป๋าไม่เพียงพอ (ต้องการ ฿${total})`);
          const updated = await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: total } },
          });
          walletBalanceAfter = updated.balance;
          paidWalletId = wallet.id;
          orderStatus = body.type === 'GAME_ID' && lines.every((line) => line.credentialSnapshot) ? 'COMPLETED' : 'PROCESSING';
        } else {
          orderStatus = 'REVIEWING';
        }

        const order = await tx.order.create({
          data: {
            orderNo: makeRef('LX'),
            userId: user.id,
            type: body.type,
            total,
            paymentMethod: body.paymentMethod,
            slipImage: body.slipImage ?? null,
            status: orderStatus,
            adminNote: body.type === 'TOPUP' ? 'กรุณาติดต่อเพจร้านเพื่อให้แอดมินดำเนินการเติมเกม' : body.type === 'GAME_ID' && lines.some((l) => !l.credentialSnapshot) ? 'กรุณาทักเพจร้านเพื่อรับสินค้า' : null,
            contactInfo: body.contact ? JSON.stringify(body.contact) : null,
            items: {
              create: lines.map((l) => ({
                productId: l.productId ?? null,
                packageId: l.packageId ?? null,
                name: l.name,
                price: l.price,
                quantity: 1,
                meta: l.meta ?? null,
                deliveryInfo: l.credentialSnapshot ? (() => { const list = parseJson<{ username: string; password: string }[]>(l.credentialSnapshot, []); const first = list[0]; return first ? `User : ${first.username}\nPass : ${first.password}` : null; })() : null,
              })),
            },
          },
          include: { items: true },
        });

        if (paidWalletId !== null && walletBalanceAfter !== null) {
          await tx.walletTransaction.create({
            data: {
              refCode: makeRef('WT'),
              walletId: paidWalletId,
              userId: user.id,
              type: 'PURCHASE',
              direction: 'OUT',
              amount: total,
              balanceAfter: walletBalanceAfter,
              description: `ชำระค่าสั่งซื้อ ${order.orderNo}`,
              orderId: order.id,
            },
          });
        }

        // ตัดสต็อกแบบ atomic ป้องกันลูกค้าสองคนซื้อชิ้นสุดท้ายพร้อมกัน
        for (const l of lines) {
          if (l.productId) {
            const inventory = l.credentialSnapshot ? parseJson<{ username: string; password: string }[]>(l.credentialSnapshot, []) : [];
            const nextInventory = l.credentialSnapshot ? JSON.stringify(inventory.slice(1)) : '[]';
            const changed = await tx.product.updateMany({
              where: { id: l.productId, status: 'AVAILABLE', stock: { gt: 0 }, ...(l.credentialSnapshot ? { credentialStock: l.credentialSnapshot } : {}) },
              data: { stock: { decrement: 1 }, soldCount: { increment: 1 }, ...(l.credentialSnapshot ? { credentialStock: nextInventory } : {}) },
            });
            if (changed.count !== 1) throw new Error('BAD_REQUEST: สินค้าชิ้นนี้หมดสต็อกแล้ว');
            const remaining = await tx.product.findUnique({ where: { id: l.productId }, select: { stock: true } });
            if (remaining?.stock === 0) {
              await tx.product.update({ where: { id: l.productId }, data: { status: 'SOLD' } });
            }
          }
        }

        return order;
      });

      return ok({ order: result }, { status: 201 });
    }

    // ===== คำขอเติมเงินเข้ากระเป๋า =====
    if (head === 'deposit') {
      const limited = rateLimit(`deposit:${user.id}`, 5, 10 * 60 * 1000);
      if (!limited.ok) return err('ส่งคำขอเติมเงินถี่เกินไป กรุณารอสักครู่', 429);

      const depositSchema = z
        .object({
          method: z.enum(['TRUEMONEY_ANGPAO', 'BANK_TRANSFER']),
          amount: z.number().min(20, 'เติมขั้นต่ำ 20 บาท').max(50000, 'เติมได้ไม่เกิน 50,000 บาทต่อครั้ง'),
          angpaoLink: z.string().trim().max(500).optional(),
          slipImage: z.string().max(300).optional(),
        })
        .refine((d) => d.method !== 'TRUEMONEY_ANGPAO' || (d.angpaoLink && d.angpaoLink.startsWith('https://')), {
          message: 'กรุณากรอกลิงก์ซองอังเปาที่ขึ้นต้นด้วย https://',
        })
        .refine((d) => d.method !== 'BANK_TRANSFER' || !!d.slipImage, {
          message: 'กรุณาแนบสลิปการโอนเงิน',
        });

      const body = depositSchema.parse(await req.json());
      const deposit = await db.deposit.create({
        data: {
          refNo: makeRef('DP'),
          userId: user.id,
          method: body.method,
          amount: body.amount,
          angpaoLink: body.angpaoLink ?? null,
          slipImage: body.slipImage ?? null,
        },
      });
      return ok({ deposit }, { status: 201 });
    }

    // ===== เปลี่ยนรหัสผ่านจากหน้าตั้งค่าบัญชี =====
    if (head === 'change-password') {
      const limited = rateLimit(`chgpass:${user.id}`, 5, 15 * 60 * 1000);
      if (!limited.ok) return err('พยายามหลายครั้งเกินไป กรุณารอสักครู่', 429);
      const body = z
        .object({
          currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
          newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร').max(72),
        })
        .parse(await req.json());
      const full = await db.user.findUnique({ where: { id: user.id } });
      if (!full || !verifyPassword(body.currentPassword, full.passwordHash)) {
        return err('รหัสผ่านปัจจุบันไม่ถูกต้อง', 401);
      }
      await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(body.newPassword) } });
      return ok({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    }

    // ===== รีวิว =====
    if (head === 'review') {
      const limited = rateLimit(`review:${user.id}`, 3, 24 * 60 * 60 * 1000);
      if (!limited.ok) return err('คุณส่งรีวิวถึงจำนวนสูงสุดของวันนี้แล้ว', 429);
      const reviewSchema = z.object({
        rating: z.number().int().min(1, 'เลือกคะแนน 1-5 ดาว').max(5),
        comment: z.string().trim().min(5, 'เขียนรีวิวอย่างน้อย 5 ตัวอักษร').max(500, 'รีวิวยาวเกินไป'),
        gameTag: z.enum(['freefire', 'roblox', 'giftpass', 'general']).optional(),
      });
      const body = reviewSchema.parse(await req.json());
      const review = await db.review.create({
        data: { userId: user.id, name: user.username, rating: body.rating, comment: body.comment, gameTag: body.gameTag ?? 'general' },
      });
      return ok({ review }, { status: 201 });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}
