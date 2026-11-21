/**
 * ล้างข้อมูลทดสอบจากการตรวจสอบระบบ: สินค้าทดสอบ + คำขอเติมเงินทดสอบ + ยอดกระเป๋าทดสอบ
 * ใช้: bun run scripts/cleanup-test-data.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  // 1) ลบสินค้าทดสอบ (รหัสขึ้นต้น ID- และชื่อมีคำว่า "ทดสอบ")
  const testProducts = await db.product.findMany({
    where: { title: { contains: 'ทดสอบ' } },
    select: { id: true, code: true, title: true },
  });
  for (const p of testProducts) {
    await db.product.delete({ where: { id: p.id } }).catch(async () => {
      // มีประวัติซื้อ → ซ่อนแทน
      await db.product.update({ where: { id: p.id }, data: { status: 'HIDDEN' } });
    });
    console.log('ลบสินค้าทดสอบ:', p.code, p.title);
  }

  // 2) ลบคำขอเติมเงินทดสอบ + รายการกระเป๋าที่เกี่ยวข้อง + รีเซ็ตยอดกระเป๋าของ admin
  const admins = await db.user.findMany({ where: { role: 'ADMIN' }, select: { id: true, username: true } });
  for (const admin of admins) {
    const testDeposits = await db.deposit.findMany({
      where: { userId: admin.id, refNo: { startsWith: 'DP-' } },
      orderBy: { createdAt: 'desc' },
      take: 3, // คำขอทดสอบล่าสุด (สร้างจากการตรวจระบบเท่านั้น)
    });
    for (const d of testDeposits) {
      await db.deposit.delete({ where: { id: d.id } });
      console.log('ลบคำขอเติมเงินทดสอบ:', d.refNo, d.amount, 'บาท');
    }
    // ลบรายการ TOPUP ล่าสุดจากการทดสอบและรีเซ็ตยอดเป็น 0
    const wallet = await db.wallet.findUnique({ where: { userId: admin.id } });
    if (wallet) {
      await db.walletTransaction.deleteMany({ where: { walletId: wallet.id, type: 'TOPUP' } });
      await db.wallet.update({ where: { id: wallet.id }, data: { balance: 0 } });
      console.log(`รีเซ็ตกระเป๋าของ ${admin.username} เป็น 0 บาท`);
    }
  }
}

main()
  .then(() => console.log('เสร็จสิ้น'))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
