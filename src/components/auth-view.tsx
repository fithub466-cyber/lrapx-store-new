/** หน้าระบบสมาชิก: เข้าสู่ระบบ / สมัครสมาชิก / ลืมรหัสผ่าน — ทำงานได้ทั้งเป็นหน้าเต็มและในหน้าต่างย่อย (popup) */
'use client';

import { useState } from 'react';
import { navigate } from '@/lib/router';
import { useApp, type PopupKind } from '@/lib/store';
import { api } from '@/lib/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Loader2, LogIn, UserPlus, KeyRound, ShieldCheck, CheckCircle2, MailWarning } from 'lucide-react';

/** สลับหน้า auth — ถ้าอยู่ใน popup เปลี่ยนเนื้อหาในหน้าต่างเดิม ถ้าเป็นหน้าเต็มค่อยเปลี่ยน route */
export function useGoAuth() {
  const popup = useApp((s) => s.popup);
  const setPopup = useApp((s) => s.setPopup);
  return (view: PopupKind) => {
    if (popup) setPopup(view);
    else navigate('/' + view);
  };
}

function AuthLayout({
  children, title, subtitle, icon: Icon, embedded,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  embedded?: boolean;
}) {
  const heading = (
    <div className="mb-6 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary glow-purple">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
  const note = (
    <p className="mt-5 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
      รหัสผ่านของคุณถูกเข้ารหัสด้วยอัลกอริทึม scrypt อย่างปลอดภัย
    </p>
  );

  if (embedded) {
    return (
      <div className="page-enter">
        {heading}
        {children}
        {note}
      </div>
    );
  }

  return (
    <div className="page-enter relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 gaming-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="gaming-card neon-ring p-7 md:p-8">
          {heading}
          {children}
        </div>
        {note}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { refresh, popup, setPopup } = useApp();
  const embedded = popup !== null;
  const goAuth = useGoAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!identifier.trim() || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    setLoading(true);
    try {
      await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim(), password }),
        silent: true,
      });
      await refresh();
      toast({ title: 'เข้าสู่ระบบสำเร็จ', description: 'ยินดีต้อนรับกลับมาครับ' });
      if (embedded) setPopup(null);
      else navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout embedded={embedded} title="เข้าสู่ระบบ" subtitle="ใช้อีเมลหรือชื่อผู้ใช้เพื่อเข้าใช้งาน LrapX Store" icon={LogIn}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="lg-id">อีเมลหรือชื่อผู้ใช้</Label>
          <Input id="lg-id" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com หรือ yourname" autoComplete="username" className="h-11 bg-secondary/60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lg-pw">รหัสผ่าน</Label>
          <Input id="lg-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="รหัสผ่านของคุณ" autoComplete="current-password" className="h-11 bg-secondary/60" />
        </div>
        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-300">{error}</div>}
        <Button type="submit" className="w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </Button>
      </form>
      <div className="mt-5 flex items-center justify-between text-sm">
        <button onClick={() => goAuth('forgot')} className="text-muted-foreground hover:text-primary cursor-pointer">ลืมรหัสผ่าน?</button>
        <button onClick={() => goAuth('register')} className="text-primary font-medium hover:underline cursor-pointer">สมัครสมาชิกใหม่</button>
      </div>
      {!embedded && (
        <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-3.5 text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">บัญชีทดลอง:</span> demo@lrapx.store / Demo1234 (มียอดกระเป๋าให้ทดลองซื้อ)
          <br />
          <span className="font-semibold text-foreground">บัญชีแอดมิน:</span> admin@lrapx.store / Admin@LrapX2024
        </div>
      )}
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { refresh, popup, setPopup } = useApp();
  const embedded = popup !== null;
  const goAuth = useGoAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid = {
    username: /^[a-zA-Z0-9_]{3,20}$/.test(form.username),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    password: form.password.length >= 8,
    confirm: form.confirmPassword.length > 0 && form.password === form.confirmPassword,
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!valid.username) return setError('ชื่อผู้ใช้ต้องเป็น a-z A-Z 0-9 หรือ _ ยาว 3-20 ตัว');
    if (!valid.email) return setError('รูปแบบอีเมลไม่ถูกต้อง');
    if (!valid.password) return setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    if (!valid.confirm) return setError('รหัสผ่านกับยืนยันรหัสผ่านไม่ตรงกัน');
    setLoading(true);
    try {
      await api('/api/auth/register', { method: 'POST', body: JSON.stringify(form), silent: true });
      await refresh();
      toast({ title: 'สมัครสมาชิกสำเร็จ', description: 'ระบบเข้าสู่ระบบให้คุณแล้ว พร้อมกระเป๋าเงินสำหรับใช้งานทันที' });
      if (embedded) setPopup(null);
      else navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout embedded={embedded} title="สมัครสมาชิก" subtitle="สมัครฟรี พร้อมรับส่วนลดคำสั่งซื้อแรก" icon={UserPlus}>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="rg-u">ชื่อผู้ใช้</Label>
          <Input id="rg-u" value={form.username} onChange={set('username')} placeholder="a-z 0-9 _ ยาว 3-20 ตัว" autoComplete="username" className="h-11 bg-secondary/60" />
          {form.username && !valid.username && <p className="text-xs text-amber-400">ชื่อผู้ใช้ต้องเป็นตัวอักษรอังกฤษ/ตัวเลข 3-20 ตัว</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rg-e">อีเมล</Label>
          <Input id="rg-e" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" className="h-11 bg-secondary/60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rg-p">รหัสผ่าน</Label>
          <Input id="rg-p" type="password" value={form.password} onChange={set('password')} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" className="h-11 bg-secondary/60" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rg-c">ยืนยันรหัสผ่าน</Label>
          <Input id="rg-c" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="พิมพ์รหัสผ่านเดียวกันอีกครั้ง" autoComplete="new-password" className="h-11 bg-secondary/60" />
          {form.confirmPassword && !valid.confirm && <p className="text-xs text-amber-400">รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>}
        </div>
        {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-300">{error}</div>}
        <Button type="submit" className="w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
          {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        มีบัญชีอยู่แล้ว?{' '}
        <button onClick={() => goAuth('login')} className="text-primary font-medium hover:underline cursor-pointer">เข้าสู่ระบบ</button>
      </p>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const goAuth = useGoAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function request(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ message: string }>('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
        silent: true,
      });
      setMessage(res.message);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร');
    setLoading(true);
    try {
      await api('/api/auth/reset', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), code: code.trim(), newPassword }),
        silent: true,
      });
      setStep(3);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="ลืมรหัสผ่าน" subtitle="ยืนยันตัวตนเพื่อตั้งรหัสผ่านใหม่" icon={KeyRound}>
      {step === 1 && (
        <form onSubmit={request} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fp-e">อีเมลที่ใช้สมัครสมาชิก</Label>
            <Input id="fp-e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 bg-secondary/60" />
          </div>
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200 leading-relaxed">
            ร้านยังไม่ได้ตั้งค่าผู้ให้บริการส่งอีเมล — รหัสยืนยัน 6 หลักจะถูกออกให้ผ่าน <b>แอดมินร้าน</b> (ดูได้ที่หลังบ้านส่วน "คำขอรีเซ็ตรหัสผ่าน") กรุณาติดต่อแอดมินเพื่อรับรหัส
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-300">{error}</div>}
          <Button type="submit" className="w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <MailWarning className="mr-2 h-5 w-5" />}
            {loading ? 'กำลังส่งคำขอ...' : 'ขอรหัสยืนยัน'}
          </Button>
          <p className="text-center text-sm">
            <button type="button" onClick={() => goAuth('login')} className="text-muted-foreground hover:text-primary cursor-pointer">กลับไปเข้าสู่ระบบ</button>
          </p>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={reset} className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200 leading-relaxed">
            <CheckCircle2 className="inline h-3.5 w-3.5 mr-1" />
            {message}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-c">รหัสยืนยัน 6 หลัก</Label>
            <Input id="fp-c" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="______" inputMode="numeric" className="h-11 bg-secondary/60 text-center font-mono text-lg tracking-[0.5em]" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-n">รหัสผ่านใหม่</Label>
            <Input id="fp-n" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" autoComplete="new-password" className="h-11 bg-secondary/60" />
          </div>
          {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-300">{error}</div>}
          <Button type="submit" className="w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
            {loading ? 'กำลังตั้งรหัสผ่าน...' : 'ตั้งรหัสผ่านใหม่'}
          </Button>
        </form>
      )}
      {step === 3 && (
        <div className="text-center py-2">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 glow-purple" />
          <p className="mt-3 font-display font-semibold text-lg">ตั้งรหัสผ่านใหม่สำเร็จ</p>
          <p className="mt-1 text-sm text-muted-foreground">กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่ของคุณ</p>
          <Button className="mt-5 w-full h-12 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => goAuth('login')}>
            ไปหน้าเข้าสู่ระบบ
          </Button>
        </div>
      )}
    </AuthLayout>
  );
}
