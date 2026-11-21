/**
 * API รูปโปรไฟล์: /api/avatar
 * POST   : อัปโหลดรูปโปรไฟล์ของผู้ใช้ที่ล็อกอิน (multipart/form-data: file)
 * DELETE : ลบรูปโปรไฟล์ (ตั้งค่า avatar เป็น null)
 * ความปลอดภัย: ตรวจ Magic Bytes (ไม่เชื่อ Content-Type), จำกัด 3MB,
 * ตั้งชื่อไฟล์ใหม่แบบสุ่มป้องกัน path traversal, ลบไฟล์เก่าทิ้งทุกครั้งที่เปลี่ยน
 */
import { NextRequest } from 'next/server';
import { err, handleError, requireUser } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/auth';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

const MAX_SIZE = 3 * 1024 * 1024; // 3MB พอสำหรับรูปโปรไฟล์

function detectImageType(buf: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'webp';
  return null;
}

function oldAvatarPath(avatar: string | null | undefined): string | null {
  if (!avatar) return null;
  // รับเฉพาะ path ภายใต้ /uploads/avatar- เท่านั้น ป้องกันการลบไฟล์อื่น
  if (!avatar.startsWith('/uploads/avatar-')) return null;
  return path.join(process.cwd(), 'public', avatar);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const limited = rateLimit(`avatar:${user.id}`, 8, 30 * 60 * 1000);
    if (!limited.ok) return err('เปลี่ยนรูปโปรไฟล์ถี่เกินไป กรุณารอสักครู่', 429);

    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) return err('กรุณาเลือกไฟล์รูปภาพ');

    if (file.size > MAX_SIZE) return err('ไฟล์ใหญ่เกิน 3MB กรุณาเลือกรูปขนาดเล็กลง');
    if (file.size < 100) return err('ไฟล์ไม่ถูกต้อง');

    const buffer = Buffer.from(await file.arrayBuffer());
    const type = detectImageType(buffer);
    if (!type) return err('รองรับเฉพาะไฟล์ภาพ PNG, JPG หรือ WEBP เท่านั้น');

    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    const filename = `avatar-${user.id}-${Date.now()}-${randomBytes(5).toString('hex')}.${type}`;
    await writeFile(path.join(dir, filename), buffer);

    // ลบไฟล์รูปเก่า (ถ้ามี) หลังจากเขียนไฟล์ใหม่สำเร็จ
    const full = await db.user.findUnique({ where: { id: user.id }, select: { avatar: true } });
    const oldPath = oldAvatarPath(full?.avatar);
    if (oldPath) await unlink(oldPath).catch(() => {});

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatar: `/uploads/${filename}` },
    });

    return new Response(
      JSON.stringify({ url: updated.avatar, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ' }),
      { headers: { 'Content-Type': 'application/json' }, status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const limited = rateLimit(`avatar-del:${user.id}`, 8, 30 * 60 * 1000);
    if (!limited.ok) return err('ทำรายการถี่เกินไป กรุณารอสักครู่', 429);

    const full = await db.user.findUnique({ where: { id: user.id }, select: { avatar: true } });
    const oldPath = oldAvatarPath(full?.avatar);
    if (oldPath) await unlink(oldPath).catch(() => {});

    await db.user.update({ where: { id: user.id }, data: { avatar: null } });
    return new Response(JSON.stringify({ success: true, message: 'ลบรูปโปรไฟล์แล้ว' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    return handleError(e);
  }
}
