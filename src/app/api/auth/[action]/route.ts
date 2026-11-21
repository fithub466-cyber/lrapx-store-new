/**
 * API ยืนยันตัวตน: /api/auth/[action]
 * POST: register | login | logout | forgot | reset
 * GET (me): ดูผู้ใช้ปัจจุบัน + ยอดกระเป๋า
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  hashPassword, verifyPassword, createSession, destroySession, getSessionUser,
  SESSION_COOKIE, sessionCookieOptions, rateLimit, makeResetCode,
} from '@/lib/auth';
import { ok, err, handleError, clientIp } from '@/lib/api-helpers';
import { randomBytes, createHash } from 'crypto';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร')
    .max(20, 'ชื่อผู้ใช้ต้องไม่เกิน 20 ตัวอักษร')
    .regex(/^[a-zA-Z0-9_]+$/, 'ชื่อผู้ใช้ใช้ได้เฉพาะ a-z A-Z 0-9 และ _ เท่านั้น'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร').max(72, 'รหัสผ่านยาวเกินไป'),
  confirmPassword: z.string(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'กรุณากรอกอีเมลหรือชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

const forgotSchema = z.object({ email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง') });

const resetSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  code: z.string().length(6, 'รหัสยืนยันต้องมี 6 หลัก'),
  newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร').max(72),
});

function setSessionCookie(res: NextResponse, token: string, expires: Date) {
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await ctx.params;
    const ip = clientIp(req);
    const userAgent = req.headers.get('user-agent') ?? undefined;

    if (action === 'register') {
      const limited = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
      if (!limited.ok) return err(`พยายามสมัครหลายครั้งเกินไป กรุณารอ ${limited.retryAfterSec} วินาที`, 429);

      const body = registerSchema.parse(await req.json());
      if (body.password !== body.confirmPassword) return err('รหัสผ่านกับยืนยันรหัสผ่านไม่ตรงกัน');

      const existing = await db.user.findFirst({
        where: { OR: [{ username: body.username }, { email: body.email.toLowerCase() }] },
      });
      if (existing) {
        if (existing.username === body.username) return err('ชื่อผู้ใช้นี้ถูกใช้แล้ว กรุณาใช้ชื่ออื่น');
        return err('อีเมลนี้ถูกใช้สมัครแล้ว กรุณาเข้าสู่ระบบหรือใช้อีเมลอื่น');
      }

      const user = await db.user.create({
        data: {
          username: body.username,
          email: body.email.toLowerCase(),
          passwordHash: hashPassword(body.password),
          wallet: { create: {} },
        },
      });
      const { token, expiresAt } = await createSession(user.id, ip, userAgent);
      const res = NextResponse.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role, walletBalance: 0 },
      });
      setSessionCookie(res, token, expiresAt);
      return res;
    }

    if (action === 'login') {
      const body = loginSchema.parse(await req.json());
      const identifier = body.identifier.trim().toLowerCase();
      const limited = rateLimit(`login:${ip}:${identifier}`, 5, 15 * 60 * 1000);
      if (!limited.ok) return err(`พยายามเข้าสู่ระบบหลายครั้งเกินไป ล็อกไว้ชั่วคราว กรุณารอ ${Math.ceil((limited.retryAfterSec ?? 0) / 60)} นาที`, 429);

      const user = await db.user.findFirst({
        where: { OR: [{ email: identifier }, { username: body.identifier.trim() }] },
        include: { wallet: true },
      });
      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        return err('อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง', 401);
      }
      if (user.status !== 'ACTIVE') return err('บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อแอดมิน', 403);

      const { token, expiresAt } = await createSession(user.id, ip, userAgent);
      const res = NextResponse.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role, walletBalance: user.wallet?.balance ?? 0 },
      });
      setSessionCookie(res, token, expiresAt);
      return res;
    }

    if (action === 'logout') {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      if (token) await destroySession(token);
      const res = ok({ success: true });
      res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
      return res;
    }

    if (action === 'forgot') {
      const ipLimit = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
      if (!ipLimit.ok) return err('คำขอลืมรหัสผ่านหลายครั้งเกินไป กรุณารอสักครู่', 429);
      const body = forgotSchema.parse(await req.json());
      const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });

      // ตอบกลับแบบเดียวกันเสมอ ป้องกันการเดาอีเมล (Email Enumeration)
      const generic = { success: true, message: 'หากอีเมลนี้มีอยู่ในระบบ รหัสยืนยัน 6 หลักจะถูกออกให้ผ่านช่องทางติดต่อร้าน กรุณาแจ้งแอดมินเพื่อรับรหัส' };
      if (!user) return ok(generic);

      await db.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      const code = makeResetCode();
      const token = randomBytes(24).toString('hex');
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          code,
          tokenHash: createHash('sha256').update(token).digest('hex'),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      return ok(generic);
    }

    if (action === 'reset') {
      const limited = rateLimit(`reset:${ip}`, 10, 60 * 60 * 1000);
      if (!limited.ok) return err('พยายามหลายครั้งเกินไป กรุณารอสักครู่', 429);
      const body = resetSchema.parse(await req.json());
      const user = await db.user.findUnique({ where: { email: body.email.toLowerCase() } });
      if (!user) return err('รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');

      const record = await db.passwordResetToken.findFirst({
        where: {
          userId: user.id, code: body.code, usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (!record) return err('รหัสยืนยันไม่ถูกต้องหรือหมดอายุ');

      await db.$transaction([
        db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(body.newPassword) } }),
        db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
        db.session.deleteMany({ where: { userId: user.id } }),
      ]);
      return ok({ success: true, message: 'ตั้งรหัสผ่านใหม่สำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่' });
    }

    return err('NOT_FOUND', 404);
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  try {
    const { action } = await ctx.params;
    if (action !== 'me') return err('NOT_FOUND', 404);
    const user = await getSessionUser(req.cookies.get(SESSION_COOKIE)?.value);
    if (!user) return ok({ user: null });
    return ok({
      user: {
        id: user.id, username: user.username, email: user.email, role: user.role,
        avatar: user.avatar, walletBalance: user.wallet?.balance ?? 0,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
