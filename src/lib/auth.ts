/**
 * ระบบยืนยันตัวตนฝั่ง Backend — ใช้ scrypt เข้ารหัสรหัสผ่าน + Session Token เก็บใน Cookie แบบ httpOnly
 * ห้าม import ไฟล์นี้ในฝั่ง Client
 */
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { db } from '@/lib/db';

export const SESSION_COOKIE = 'lrapx_session';
export const SESSION_DAYS = 7;

// ---------- รหัสผ่าน ----------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

// ---------- Session ----------

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function generateToken() {
  return randomBytes(32).toString('hex');
}

export async function createSession(userId: string, ip?: string, userAgent?: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt, ip: ip ?? null, userAgent: userAgent ?? null },
  });
  return { token, expiresAt };
}

export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  };
}

export async function destroySession(token: string) {
  await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function getSessionUser(token: string | undefined | null) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { wallet: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status !== 'ACTIVE') return null;
  // เลื่อนวันหมดอายุแบบ sliding ถ้าเหลือน้อยกว่า 5 วัน
  if (session.expiresAt.getTime() - Date.now() < 5 * 24 * 60 * 60 * 1000) {
    await db.session
      .update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000) } })
      .catch(() => {});
  }
  return session.user;
}

// ---------- Rate Limiter (In-memory) ----------

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > max) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true };
}

// ทำความสะอาด bucket เก่าเป็นระยะ
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}, 10 * 60 * 1000).unref?.();

// ---------- รหัสอ้างอิง ----------

export function makeRef(prefix: string) {
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${Date.now().toString().slice(-7)}${rand}`;
}

export function makeResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
