/**
 * Helpers สำหรับ API Route Handlers ฝั่ง Backend
 */
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { User } from '@prisma/client';

export function ok(data: unknown, init?: ResponseInit) {
  // no-store: ข้อมูลต้องสดเสมอ — สิ่งที่แอดมินบันทึกต้องขึ้นบนเว็บหลักทันที (กัน browser cache ข้อมูลเก่า)
  return NextResponse.json(data, { ...init, headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) } });
}

export function err(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

/** แปลง error เป็น response ที่อ่านง่าย */
export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    const first = e.issues[0];
    return err(first?.message || 'ข้อมูลไม่ถูกต้อง', 422);
  }
  const message = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดภายในระบบ';
  if (message.startsWith('UNAUTHORIZED')) return err('กรุณาเข้าสู่ระบบก่อนใช้งาน', 401);
  if (message.startsWith('FORBIDDEN')) return err('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 403);
  if (message.startsWith('NOT_FOUND')) return err('ไม่พบข้อมูลที่ต้องการ', 404);
  if (message.startsWith('BAD_REQUEST')) return err(message.replace('BAD_REQUEST: ', ''), 400);
  console.error('[API Error]', e);
  return err('เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่ภายหลัง', 500);
}

export async function requireUser(req: NextRequest): Promise<User> {
  const token = req.cookies.get('lrapx_session')?.value;
  const user = await getSessionUser(token);
  if (!user) throw new Error('UNAUTHORIZED');
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<User> {
  const user = await requireUser(req);
  if (user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return user;
}

/** IP ของผู้เรียก (รองรับการอยู่หลัง proxy) */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

/** parse JSON แบบปลอดภัย */
export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
