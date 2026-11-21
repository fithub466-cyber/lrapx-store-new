# LrapX Store — คู่มือติดตั้ง ตั้งค่า และ Deploy

เว็บไซต์ร้านขายไอดีเกมและบริการเติมเกมระดับมืออาชีพ (Gaming Marketplace)

---

## 1. เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
| --- | --- |
| Framework | Next.js 16 (App Router, TypeScript 5) |
| Styling | Tailwind CSS 4 + shadcn/ui + Lucide Icons (ไม่มีการใช้ Emoji แทนไอคอน) |
| ฐานข้อมูล | Prisma ORM + SQLite (สลับเป็น PostgreSQL ได้ทันที ดูหัวข้อ 4) |
| การยืนยันตัวตน | Session Token เก็บใน httpOnly Cookie + เข้ารหัสรหัสผ่านด้วย scrypt |
| ฟอนต์ไทย | Kanit (หัวข้อ) + Noto Sans Thai (เนื้อความ) ผ่าน next/font |
| State | Zustand |

> หมายเหตุโครงสร้างหน้าเว็บ: ในสภาพแวดล้อมพรีวิวของระบบนี้ เว็บทำงานเป็น SPA ภายใต้ route `/` เดียว
> โดยใช้ hash routing (`/#/game-ids`, `/#/topup`, `/#/admin` ฯลฯ) เมื่อ deploy จริงสามารถแยกเป็น
> หลาย route ด้วย App Router ได้ตามต้องการ เพราะโค้ดทุกหน้าถูกแยกเป็น component ของตัวเองอยู่แล้ว

---

## 2. ติดตั้งและรันบนเครื่อง

```bash
# 1) ติดตั้ง dependencies (แนะนำ Bun แต่ใช้ npm/pnpm ได้เช่นกัน)
bun install

# 2) ตั้งค่า Environment Variables — ไฟล์ .env แถมมาพร้อมใน ZIP แล้ว
#    ถ้าสร้างเองให้ใช้ค่านี้:
#    DATABASE_URL=file:../db/custom.db
#    (Prisma อ้างอิง path จากตำแหน่ง prisma/schema.prisma จึงต้องขึ้น ../ เพื่อชี้ไปที่โฟลเดอร์ db/ ที่รากโปรเจกต์)

# 3) รันเว็บได้เลย — ใน ZIP แถมไฟล์ db/custom.db พร้อมข้อมูลตัวอย่าง (หมวดหมู่,
#    สินค้า, แพ็กเกจ, รีวิว, บัญชี admin) มาให้แล้ว
bun run dev   # http://localhost:3000
```

### ต้องการฐานข้อมูลใหม่เปล่า? (ไม่เอาข้อมูลตัวอย่าง)

```bash
rm db/custom.db        # ลบไฟล์ฐานข้อมูลตัวอย่างทิ้ง
bun run db:push        # สร้างตารางตาม Schema
bun prisma/seed.ts     # ใส่ข้อมูลตั้งต้น (หมวดหมู่, สินค้า, รีวิว, บัญชี admin)
```

### บัญชีเริ่มต้นหลัง seed

บัญชีเริ่มต้นจะถูกสร้างจากขั้นตอน seed ตามการตั้งค่าของระบบ โปรดตั้งรหัสผ่านใหม่และเก็บข้อมูลเข้าสู่ระบบเป็นความลับก่อนใช้งานจริง.

---

## 3. โครงสร้างโปรเจกต์

```
prisma/schema.prisma       # Schema ทั้งหมด (Users, Products, Categories, Orders,
                           #  OrderItems, Wallets, WalletTransactions, Deposits,
                           #  PaymentMethods, Reviews, Session, Setting ...)
prisma/seed.ts             # ข้อมูลตั้งต้น
src/app/api/auth/[action]/ # register / login / logout / me / forgot / reset
src/app/api/data/[...slug] # สินค้า หมวดหมู่ แพ็กเกจ คำสั่งซื้อ กระเป๋าเงิน เติมเงิน รีวิว ค้นหา
src/app/api/admin/[...slug]# หลังบ้าน (ตรวจสิทธิ์ ADMIN จาก Backend ทุกคำขอ)
src/app/api/upload/        # อัปโหลดสลิป (ตรวจ Magic Bytes + จำกัด 5MB)
src/components/            # shell(Header/Sidebar/Footer) home shop topup
                           # auth-view account admin purchase misc shared spa
src/lib/auth.ts            # scrypt, session, rate-limit
src/lib/format.ts          # รูปแบบเงิน/วันที่/สถานะภาษาไทย
public/images/             # โลโก้ (logo.png) และภาพประกอบ
public/uploads/            # สลิปที่ลูกค้าอัปโหลด
```

### การเปลี่ยนชื่อร้าน / โลโก้ / สี

- **ชื่อร้าน ช่องทางติดต่อ เลขบัญชี ข้อความ Hero**: เปลี่ยนได้ในหลังบ้าน > ตั้งค่าร้าน (บันทึกลงตาราง `Setting` ทันที ไม่ต้องแก้โค้ด)
- **โลโก้**: แทนที่ไฟล์ `public/images/logo.png`
- **สีธีม**: แก้ CSS Variables (`--primary`, `--gold`, `--background` ฯลฯ) ใน `src/app/globals.css`

---

## 4. เปลี่ยนไปใช้ PostgreSQL (แนะนำสำหรับ Production)

Schema เขียนให้สลับฐานข้อมูลได้ทันที (ไม่ใช้ฟีเจอร์เฉพาะ SQLite):

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"      // เปลี่ยนจาก sqlite
  url      = env("DATABASE_URL")
}
```

```bash
# .env
DATABASE_URL="postgresql://user:password@host:5432/lrapx?schema=public"

