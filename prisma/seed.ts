/**
 * Seed ข้อมูลตั้งต้นของ LrapX Store
 * รันด้วย: bun prisma/seed.ts
 */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync, randomUUID } from 'crypto';

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function ref(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}${randomBytes(2).toString('hex').toUpperCase()}`;
}

const IMG = {
  hero: '/images/hero-banner.png',
  ffCover: '/images/cover-freefire.png',
  rbCover: '/images/cover-roblox.png',
  gpCover: '/images/cover-giftpass.png',
  ff1: '/images/prod-ff-1.png',
  ff2: '/images/prod-ff-2.png',
  rb1: '/images/prod-rb-1.png',
  rb2: '/images/prod-rb-2.png',
};

async function main() {
  console.log('เริ่ม seed ข้อมูล LrapX Store...');

  // ===== ล้างข้อมูลเดิม =====
  await db.walletTransaction.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.deposit.deleteMany();
  await db.review.deleteMany();
  await db.topupPackage.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.paymentMethod.deleteMany();
  await db.setting.deleteMany();
  await db.passwordResetToken.deleteMany();
  await db.session.deleteMany();
  await db.wallet.deleteMany();
  await db.user.deleteMany();

  // ===== ผู้ใช้: Admin + Demo =====
  // กำหนดรหัสผ่านผ่าน environment variables เท่านั้น ห้ามฝังรหัสผ่านใน source code
  const adminPassword = process.env.ADMIN_PASSWORD;
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!adminPassword || !demoPassword) {
    throw new Error('ต้องกำหนด ADMIN_PASSWORD และ DEMO_PASSWORD ก่อนรัน seed');
  }
  const admin = await db.user.create({
    data: {
      username: 'admin',
      email: 'admin@lrapx.store',
      passwordHash: hashPassword(adminPassword),
      role: 'ADMIN',
    },
  });
  const demo = await db.user.create({
    data: {
      username: 'demo',
      email: 'demo@lrapx.store',
      passwordHash: hashPassword(demoPassword),
      role: 'USER',
    },
  });
  console.log('สร้างผู้ใช้ admin / demo แล้ว');

  // ===== กระเป๋าเงิน demo =====
  const wallet = await db.wallet.create({
    data: { userId: demo.id, balance: 500 },
  });

  // ===== หมวดหมู่ =====
  const ffId = await db.category.create({
    data: {
      slug: 'freefire-id', name: 'ไอดีเกม Free Fire', type: 'GAME_ID', game: 'freefire',
      image: IMG.ffCover,
      description: 'ไอดีเกม Free Fire สำเร็จรูป คัดสรรคุณภาพ มีสกินและเพชรพร้อมขาย ส่งข้อมูลไวภายใน 10 นาที',
      sortOrder: 1,
    },
  });
  const rbId = await db.category.create({
    data: {
      slug: 'roblox-id', name: 'ไอดีเกม Roblox', type: 'GAME_ID', game: 'roblox',
      image: IMG.rbCover,
      description: 'ไอดี Roblox พร้อมของลิมิเต็ด ทุกไอดีตรวจสอบสถานะก่อนส่งมอบ ปลอดภัย มีประกันหลังการขาย 7 วัน',
      sortOrder: 2,
    },
  });
  const ffTopup = await db.category.create({
    data: {
      slug: 'freefire-topup', name: 'เติมเกม Free Fire', type: 'TOPUP', game: 'freefire',
      image: IMG.ffCover,
      description: 'เติมเพชร Free Fire ราคาดีกว่าในเกม ส่งตรงผ่าน Player ID ระบบตรวจสอบอัตโนมัติ',
      sortOrder: 3,
    },
  });
  const rbTopup = await db.category.create({
    data: {
      slug: 'roblox-topup', name: 'เติมเกม Roblox', type: 'TOPUP', game: 'roblox',
      image: IMG.rbCover,
      description: 'เติม Robux และสมาชิก Roblox Premium ราคาถูก รับเองในเกมผ่านระบบ Gamepass ปลอดภัย 100%',
      sortOrder: 4,
    },
  });
  const gpCat = await db.category.create({
    data: {
      slug: 'giftpass', name: 'Gift Game Pass', type: 'TOPUP', game: 'giftpass',
      image: IMG.gpCover,
      description: 'บัตรสมาชิกและ Game Pass เด็ด ๆ ทั้ง Roblox และ Free Fire ส่งโค้ดทางแชทหลังชำระเงิน',
      sortOrder: 5,
    },
  });
  console.log('สร้างหมวดหมู่ 5 หมวดแล้ว');

  // ===== สินค้าไอดี Free Fire =====
  const ffProducts = [
    { code: 'FF-ID-0001', title: 'ไอดี FF นักสู้ระดับฮีโร่ สกินเกาหลี 42 ชุด', price: 450, status: 'AVAILABLE', featured: true, details: [
      { label: 'เลเวล', value: '68' }, { label: 'สกินทั้งหมด', value: '42 สกิน (รวมชุดเกาหลี 8 ชุด)' },
      { label: 'เพชรในไอดี', value: '520 เพชร' }, { label: 'อาวุธเด่น', value: 'AK-47 Cobalt, MP40 Golden' },
      { label: 'แบนเนอร์', value: 'Grandmaster ฤดูล่าสุด' } ] },
    { code: 'FF-ID-0002', title: 'ไอดี FF เพชรเยอะ 1,200+ พร้อมบันเดิลดาว', price: 890, status: 'AVAILABLE', featured: true, details: [
      { label: 'เลเวล', value: '74' }, { label: 'เพชรในไอดี', value: '1,240 เพชร' },
      { label: 'สกินเด่น', value: 'ชุดดาวหรง, Alok, Chrono' }, { label: 'สถานะบัญชี', value: 'ผูกอีเมลใหม่ได้ทันที' } ] },
    { code: 'FF-ID-0003', title: 'ไอดี FF เริ่มต้นคุ้มค่า ราคาเข้าถึงง่าย', price: 150, status: 'AVAILABLE', featured: false, details: [
      { label: 'เลเวล', value: '35' }, { label: 'สกินทั้งหมด', value: '12 สกิน' },
      { label: 'เพชรในไอดี', value: '90 เพชร' }, { label: 'เหมาะกับ', value: 'มือใหม่เริ่มเกมสบาย ๆ' } ] },
    { code: 'FF-ID-0004', title: 'ไอดี FF Elite Pass ครบทุกซีซัน 2 ปี', price: 1250, status: 'AVAILABLE', featured: false, details: [
      { label: 'เลเวล', value: '80' }, { label: 'Elite Pass', value: 'ครบ 24 ซีซัน' },
      { label: 'สกินทั้งหมด', value: '85 สกิน' }, { label: 'ของสะสม', value: 'ลูกเต๋าสุ่งรางวัล 150+ ชิ้น' } ] },
    { code: 'FF-ID-0005', title: 'ไอดี FF สายสนิป หัวดำ+หัวแดง พร้อมปืนล้ำค่า', price: 690, status: 'AVAILABLE', featured: true, details: [
      { label: 'เลเวล', value: '71' }, { label: 'ปืนเด่น', value: 'AWM Cobra, Kar98k Flaming Red' },
      { label: 'หัวปืน', value: 'หัวดำ 2, หัวแดง 3' }, { label: 'สกินทั้งหมด', value: '36 สกิน' } ] },
    { code: 'FF-ID-0006', title: 'ไอดี FF เกิร์ลย้อมแมว ชุดพิงค์ครบเซ็ต', price: 380, status: 'AVAILABLE', featured: false, details: [
      { label: 'เลเวล', value: '52' }, { label: 'สกินเด่น', value: 'ชุดพิงค์ Devil, ชุด Angelical' },
      { label: 'เพชรในไอดี', value: '210 เพชร' }, { label: 'สกินทั้งหมด', value: '25 สกิน' } ] },
    { code: 'FF-ID-0007', title: 'ไอดี FF แรงค์เกรนด์มาสเตอร์ เครื่องเต็มระบบ', price: 990, status: 'AVAILABLE', featured: false, details: [
      { label: 'เลเวล', value: '77' }, { label: 'แรงค์', value: 'Grandmaster 4 ซีซันติด' },
      { label: 'สกินทั้งหมด', value: '48 สกิน' }, { label: 'อาวุธเด่น', value: 'M1014 Booyah Day, SCAR Titan' } ] },
    { code: 'FF-ID-0008', title: 'ไอดี FF ของลิมิเต็ดวันเกมส์ครบโปร', price: 1490, status: 'SOLD', featured: false, details: [
      { label: 'เลเวล', value: '82' }, { label: 'ของลิมิเต็ด', value: 'ชุดวันเกมส์ทุกรุ่น' },
      { label: 'สกินทั้งหมด', value: '96 สกิน' } ] },
    { code: 'FF-ID-0009', title: 'ไอดี FF เพชร 3,000+ สำหรับสายเก็บของ', price: 2100, status: 'AVAILABLE', featured: false, details: [
      { label: 'เลเวล', value: '69' }, { label: 'เพชรในไอดี', value: '3,080 เพชร' },
      { label: 'สกินทั้งหมด', value: '30 สกิน' }, { label: 'ของสะสม', value: 'ลูกเต๋า 200+ ตั๋วรีสกิน 12 ใบ' } ] },
    { code: 'FF-ID-0010', title: 'ไอดี FF มือสองสภาพดี ราคาพิเศษ', price: 220, status: 'SOLD', featured: false, details: [
      { label: 'เลเวล', value: '44' }, { label: 'สกินทั้งหมด', value: '18 สกิน' },
      { label: 'หมายเหตุ', value: 'ไอดีมือสอง ตรวจสอบสภาพกับแอดมินก่อนซื้อ' } ] },
  ];
  for (let i = 0; i < ffProducts.length; i++) {
    const p = ffProducts[i];
    await db.product.create({
      data: {
        code: p.code, title: p.title, categoryId: ffId.id, price: p.price, status: p.status, featured: p.featured,
        images: JSON.stringify(i % 2 === 0 ? [IMG.ff1, IMG.ff2, IMG.ffCover] : [IMG.ff2, IMG.ff1, IMG.ffCover]),
        description: `${p.title} — ไอดีคุณภาพจากร้าน LrapX Store ตรวจสอบสถานะทุกไอดีก่อนส่งมอบ เปลี่ยนข้อมูลผูกไอดี (อีเมล/รหัสผ่าน) ได้ทันทีหลังรับของ พร้อมประกันไอดี 7 วันเต็ม`,
        details: JSON.stringify(p.details),
        soldCount: Math.floor(Math.random() * 40) + 5,
      },
    });
  }

  // ===== สินค้าไอดี Roblox =====
  const rbProducts = [
    { code: 'RB-ID-0001', title: 'ไอดี Roblox ของลิมิเต็ดโบนัสสายปั่นเกม', price: 550, status: 'AVAILABLE', featured: true, details: [
      { label: 'ของลิมิเต็ด', value: 'Dominus Frigidus, หมวก Rainbow Shaggy' },
      { label: 'Robux คงเหลือ', value: '350 Robux' }, { label: 'อายุไอดี', value: '3 ปี' },
      { label: 'สถานะ', value: 'ไม่มีประวัติแบน' } ] },
    { code: 'RB-ID-0002', title: 'ไอดี Roblox Premium 2200 พร้อมประวัติสะอาด', price: 950, status: 'AVAILABLE', featured: true, details: [
      { label: 'สมาชิก', value: 'Roblox Premium 2200 คงเหลือ 25 วัน' },
      { label: 'Robux คงเหลือ', value: '450 Robux' }, { label: 'อายุไอดี', value: '5 ปี' },
      { label: 'สถานะ', value: 'ผูกอีเมลใหม่ได้ทันที' } ] },
    { code: 'RB-ID-0003', title: 'ไอดี Roblox ของเกม Blox Fruits สายฮังเกอร์', price: 790, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'Permanent Portal + Lightning Fruit' },
      { label: 'เลเวลในเกม', value: '2450' }, { label: 'Race', value: 'Human V4' } ] },
    { code: 'RB-ID-0004', title: 'ไอดี Roblox สายแต่งบ้าน Adopt Me เต็มระบบ', price: 420, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'Neon Unicorn + Fly Ride Shadow Dragon' },
      { label: 'เงินในเกม', value: '12,000 Bucks' }, { label: 'อายุไอดี', value: '4 ปี' } ] },
    { code: 'RB-ID-0005', title: 'ไอดี Roblox หัวหมวกลิมิเต็ม 2019 หายาก', price: 1250, status: 'AVAILABLE', featured: true, details: [
      { label: 'ของลิมิเต็ด', value: 'Herringonkonon (2019), หมวก Halloween 2019 ชุด' },
      { label: 'Robux คงเหลือ', value: '120 Robux' }, { label: 'อายุไอดี', value: '6 ปี' } ] },
    { code: 'RB-ID-0006', title: 'ไอดี Roblox เริ่มต้น ราคาประหยัด พร้อมเล่น', price: 180, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'ของพื้นฐานครบ เล่นเกมยอดนิยมได้ทุกเกม' },
      { label: 'อายุไอดี', value: '1 ปี' }, { label: 'เหมาะกับ', value: 'มือใหม่เริ่มต้นสายเกมเมอร์' } ] },
    { code: 'RB-ID-0007', title: 'ไอดี Roblox สาย Murder Mystery มีดล้ำค่า', price: 660, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'มีด Godly 3 เมส, ปืน Ancient 2 เมส' },
      { label: 'อายุไอดี', value: '3 ปี' } ] },
    { code: 'RB-ID-0008', title: 'ไอดี Roblox คอลเลกชันเกมนักสู้เต็มระบบ', price: 1100, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'ครบทุกโหมด The Strongest Battlegrounds' },
      { label: 'Robux คงเหลือ', value: '800 Robux' } ] },
    { code: 'RB-ID-0009', title: 'ไอดี Roblox ของลิมิเต็ด Halloween ราคาพิเศษ', price: 890, status: 'SOLD', featured: false, details: [
      { label: 'ของลิมิเต็ด', value: 'ชุด Halloween Event 2022 ครบ' } ] },
    { code: 'RB-ID-0010', title: 'ไอดี Roblox สายเก็บ Pet Sim เต็มคลาสสิก', price: 480, status: 'AVAILABLE', featured: false, details: [
      { label: 'ของในเกม', value: 'Huge Cat + Titanic Pet' },
      { label: 'เงินในเกม', value: 'ตัวเลขสูงระดับ Endgame' } ] },
  ];
  for (let i = 0; i < rbProducts.length; i++) {
    const p = rbProducts[i];
    await db.product.create({
      data: {
        code: p.code, title: p.title, categoryId: rbId.id, price: p.price, status: p.status, featured: p.featured,
        images: JSON.stringify(i % 2 === 0 ? [IMG.rb1, IMG.rb2, IMG.rbCover] : [IMG.rb2, IMG.rb1, IMG.rbCover]),
        description: `${p.title} — ไอดี Roblox จาก LrapX Store ส่งข้อมูลเข้าสู่ระบบทางแชทหลังตรวจสอบการชำระเงิน พร้อมคู่มือเปลี่ยนอีเมลและรหัสผ่านทีละขั้น ประกันไอดี 7 วัน`,
        details: JSON.stringify(p.details),
        soldCount: Math.floor(Math.random() * 35) + 3,
      },
    });
  }
  console.log('สร้างสินค้าไอดี 20 ชิ้นแล้ว');

  // ===== แพ็กเกจเติมเกม =====
  const ffPacks = [
    { name: '70 เพชร', amount: 70, price: 35, badge: null, sortOrder: 1 },
    { name: '140 เพชร', amount: 140, price: 69, badge: null, sortOrder: 2 },
    { name: '355 เพชร', amount: 355, price: 169, badge: 'ยอดนิยม', sortOrder: 3 },
    { name: '500 เพชร', amount: 500, price: 239, badge: null, sortOrder: 4 },
    { name: '720 เพชร', amount: 720, price: 339, badge: 'คุ้มสุด', sortOrder: 5 },
    { name: '1,000 เพชร', amount: 1000, price: 469, badge: null, sortOrder: 6 },
    { name: '1,450 เพชร', amount: 1450, price: 679, badge: null, sortOrder: 7 },
    { name: '2,000 เพชร', amount: 2000, price: 935, badge: null, sortOrder: 8 },
    { name: 'สมาชิกรายสัปดาห์ (Weekly)', amount: null, price: 39, badge: null, sortOrder: 9 },
    { name: 'สมาชิกรายเดือน (Monthly)', amount: null, price: 149, badge: 'ยอดนิยม', sortOrder: 10 },
  ];
  for (const p of ffPacks) {
    await db.topupPackage.create({ data: { ...p, categoryId: ffTopup.id } });
  }
  const rbPacks = [
    { name: '100 Robux', amount: 100, price: 45, badge: null, sortOrder: 1 },
    { name: '200 Robux', amount: 200, price: 89, badge: null, sortOrder: 2 },
    { name: '400 Robux', amount: 400, price: 169, badge: 'ยอดนิยม', sortOrder: 3 },
    { name: '800 Robux', amount: 800, price: 329, badge: null, sortOrder: 4 },
    { name: '1,000 Robux', amount: 1000, price: 405, badge: 'คุ้มสุด', sortOrder: 5 },
    { name: '2,000 Robux', amount: 2000, price: 799, badge: null, sortOrder: 6 },
    { name: '5,000 Robux', amount: 5000, price: 1950, badge: null, sortOrder: 7 },
    { name: 'Roblox Premium 450', amount: 450, price: 129, badge: null, sortOrder: 8 },
    { name: 'Roblox Premium 1000', amount: 1000, price: 259, badge: null, sortOrder: 9 },
    { name: 'Roblox Premium 2200', amount: 2200, price: 399, badge: 'ยอดนิยม', sortOrder: 10 },
  ];
  for (const p of rbPacks) {
    await db.topupPackage.create({ data: { ...p, categoryId: rbTopup.id } });
  }
  const gpPacks = [
    // สินค้าแนะนำ (โชว์หน้าแรก) — ไก่ตัน, ผลโมจิตื่น และอื่น ๆ อีก 4 อย่าง
    { name: 'ไก่ตัน', amount: null, price: 35, badge: 'ของฮิต', sortOrder: 1 },
    { name: 'ผลโมจิตื่น', amount: null, price: 149, badge: 'ยอดนิยม', sortOrder: 2 },
    { name: 'ผลมังกรตื่น', amount: null, price: 199, badge: 'ของหายาก', sortOrder: 3 },
    { name: 'ผลเปลวไฟตื่น', amount: null, price: 99, badge: null, sortOrder: 4 },
    { name: 'ผลสายฟ้าตื่น', amount: null, price: 119, badge: null, sortOrder: 5 },
    { name: 'ผลน้ำแข็งตื่น', amount: null, price: 89, badge: null, sortOrder: 6 },
    // บัตร / Game Pass เดิม
    { name: 'Blox Fruits — Permanent Portal', amount: null, price: 690, badge: 'ยอดนิยม', sortOrder: 7 },
    { name: 'Blox Fruits — Permanent Dough', amount: null, price: 690, badge: null, sortOrder: 8 },
    { name: 'Blox Fruits — Permanent Lightning', amount: null, price: 750, badge: 'มาใหม่', sortOrder: 9 },
    { name: 'Free Fire — สมาชิกรายเดือน Plus', amount: null, price: 199, badge: null, sortOrder: 10 },
    { name: 'Free Fire — บัตรสุ่มรางวัล 10 ครั้ง', amount: null, price: 99, badge: null, sortOrder: 11 },
    { name: 'Roblox — บัตรของขวัญ 500 Robux', amount: 500, price: 229, badge: null, sortOrder: 12 },
    { name: 'Roblox — ชุด Game Pass สุ่มของรางวัล', amount: null, price: 149, badge: null, sortOrder: 13 },
  ];
  for (const p of gpPacks) {
    await db.topupPackage.create({ data: { ...p, categoryId: gpCat.id } });
  }
  console.log('สร้างแพ็กเกจเติมเกม 33 แพ็กแล้ว');

  // ===== รีวิว =====
  const reviews = [
    { name: 'Kritsada_089', rating: 5, gameTag: 'freefire', comment: 'ซื้อไอดี FF มา 2 ไอดีแล้ว ของตรงปกทุกอย่าง แอดมินส่งข้อมูลไวมาก ใน 10 นาทีได้ไอดีแล้ว เปลี่ยนอีเมลควบคุมเองได้เลย' },
    { name: 'Parmmyz', rating: 5, gameTag: 'roblox', comment: 'ไอดี Roblox ของลิมิเต็ดสวยมาก ราคาถูกกว่าที่เคยซื้อจากที่อื่น แถมมีคู่มือเปลี่ยนข้อมูลให้ด้วย ประทับใจครับ' },
    { name: 'ธนกฤต GG', rating: 4, gameTag: 'freefire', comment: 'เติมเพชร 355 หายไปไม่ถึง 5 นาทีเข้าเกมเลย ราคาดีกว่าเติมในแอป จะกลับมาเติมอีกแน่นอน' },
    { name: 'MindZap_', rating: 5, gameTag: 'roblox', comment: 'เติม Robux ผ่านเว็บนี้ปีกว่าแล้ว ไม่เคยมีปัญหา รับผ่านเกมเมสปลอดภัยดี แนะนำให้เพื่อนมาใช้หลายคนแล้ว' },
    { name: 'Bankzazaa', rating: 5, gameTag: 'giftpass', comment: 'ซื้อ Permanent Portal ให้น้อง โค้ดส่งทางแชทไว ใช้ได้จริงทุกฟีเจอร์ ขอบคุณครับ' },
    { name: 'Namo_112', rating: 4, gameTag: 'freefire', comment: 'ไอดีตรงรายละเอียด สกินครบตามที่ประกาศ ขอดาว 4 เพราะรออนุมัติสลิปประมาณ 20 นาที แต่แอดมินตอบแชทตลอด' },
    { name: 'JubJubGames', rating: 5, gameTag: 'general', comment: 'เว็บใช้งานง่าย จ่ายด้วยยอดกระเป๋าจบในคลิกเดียว มีประวัติคำสั่งซื้อให้ดูย้อนหลังครบ ทำเว็บมาเป็นระบบดีจริง ๆ' },
    { name: 'Poom-Za', rating: 5, gameTag: 'roblox', comment: 'ซื้อไอดี Premium 2200 มาลุย ใช้มาเดือนกว่าแล้วเดินต่อเนียน ไม่มีปัญหาแบนใด ๆ ของแท้ครับ' },
  ];
  for (const r of reviews) {
    await db.review.create({ data: { ...r, userId: r.name === 'Kritsada_089' ? demo.id : null } });
  }
  console.log('สร้างรีวิว 8 รายการแล้ว');

  // ===== ช่องทางชำระเงิน =====
  await db.paymentMethod.create({
    data: {
      type: 'BANK', bankName: 'ธนาคารกสิกรไทย (KBank)', accountName: 'บริษัท แลรปเอ็กซ์ สโตร์ จำกัด',
      accountNumber: '123-4-56789-0', promptPay: '08x-xxx-xxxx',
    },
  });
  await db.paymentMethod.create({
    data: { type: 'TRUEMONEY', accountName: 'LrapX Store Wallet', accountNumber: '08x-xxx-xxxx' },
  });

  // ===== ตั้งค่าร้าน =====
  const settings: Record<string, string> = {
    store_name: 'LrapX Store',
    store_tagline: 'ศูนย์รวมไอดีเกมสำเร็จรูปและบริการเติมเกมระดับมืออาชีพ',
    hero_title: 'พร้อมลุยแล้วหรือยัง?',
    hero_subtitle: 'ไอดีเกมคุณภาพ เติมเกมราคาดี ส่งไวปลอดภัย มีประกัน — เปิดให้บริการ 24 ชั่วโมง',
    announcement: 'โปรเปิดร้าน: สมัครสมาชิกใหม่วันนี้ รับส่วนลด 5% ทุกคำสั่งซื้อแรก',
    contact_line: '@lrapxstore',
    contact_facebook: 'fb.com/lrapxstore',
    contact_phone: '08x-xxx-xxxx',
    contact_email: 'support@lrapx.store',
    contact_hours: 'ทุกวัน 09:00 - 24:00 น.',
    bank_name: 'ธนาคารกสิกรไทย (KBank)',
    bank_account_name: 'บริษัท แลรปเอ็กซ์ สโตร์ จำกัด',
    bank_account_number: '123-4-56789-0',
    bank_promptpay: '08x-xxx-xxxx',
    policy_delivery: 'สินค้าไอดีเกมส่งข้อมูลทางแชทภายใน 10-30 นาทีหลังชำระเงินสำเร็จ / เติมเกมเข้าไอดีภายใน 5-15 นาที',
    policy_warranty: 'ไอดีเกมทุกไอดีมีประกัน 7 วันเต็ม หากมีปัญหาการเข้าใช้งานติดต่อแอดมินได้ทันที',
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.create({ data: { key, value } });
  }
  console.log('บันทึกตั้งค่าร้านแล้ว');

  // ===== คำสั่งซื้อตัวอย่างของ demo =====
  const product1 = await db.product.findUnique({ where: { code: 'FF-ID-0003' } });
  const orderNo = `LX-${Date.now().toString().slice(-8)}`;
  const order = await db.order.create({
    data: {
      orderNo, userId: demo.id, type: 'GAME_ID', total: product1!.price, paymentMethod: 'WALLET',
      status: 'COMPLETED', contactInfo: JSON.stringify({ note: 'ขอรับข้อมูลทางแชทเว็บ' }),
    },
  });
  await db.orderItem.create({
    data: {
      orderId: order.id, productId: product1!.id, name: product1!.title, price: product1!.price,
      meta: JSON.stringify({ code: product1!.code }), deliveryInfo: 'ส่งข้อมูลไอดี+รหัสผ่านทางแชทแล้ว กรุณาเปลี่ยนรหัสผ่านทันที',
    },
  });
  await db.walletTransaction.create({
    data: {
      refCode: ref('WT'), walletId: wallet.id, userId: demo.id, type: 'TOPUP', direction: 'IN',
      amount: 720, balanceAfter: 720, description: 'เติมเงินผ่านธนาคาร (สลิปได้รับการอนุมัติ)',
    },
  });
  await db.walletTransaction.create({
    data: {
      refCode: ref('WT'), walletId: wallet.id, userId: demo.id, type: 'PURCHASE', direction: 'OUT',
      amount: product1!.price, balanceAfter: 220, description: `ซื้อสินค้าไอดีเกม ${product1!.code}`,
      orderId: order.id,
    },
  });
  await db.walletTransaction.create({
    data: {
      refCode: ref('WT'), walletId: wallet.id, userId: demo.id, type: 'TOPUP', direction: 'IN',
      amount: 280, balanceAfter: 500, description: 'เติมเงินผ่านซองอังเปา TrueMoney Wallet',
    },
  });
  await db.product.update({ where: { code: 'FF-ID-0003' }, data: { soldCount: { increment: 1 } } });
  console.log('สร้างคำสั่งซื้อและประวัติกระเป๋าเงินตัวอย่างแล้ว');

  console.log('=== Seed เสร็จสมบูรณ์ ===');
  console.log('Admin: admin@lrapx.store / Admin@LrapX2024');
  console.log('Demo:  demo@lrapx.store / Demo1234 (ยอดกระเป๋า 500 บาท)');
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
