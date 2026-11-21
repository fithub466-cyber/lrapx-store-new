/**
 * เพิ่ม "สินค้าแนะนำ" (ไก่ตัน, ผลโมจิตื่น และอื่น ๆ) ลงฐานข้อมูลที่ใช้งานอยู่จริง
 * แบบไม่ทำลายข้อมูลเดิม (ไม่ลบผู้ใช้/คำสั่งซื้อ) — รันซ้ำได้ปลอดภัย
 * รันด้วย: bun scripts/add-recommended-items.ts
 */
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// ของแนะนำที่จะโชว์หน้าแรก (sortOrder 1-6)
const NEW_ITEMS = [
  { name: 'ไก่ตัน', price: 35, badge: 'ของฮิต', sortOrder: 1 },
  { name: 'ผลโมจิตื่น', price: 149, badge: 'ยอดนิยม', sortOrder: 2 },
  { name: 'ผลมังกรตื่น', price: 199, badge: 'ของหายาก', sortOrder: 3 },
  { name: 'ผลเปลวไฟตื่น', price: 99, badge: null, sortOrder: 4 },
  { name: 'ผลสายฟ้าตื่น', price: 119, badge: null, sortOrder: 5 },
  { name: 'ผลน้ำแข็งตื่น', price: 89, badge: null, sortOrder: 6 },
];

// แพ็กเกจเดิมของหมวด giftpass — ปรับ sortOrder ไปต่อท้าย
const EXISTING_ORDER = [
  'Blox Fruits — Permanent Portal',
  'Blox Fruits — Permanent Dough',
  'Blox Fruits — Permanent Lightning',
  'Free Fire — สมาชิกรายเดือน Plus',
  'Free Fire — บัตรสุ่มรางวัล 10 ครั้ง',
  'Roblox — บัตรของขวัญ 500 Robux',
  'Roblox — ชุด Game Pass สุ่มของรางวัล',
];

async function main() {
  const gp = await db.category.findUnique({ where: { slug: 'giftpass' } });
  if (!gp) throw new Error('ไม่พบหมวด giftpass');

  // 1) ปรับลำดับแพ็กเกจเดิมไปไว้หลัง (7+)
  for (let i = 0; i < EXISTING_ORDER.length; i++) {
    await db.topupPackage.updateMany({
      where: { categoryId: gp.id, name: EXISTING_ORDER[i] },
      data: { sortOrder: 7 + i },
    });
  }

  // 2) เพิ่มของแนะนำ 6 ชิ้น (ถ้ายังไม่มีชื่อนี้ในหมวด)
  let added = 0;
  for (const item of NEW_ITEMS) {
    const exists = await db.topupPackage.findFirst({
      where: { categoryId: gp.id, name: item.name },
    });
    if (exists) {
      await db.topupPackage.update({ where: { id: exists.id }, data: { price: item.price, badge: item.badge, sortOrder: item.sortOrder } });
      console.log(`มีอยู่แล้ว — อัปเดต: ${item.name}`);
    } else {
      await db.topupPackage.create({ data: { ...item, categoryId: gp.id } });
      console.log(`เพิ่มแล้ว: ${item.name}`);
      added++;
    }
  }

  const total = await db.topupPackage.count({ where: { categoryId: gp.id } });
  console.log(`หมวด giftpass มีทั้งหมด ${total} แพ็ก (เพิ่มใหม่ ${added})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
