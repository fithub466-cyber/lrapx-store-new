/**
 * ล้างบัญชีทดสอบออกจากฐานข้อมูล (ไม่ลบไฟล์ DB จึงไม่กระทบ server ที่รันอยู่)
 * รันด้วย: bun scripts/cleanup-test-users.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const TARGETS = ['mobileuser']; // ชื่อบัญชีทดสอบที่จะลบ

async function main() {
  for (const username of TARGETS) {
    const user = await db.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`ข้าม ${username}: ไม่พบในระบบ`);
      continue;
    }
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.walletTransaction.deleteMany({ where: { wallet: { userId: user.id } } });
    await db.wallet.deleteMany({ where: { userId: user.id } });
    await db.order.deleteMany({ where: { userId: user.id } });
    await db.deposit.deleteMany({ where: { userId: user.id } });
    await db.review.deleteMany({ where: { userId: user.id } });
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await db.user.delete({ where: { id: user.id } });
    console.log(`ลบบัญชีทดสอบ ${username} แล้ว`);
  }
  const users = await db.user.findMany({ select: { username: true, role: true } });
  console.log('ผู้ใช้คงเหลือ:', JSON.stringify(users));
}

main().finally(() => db.$disconnect());
