/**
 * API รูปโปรไฟล์: /api/avatar
 * POST   : อัปโหลดรูปโปรไฟล์ของผู้ใช้ที่ล็อกอินไปยัง Vercel Blob
 * DELETE : ถอดรูปโปรไฟล์ออกจากบัญชี
 * ใช้ Blob แทน public/uploads เพราะ filesystem ของ Vercel เป็นพื้นที่ชั่วคราว
 */
import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { err, handleError, requireUser } from '@/lib/api-helpers';
import { rateLimit } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const MAX_SIZE = 3 * 1024 * 1024;
const STORE_ID = 'store_Ac0vivuo8rHYDh2v';

function detectImageType(buffer: Buffer): { extension: string; contentType: string } | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4e && buffer[3] === 0x47 &&
    buffer[4] === 0x0d && buffer[5] === 0x0a &&
    buffer[6] === 0x1a && buffer[7] === 0x0a
  ) return { extension: 'png', contentType: 'image/png' };

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { extension: 'jpg', contentType: 'image/jpeg' };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) return { extension: 'webp', contentType: 'image/webp' };

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const limited = rateLimit(`avatar:${user.id}`, 8, 30 * 60 * 1000);
    if (!limited.ok) return err('เปลี่ยนรูปโปรไฟล์ถี่เกินไป กรุณารอสักครู่', 429);

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return err('กรุณาเลือกไฟล์รูปภาพ');
    if (file.size < 100) return err('ไฟล์ไม่ถูกต้อง');
    if (file.size > MAX_SIZE) return err('ไฟล์ใหญ่เกิน 3MB กรุณาเลือกรูปขนาดเล็กลง');

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = detectImageType(buffer);
    if (!image) return err('รองรับเฉพาะไฟล์ภาพ PNG, JPG หรือ WEBP เท่านั้น');

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return err('ระบบจัดเก็บรูปยังตั้งค่าไม่เสร็จ กรุณาลองใหม่ภายหลัง', 503);

    const pathname = `avatars/${user.id}/${Date.now()}-${randomBytes(8).toString('hex')}.${image.extension}`;
    const url = new URL('https://vercel.com/api/blob/');
    url.searchParams.set('pathname', pathname);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': image.contentType,
        'x-vercel-blob-store-id': STORE_ID,
        'x-api-blob-request-id': `${STORE_ID}:${Date.now()}:${randomBytes(6).toString('hex')}`,
        'x-api-blob-request-attempt': '0',
        'x-api-version': '13',
        'x-vercel-blob-access': 'public',
        'x-content-type': image.contentType,
      },
      body: buffer,
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || typeof result.url !== 'string') {
      console.error('[Avatar Upload] Blob request failed:', response.status);
      return err('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', response.status >= 500 ? 502 : 400);
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatar: result.url },
      select: { avatar: true },
    });

    return new Response(
      JSON.stringify({ url: updated.avatar, message: 'อัปโหลดรูปโปรไฟล์สำเร็จ' }),
      { headers: { 'Content-Type': 'application/json' }, status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(req);
    const limited = rateLimit(`avatar-del:${user.id}`, 8, 30 * 60 * 1000);
    if (!limited.ok) return err('ทำรายการถี่เกินไป กรุณารอสักครู่', 429);

    await db.user.update({ where: { id: user.id }, data: { avatar: null } });
    return new Response(JSON.stringify({ success: true, message: 'ลบรูปโปรไฟล์แล้ว' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return handleError(error);
  }
}