bun run db:push
bun prisma/seed.ts
```

ผู้ให้บริการฟรี/ราคาถูกที่ใช้ได้ทันที: Neon, Supabase, Railway

---

## 5. Deploy จริงบน Vercel (ตัวอย่าง)

1. Push โค้ดขึ้น GitHub
2. สร้างโปรเจกต์บน [vercel.com](https://vercel.com) → import repository
3. ตั้งค่า Environment Variables ใน Vercel:
   - `DATABASE_URL` — จุดเชื่อมต่อ PostgreSQL (จากข้อ 4)
4. รัน `bun run db:push` และ `bun prisma/seed.ts` จากเครื่องเชื่อมฐานข้อมูล Production หนึ่งครั้ง
5. Deploy — เสร็จ

### ข้อควรรู้เรื่องอัปโหลดสลิปบน Vercel

ระบบปัจจุบันเก็บสลิปใน `public/uploads/` ซึ่งทำงานบน VPS/Docker (มีพื้นที่เขียนได้) แต่
บน Vercel (serverless) ระบบไฟล์เป็น read-only — ให้ปรับ `src/app/api/upload/route.ts`
ให้เก็บรูปกับผู้ให้บริการจัดเก็บแทน เช่น Vercel Blob, Cloudinary หรือ S3
(จุดแก้มีจุดเดียวคือฟังก์ชัน POST ในไฟล์ upload)

---

## 6. การเปิดใช้ระบบชำระเงินจริง (สำคัญ)

ระบบปัจจุบันเป็นโครงสร้างรอต่อยอด **และไม่จำลองผลการชำระเงิน** — เงินเข้ากระเป๋าเฉพาะเมื่อแอดมินกดอนุมัติหลังตรวจสอบหลักฐานจริงเท่านั้น

| ช่องทาง | สถานะ | สิ่งที่ต้องทำเพิ่มเพื่อเปิดอัตโนมัติ |
| --- | --- | --- |
| ซองอังเปา TrueMoney | รอแอดมินตรวจสอบลิงก์ | เชื่อม API ผู้ให้บริการ (ถ้ามี) แล้วเรียกตรวจยอดใน `POST /api/data/deposit` ก่อนบันทึกสถานะ |
| โอนธนาคาร + สลิป | รอแอดมินตรวจสอบสลิป | เชื่อมระบบตรวจสลิปอัตโนมัติ (เช่น SlipCheck API) หรือใช้แอดมินตรวจเหมือนปัจจุบัน |
| ตัดบัตร/PromptPay จริง | ยังไม่มี | เพิ่ม Payment Gateway เช่น Omise / 2C2 / K-Payment แล้วทำ Webhook ยืนยันการจ่าย |

เก็บ API Keys ทั้งหมดใน Environment Variables เท่านั้น — ห้าม hardcode ในโค้ดหรือฝั่ง Frontend

---

## 7. ความปลอดภัยที่ติดตั้งไว้แล้ว

- รหัสผ่าน: scrypt + salt แบบ per-user (ไม่มีรหัสผ่านเป็นข้อความธรรมดาในระบบ)
- Session: token สุ่ม 256-bit เก็บใน httpOnly + SameSite=Lax cookie / DB เก็บเฉพาะ SHA-256 hash / หมดอายุ 7 วันแบบ sliding
- จำกัดการโจมตี: Rate limit การ login (5 ครั้ง/15 นาที), สมัคร, เติมเงิน, รีวิว, อัปโหลด
- SQL Injection: Prisma ORM ใช้ parameterized query ทุกคำสั่ง
- XSS: React escape ทุกข้อความ ไม่มี `dangerouslySetInnerHTML`
- การซื้อสินค้าชิ้นเดียว: ตรวจสถานะ + ปิดการขายภายใน `$transaction` เดียวกับการหักเงิน (กันซื้อซ้ำ/กันหักซ้ำ)
- อนุมัติเติมเงิน: ตรวจสถานะ PENDING ก่อนเพิ่มเงินทุกครั้ง (กันอนุมัติซ้ำ)
- อัปโหลด: ตรวจ Magic Bytes (PNG/JPG/WEBP), จำกัด 5MB, ตั้งชื่อไฟล์สุ่ม
- สิทธิ์ Admin: ตรวจจาก Backend ทุก endpoint `/api/admin/*` (ไม่ใช่แค่ซ่อนปุ่ม)
- ข้อมูลไอดี/โค้ดที่ส่งให้ลูกค้า (deliveryInfo) แสดงเฉพาะเจ้าของคำสั่งซื้อ ไม่ปรากฏในหน้าสาธารณะ

### Checklist ก่อนเปิดร้านจริง

- [ ] เปลี่ยนรหัสผ่าน admin และปิดบัญชี demo
- [ ] เปลี่ยนเลขบัญชี/พร้อมเพย์ในหลังบ้าน > ตั้งค่าร้านเป็นบัญชีจริง
- [ ] ย้ายฐานข้อมูลเป็น PostgreSQL + เปิด SSL
- [ ] ตั้งค่า HTTPS ทั้งโดเมน (Vercel ให้ฟรี)
- [ ] ต่อผู้ให้บริการชำระเงินจริง (ข้อ 6)
- [ ] Backup ฐานข้อมูลตามรอบ

---

## 8. คำสั่งที่ใช้บ่อย

```bash
bun run dev          # รันเว็บโหมดพัฒนา
bun run lint         # ตรวจคุณภาพโค้ด
bun run db:push      # อัปเดตตารางตาม schema
bun prisma/seed.ts   # รีเซ็ตข้อมูลตั้งต้น (ลบข้อมูลเดิมทั้งหมด)
bun run build        # build สำหรับ production
```
