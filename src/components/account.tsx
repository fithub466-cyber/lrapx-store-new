/** หน้าส่วนตัวสมาชิก: โปรไฟล์ + กระเป๋าเงิน + เติมเงิน + ประวัติคำสั่งซื้อ */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { navigate } from '@/lib/router';
import { useApp } from '@/lib/store';
import { useGoAuth } from '@/components/auth-view';
import { api, type Deposit, type Order, type WalletTx } from '@/lib/client';
import { formatTHB, formatDateTime, DEPOSIT_STATUS, ORDER_STATUS, ORDER_TYPE, PAYMENT_METHOD } from '@/lib/format';
import { SectionHeading, DepositBadge, StatusBadge, EmptyState, DepositChannelChip, TrumoneyLogo, KbankLogo } from '@/components/shared';
import { OrderDetailDialog } from '@/components/purchase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  Wallet, CircleDollarSign, ReceiptText, User, Copy, CheckCircle2, ImagePlus, Upload,
  Loader2, Search, LogOut, KeyRound, ArrowDownLeft, ArrowUpRight,
  Info, Clock, Camera, Trash2, ChevronLeft, ChevronRight, Smartphone,
} from 'lucide-react';

// ================= โปรไฟล์ =================

export function ProfilePage() {
  const { user, setUser } = useApp();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ===== รูปโปรไฟล์: อัปโหลด / ลบ =====
  async function uploadAvatar(file: File) {
    setAvatarLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/avatar', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
      await refresh();
      toast({ title: 'อัปโหลดรูปโปรไฟล์สำเร็จ', description: 'รูปของคุณจะแสดงในหน้าโปรไฟล์และเมนูทันที' });
    } catch (e) {
      toast({ title: (e as Error).message || 'อัปโหลดไม่สำเร็จ', variant: 'destructive' });
    } finally {
      setAvatarLoading(false);
    }
  }

  async function removeAvatar() {
    setAvatarLoading(true);
    try {
      const res = await fetch('/api/avatar', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบรูปไม่สำเร็จ');
      await refresh();
      toast({ title: 'ลบรูปโปรไฟล์แล้ว' });
    } catch (e) {
      toast({ title: (e as Error).message || 'ลบรูปไม่สำเร็จ', variant: 'destructive' });
    } finally {
      setAvatarLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api<{ deposits: Deposit[] }>('/api/data/deposits', { silent: true }),
      api<{ orders: Order[] }>('/api/data/orders', { silent: true }),
    ])
      .then(([d, o]) => {
        setDeposits(d.deposits);
        setOrders(o.orders);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <RequireLogin />;

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next.length < 8) {
      toast({ title: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', variant: 'destructive' });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toast({ title: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน', variant: 'destructive' });
      return;
    }
    setPwLoading(true);
    try {
      await api('/api/data/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      toast({ title: 'เปลี่ยนรหัสผ่านสำเร็จ' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch {
      // toast แสดงจาก api() อยู่แล้ว
    } finally {
      setPwLoading(false);
    }
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', silent: true }).catch(() => {});
    setUser(null);
    toast({ title: 'ออกจากระบบสำเร็จ' });
    navigate('/');
  }

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading icon={User} title="โปรไฟล์ของฉัน" subtitle="ข้อมูลบัญชี ยอดเงิน และประวัติการใช้งานทั้งหมด" />

      {/* การ์ดข้อมูลบัญชี */}
      <div className="grid gap-4 md:grid-cols-[280px_1fr] mb-8">
        <div className="gaming-card neon-ring p-6 text-center">
          <div className="relative mx-auto h-20 w-20">
            {avatarLoading ? (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/60">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </span>
            ) : user.avatar ? (
              <img src={user.avatar} alt={`รูปโปรไฟล์ของ ${user.username}`} className="h-20 w-20 rounded-full object-cover border-2 border-primary/50 shadow-lg" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-3xl font-bold text-white shadow-lg">
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
            {/* ปุ่มกล้อง: กดเพื่อเลือก/เปลี่ยนรูปโปรไฟล์ */}
            <label
              className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-primary shadow-lg hover:border-primary transition-colors"
              aria-label={user.avatar ? 'เปลี่ยนรูปโปรไฟล์' : 'ใส่รูปโปรไฟล์'}
              title={user.avatar ? 'เปลี่ยนรูปโปรไฟล์' : 'ใส่รูปโปรไฟล์'}
            >
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); e.target.value = ''; }}
              />
            </label>
          </div>
          <div className="mt-3 font-display text-lg font-bold">{user.username}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
          {user.avatar && (
            <button
              onClick={removeAvatar}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" /> ลบรูปโปรไฟล์
            </button>
          )}
          {!user.avatar && (
            <p className="mt-2 text-xs text-muted-foreground">ยังไม่มีรูปโปรไฟล์ — กดไอคอนกล้องเพื่อใส่รูปได้เลย</p>
          )}
          <div className="mt-3 rounded-xl bg-secondary/60 border border-border px-4 py-3">
            <div className="text-xs text-muted-foreground">ยอดเงินคงเหลือ</div>
            <div className="price-gold text-2xl mt-0.5">{formatTHB(user.walletBalance)}</div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="sm" className="btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => navigate('/deposit')}>
              <CircleDollarSign className="mr-1 h-4 w-4" /> เติมเงิน
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/orders')}>
              <ReceiptText className="mr-1 h-4 w-4" /> คำสั่งซื้อ
            </Button>
          </div>
        </div>

        <div className="gaming-card p-6">
          <h3 className="font-display font-semibold mb-4">ข้อมูลบัญชี</h3>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-secondary/40 px-4 py-3">
              <dt className="text-xs text-muted-foreground">ชื่อผู้ใช้</dt>
              <dd className="font-medium mt-0.5">{user.username}</dd>
            </div>
            <div className="rounded-xl bg-secondary/40 px-4 py-3">
              <dt className="text-xs text-muted-foreground">อีเมล</dt>
              <dd className="font-medium mt-0.5">{user.email}</dd>
            </div>
            <div className="rounded-xl bg-secondary/40 px-4 py-3">
              <dt className="text-xs text-muted-foreground">ประเภทบัญชี</dt>
              <dd className="font-medium mt-0.5">{user.role === 'ADMIN' ? 'ผู้ดูแลร้าน (Admin)' : 'สมาชิกทั่วไป'}</dd>
            </div>
            <div className="rounded-xl bg-secondary/40 px-4 py-3">
              <dt className="text-xs text-muted-foreground">จำนวนคำสั่งซื้อทั้งหมด</dt>
              <dd className="font-medium mt-0.5">{loading ? '...' : `${orders.length} รายการ`}</dd>
            </div>
          </dl>

          <h3 className="font-display font-semibold mt-6 mb-3 flex items-center gap-2">
            <KeyRound className="h-4.5 w-4.5 text-primary" /> ตั้งค่าบัญชี — เปลี่ยนรหัสผ่าน
          </h3>
          <form onSubmit={changePassword} className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pf-c">รหัสผ่านปัจจุบัน</Label>
              <Input id="pf-c" type="password" value={pwForm.current} onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))} className="bg-secondary/60" autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-n">รหัสผ่านใหม่</Label>
              <Input id="pf-n" type="password" value={pwForm.next} onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))} className="bg-secondary/60" autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pf-x">ยืนยันรหัสผ่านใหม่</Label>
              <Input id="pf-x" type="password" value={pwForm.confirm} onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))} className="bg-secondary/60" autoComplete="new-password" />
            </div>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              <Button type="submit" size="sm" className="btn-neon" disabled={pwLoading}>
                {pwLoading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} บันทึกรหัสผ่านใหม่
              </Button>
              <Button type="button" size="sm" variant="outline" className="border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300" onClick={logout}>
                <LogOut className="mr-1.5 h-4 w-4" /> ออกจากระบบ
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* ประวัติ */}
      <Tabs defaultValue="wallet-tx" className="w-full">
        <TabsList className="bg-secondary/60 h-11">
          <TabsTrigger value="wallet-tx" className="px-5"><Wallet className="mr-1.5 h-4 w-4" /> ประวัติกระเป๋าเงิน</TabsTrigger>
          <TabsTrigger value="deposits" className="px-5"><CircleDollarSign className="mr-1.5 h-4 w-4" /> ประวัติเติมเงิน</TabsTrigger>
          <TabsTrigger value="orders" className="px-5"><ReceiptText className="mr-1.5 h-4 w-4" /> รายการคำสั่งซื้อ</TabsTrigger>
        </TabsList>

        <TabsContent value="wallet-tx" className="mt-4">
          <WalletTxTable />
        </TabsContent>
        <TabsContent value="deposits" className="mt-4">
          {loading ? (
            <div className="h-40 rounded-2xl bg-secondary/30 animate-pulse" />
          ) : deposits.length === 0 ? (
            <EmptyState title="ยังไม่มีประวัติเติมเงิน" description="เติมเงินเข้ากระเป๋าได้ที่หน้าเติมเงิน" />
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">เลขอ้างอิง</th>
                      <th className="px-4 py-3 text-left font-medium">วันที่</th>
                      <th className="px-4 py-3 text-left font-medium">ช่องทาง</th>
                      <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                      <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {deposits.map((d) => (
                      <tr key={d.id} className="hover:bg-secondary/30">
                        <td className="px-4 py-3 font-mono text-xs">{d.refNo}</td>
                        <td className="px-4 py-3">{formatDateTime(d.createdAt)}</td>
                        <td className="px-4 py-3"><DepositChannelChip method={d.method} /></td>
                        <td className="px-4 py-3 text-right price-gold">{formatTHB(d.amount)}</td>
                        <td className="px-4 py-3 text-center"><DepositBadge status={d.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="orders" className="mt-4">
          {loading ? (
            <div className="h-40 rounded-2xl bg-secondary/30 animate-pulse" />
          ) : orders.length === 0 ? (
            <EmptyState title="ยังไม่มีคำสั่งซื้อ" description="เริ่มต้นซื้อไอดีเกมหรือเติมเกมได้เลย" />
          ) : (
            <div className="grid gap-3">
              {orders.slice(0, 10).map((o) => (
                <button key={o.id} onClick={() => setDetail(o)} className="gaming-card p-4 flex flex-wrap items-center gap-3 text-left cursor-pointer">
                  <span className="font-mono text-sm text-[#f0b429]">{o.orderNo}</span>
                  <span className="text-sm text-muted-foreground flex-1 min-w-40 line-clamp-1">{o.items.map((i) => i.name).join(', ')}</span>
                  <span className="text-sm text-muted-foreground">{ORDER_TYPE[o.type]}</span>
                  <span className="price-gold">{formatTHB(o.total)}</span>
                  <StatusBadge status={o.status} />
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <OrderDetailDialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)} order={detail} />
    </div>
  );
}

function RequireLogin() {
  const goAuth = useGoAuth();
  return (
    <div className="page-enter mx-auto max-w-md px-4 py-24 text-center">
      <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h1 className="mt-4 font-display text-xl font-bold">กรุณาเข้าสู่ระบบก่อนใช้งาน</h1>
      <p className="mt-1 text-sm text-muted-foreground">หน้านี้เป็นส่วนตัวของสมาชิกเท่านั้น</p>
      <div className="mt-6 flex justify-center gap-3">
        <Button className="btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => goAuth('login')}>เข้าสู่ระบบ</Button>
        <Button variant="outline" onClick={() => goAuth('register')}>สมัครสมาชิก</Button>
      </div>
    </div>
  );
}

// ================= กระเป๋าเงิน =================

function WalletTxTable({ limit }: { limit?: number }) {
  const [data, setData] = useState<{ balance: number; transactions: WalletTx[] } | null>(null);
  useEffect(() => {
    api<{ balance: number; transactions: WalletTx[] }>('/api/data/wallet', { silent: true })
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return <div className="h-40 rounded-2xl bg-secondary/30 animate-pulse" />;
  const txs = limit ? data.transactions.slice(0, limit) : data.transactions;
  if (txs.length === 0) return <EmptyState title="ยังไม่มีรายการเคลื่อนไหวของเงิน" description="ประวัติทุกธุรกรรมจะแสดงที่นี่" />;

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium">เวลา</th>
              <th className="px-4 py-3 text-left font-medium">เลขอ้างอิง</th>
              <th className="px-4 py-3 text-left font-medium">รายการ</th>
              <th className="px-4 py-3 text-right font-medium">เพิ่ม/หัก</th>
              <th className="px-4 py-3 text-right font-medium">ยอดคงเหลือ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {txs.map((t) => (
              <tr key={t.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(t.createdAt)}</td>
                <td className="px-4 py-3 font-mono text-xs">{t.refCode}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 ${t.direction === 'IN' ? 'text-emerald-400' : 'text-rose-300'}`}>
                    {t.direction === 'IN' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                    {t.description}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${t.direction === 'IN' ? 'text-emerald-400' : 'text-rose-300'}`}>
                  {t.direction === 'IN' ? '+' : '-'}{formatTHB(t.amount)}
                </td>
                <td className="px-4 py-3 text-right">{formatTHB(t.balanceAfter)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WalletPage() {
  const { user } = useApp();
  if (!user) return <RequireLogin />;
  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHeading icon={Wallet} title="กระเป๋าเงินของฉัน" subtitle="ดูยอดเงิน ประวัติการเคลื่อนไหว และเติมเงินเข้ากระเป๋า" />

      <div className="gaming-card neon-ring relative overflow-hidden p-7 mb-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-primary/20 blur-3xl animate-glow-pulse" aria-hidden="true" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-4 w-4" /> ยอดเงินคงเหลือ
            </div>
            <div className="mt-1 font-display text-4xl font-bold price-gold">{formatTHB(user.walletBalance)}</div>
            <p className="mt-1.5 text-xs text-muted-foreground">เงินในกระเป๋าใช้ชำระค่าสินค้าและบริการทุกรายการในร้านได้ทันที</p>
          </div>
          <Button size="lg" className="h-12 px-6 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => navigate('/deposit')}>
            <CircleDollarSign className="mr-2 h-5 w-5" /> เติมเงินเข้ากระเป๋า
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" /> ยอดเงินทุกการเปลี่ยนแปลงคำนวณและบันทึกบน Backend เท่านั้น ทุกรายการมีเลขอ้างอิงและเวลากำกับ
      </div>
      <WalletTxTable />
    </div>
  );
}

// ================= เติมเงินเข้ากระเป๋า =================

export function DepositPage() {
  const { user, refresh } = useApp();
  const [channel, setChannel] = useState<'TRUEMONEY_ANGPAO' | 'BANK_TRANSFER' | null>(null); // null = ยังไม่เลือกช่องทาง
  const [angpaoLink, setAngpaoLink] = useState('');
  const [angpaoAmount, setAngpaoAmount] = useState('');
  const [bankAmount, setBankAmount] = useState('');
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);

  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true }).then((d) => setSettings(d.settings)).catch(() => {});
    if (user) api<{ deposits: Deposit[] }>('/api/data/deposits', { silent: true }).then((d) => setDeposits(d.deposits)).catch(() => {});
  }, [user]);

  if (!user) return <RequireLogin />;

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast({ title: 'คัดลอกแล้ว', description: text });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: 'คัดลอกไม่สำเร็จ กรุณาคัดลอกเอง', variant: 'destructive' });
    }
  }

  async function uploadSlip(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlipUrl(data.url);
      toast({ title: 'แนบสลิปสำเร็จ' });
    } catch (e) {
      toast({ title: (e as Error).message || 'อัปโหลดไม่สำเร็จ', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }

  async function submit(methodType: 'TRUEMONEY_ANGPAO' | 'BANK_TRANSFER') {
    const amount = methodType === 'TRUEMONEY_ANGPAO' ? parseFloat(angpaoAmount) : parseFloat(bankAmount);
    if (!amount || amount < 20) {
      toast({ title: 'กรุณาระบุจำนวนเงิน (ขั้นต่ำ 20 บาท)', variant: 'destructive' });
      return;
    }
    if (methodType === 'TRUEMONEY_ANGPAO' && !angpaoLink.trim().startsWith('https://')) {
      toast({ title: 'ลิงก์ซองอังเปาไม่ถูกต้อง', description: 'ต้องขึ้นต้นด้วย https://', variant: 'destructive' });
      return;
    }
    if (methodType === 'BANK_TRANSFER' && !slipUrl) {
      toast({ title: 'กรุณาแนบสลิปการโอนเงิน', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/data/deposit', {
        method: 'POST',
        body: JSON.stringify({
          method: methodType,
          amount,
          ...(methodType === 'TRUEMONEY_ANGPAO' ? { angpaoLink: angpaoLink.trim() } : { slipImage: slipUrl }),
        }),
      });
      toast({ title: 'ส่งคำขอเติมเงินแล้ว', description: 'ระบบกำลังตรวจสอบการชำระเงิน จะได้รับเงินหลังแอดมินอนุมัติ' });
      setAngpaoLink('');
      setAngpaoAmount('');
      setBankAmount('');
      setSlipUrl(null);
      const d = await api<{ deposits: Deposit[] }>('/api/data/deposits', { silent: true });
      setDeposits(d.deposits);
      await refresh();
    } catch {
      // toast จาก api()
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHeading icon={CircleDollarSign} title="เติมเงินเข้ากระเป๋า" subtitle="เลือกช่องทางเติมเงิน — ยอดจะเข้ากระเป๋าหลังระบบ/แอดมินตรวจสอบการชำระเงินเรียบร้อยเท่านั้น" />

      <div className="gaming-card neon-ring p-6 mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm text-muted-foreground">ยอดเงินปัจจุบัน</div>
          <div className="font-display text-3xl font-bold price-gold mt-1">{formatTHB(user.walletBalance)}</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0" /> ระบบจะตรวจสอบการชำระเงินจริงเท่านั้น ไม่ยอมรับยอดจากการกรอกเองของผู้ใช้
        </div>
      </div>

      {/* ===== ขั้นที่ 1: เลือกช่องทางเติมเงิน (โลโก้อยู่หน้าชื่อช่องทาง) ===== */}
      {channel === null && (
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* ช่องทาง 1: ซองอั่งเปา — TrueMoney Wallet */}
          <button
            type="button"
            onClick={() => setChannel('TRUEMONEY_ANGPAO')}
            className="gaming-card group p-7 text-left cursor-pointer transition-all hover:neon-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="เลือกช่องทางซองอั่งเปา TrueMoney Wallet"
          >
            <TrumoneyLogo className="h-14 w-14 mb-4" />
            <h3 className="font-display text-lg font-bold">ซองอั่งเปา (อังเปา)</h3>
            <p className="text-sm font-medium text-[#ff7a1a]">TrueMoney Wallet</p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              ส่งเงินเป็นซองอังเปาแล้ววางลิงก์ gift.truemoney.com ให้ร้าน — แอดมินกดรับเงินจากลิงก์และตรวจยอดจริง
              {settings.truemoney_phone ? ` หรือโอนเข้าเบอร์ TrueMoney ร้าน ${settings.truemoney_phone}` : ''}
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              เลือกช่องทางนี้ <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>

          {/* ช่องทาง 2: โอนเงินผ่านธนาคาร — KBank */}
          <button
            type="button"
            onClick={() => setChannel('BANK_TRANSFER')}
            className="gaming-card group p-7 text-left cursor-pointer transition-all hover:neon-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="เลือกช่องทางโอนเงินผ่านธนาคาร"
          >
            <KbankLogo className="h-14 w-14 mb-4" />
            <h3 className="font-display text-lg font-bold">โอนเงินผ่านธนาคาร</h3>
            <p className="text-sm font-medium text-emerald-400">{settings.bank_name || 'ธนาคารกสิกรไทย (KBank)'}</p>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              โอนเข้าบัญชีร้านหรือสแกน QR จากแอปธนาคาร แล้วแนบสลิป — แอดมินตรวจสอบยอดจริงก่อนเติมเข้ากระเป๋า
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              เลือกช่องทางนี้ <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      )}

      {/* ===== ขั้นที่ 2: กรอกข้อมูลตามช่องทางที่เลือก ===== */}
      {channel !== null && (
        <div className="gaming-card p-6 mb-8">
          {/* แถบหัว: โลโก้ + ชื่อช่องทางที่เลือก + ปุ่มเปลี่ยน */}
          <div className="flex flex-wrap items-center gap-3 pb-4 mb-5 border-b border-border">
            {channel === 'TRUEMONEY_ANGPAO' ? <TrumoneyLogo className="h-12 w-12" /> : <KbankLogo className="h-12 w-12" />}
            <div className="min-w-0 flex-1 basis-48">
              <div className="font-display font-semibold">
                {channel === 'TRUEMONEY_ANGPAO' ? 'ซองอั่งเปา — TrueMoney Wallet' : `โอนเงินผ่านธนาคาร — ${settings.bank_name || 'ธนาคารกสิกรไทย (KBank)'}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {channel === 'TRUEMONEY_ANGPAO'
                  ? 'วางลิงก์ซองอังเปาพร้อมระบุจำนวนเงิน — แอดมินเปิดลิงกรับเงินและตรวจยอดจริงจากผู้ให้บริการ'
                  : 'โอนเงินเข้าบัญชีร้านด้านล่าง แล้วแนบสลิปเพื่อให้แอดมินตรวจสอบ'}
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto justify-center" onClick={() => setChannel(null)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> เปลี่ยนช่องทาง
            </Button>
          </div>

          {channel === 'TRUEMONEY_ANGPAO' ? (
            /* ---------- ฟอร์มซองอั่งเปา (TrueMoney Wallet) ---------- */
            <div className="max-w-xl mx-auto space-y-3">
              {settings.truemoney_phone && (
                <div className="flex items-center justify-between rounded-xl border border-[#ff7a1a]/30 bg-[#ff7a1a]/10 px-4 py-3 text-sm">
                  <div>
                    <div className="text-[11px] text-muted-foreground">เบอร์ TrueMoney Wallet ของร้าน (โอนเงินเข้าเบอร์นี้ได้)</div>
                    <div className="font-mono font-medium tracking-wider">{settings.truemoney_phone}</div>
                  </div>
                  <button
                    onClick={() => copy(settings.truemoney_phone, 'tmphone')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    aria-label="คัดลอกเบอร์ TrueMoney"
                  >
                    {copied === 'tmphone' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="dp-link">ลิงก์ซองอังเปา *</Label>
                <Input id="dp-link" value={angpaoLink} onChange={(e) => setAngpaoLink(e.target.value)} placeholder="https://gift.truemoney.com/cash-gift/..." className="bg-secondary/60 font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dp-amt">จำนวนเงินที่ส่ง (บาท) *</Label>
                <Input id="dp-amt" value={angpaoAmount} onChange={(e) => setAngpaoAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="เช่น 300" inputMode="decimal" className="bg-secondary/60" />
              </div>
              <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => submit('TRUEMONEY_ANGPAO')} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
                ส่งคำขอเติมเงิน
              </Button>
              <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                ระบบตรวจสอบยอดจริงกับผู้ให้บริการเท่านั้น — แอดมินจะเปิดลิงก์รับเงินตรงกับจำนวนที่แจ้ง ก่อนกดอนุมัติให้ยอดเข้ากระเป๋า
              </p>
            </div>
          ) : (
            /* ---------- ฟอร์มโอนเงินผ่านธนาคาร (KBank) ---------- */
            <div className="max-w-xl mx-auto space-y-2.5 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <KbankLogo className="h-9 w-9" />
                  <div>
                    <div className="text-xs text-muted-foreground">ธนาคาร</div>
                    <div className="font-medium">{settings.bank_name || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <div>
                  <div className="text-xs text-muted-foreground">ชื่อบัญชีร้าน</div>
                  <div className="font-medium">{settings.bank_account_name || '-'}</div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border px-4 py-3">
                <div>
                  <div className="text-xs text-muted-foreground">เลขบัญชี</div>
                  <div className="font-mono font-medium tracking-wider">{settings.bank_account_number || '-'}</div>
                </div>
                <button
                  onClick={() => settings.bank_account_number && copy(settings.bank_account_number, 'acc')}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  aria-label="คัดลอกเลขบัญชี"
                >
                  {copied === 'acc' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              {settings.bank_promptpay && (
                <div className="flex items-center justify-between rounded-xl bg-secondary/50 border border-border px-4 py-3">
                  <div>
                    <div className="text-xs text-muted-foreground">พร้อมเพย์</div>
                    <div className="font-mono font-medium tracking-wider">{settings.bank_promptpay}</div>
                  </div>
                  <button
                    onClick={() => copy(settings.bank_promptpay, 'pp')}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    aria-label="คัดลอกพร้อมเพย์"
                  >
                    {copied === 'pp' ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {settings.bank_qr_image && (
                <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3">
                  <div className="text-xs text-muted-foreground">QR Code สำหรับชำระเงิน (สแกนด้วยแอปธนาคาร)</div>
                  <img src={settings.bank_qr_image} alt="QR รับเงินของร้าน" className="mt-2 mx-auto h-40 w-40 rounded-lg border border-border bg-white object-contain p-1" />
                </div>
              )}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="dp-bamt">จำนวนเงินที่โอน (บาท) *</Label>
                <Input id="dp-bamt" value={bankAmount} onChange={(e) => setBankAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="เช่น 500" inputMode="decimal" className="bg-secondary/60" />
              </div>
              <div className="space-y-1.5">
                <Label>สลิปการโอนเงิน *</Label>
                <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 p-4 cursor-pointer hover:border-primary/60 transition-colors">
                  {slipUrl ? (
                    <img src={slipUrl} alt="สลิปการโอนเงิน" className="max-h-24 rounded" />
                  ) : uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <ImagePlus className="h-5 w-5" /> แนบสลิป (PNG/JPG/WEBP ≤ 5MB)
                    </span>
                  )}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSlip(f); e.target.value = ''; }} />
                  {!slipUrl && !uploading && <Upload className="h-4 w-4 text-primary" />}
                </label>
              </div>
              <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => submit('BANK_TRANSFER')} disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CircleDollarSign className="mr-2 h-4 w-4" />}
                ส่งคำขอเติมเงิน
              </Button>
            </div>
          )}
        </div>
      )}

      {/* สถานะคำขอเติมเงินล่าสุด */}
      <h3 className="font-display font-semibold mb-3">คำขอเติมเงินของคุณ</h3>
      {deposits.length === 0 ? (
        <EmptyState title="ยังไม่มีคำขอเติมเงิน" description="ทำรายการแรกของคุณด้านบนได้เลย" />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">เลขอ้างอิง</th>
                  <th className="px-4 py-3 text-left font-medium">วันที่</th>
                  <th className="px-4 py-3 text-left font-medium">ช่องทาง</th>
                  <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                  <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deposits.map((d) => (
                  <tr key={d.id}>
                    <td className="px-4 py-3 font-mono text-xs">{d.refNo}</td>
                    <td className="px-4 py-3">{formatDateTime(d.createdAt)}</td>
                    <td className="px-4 py-3"><DepositChannelChip method={d.method} bankName={settings.bank_name} /></td>
                    <td className="px-4 py-3 text-right price-gold">{formatTHB(d.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <DepositBadge status={d.status} />
                      {d.adminNote && <div className="mt-1 text-[11px] text-muted-foreground">{d.adminNote}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ================= ประวัติการสั่งซื้อ =================

export function OrdersPage() {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    api<{ orders: Order[] }>('/api/data/orders', { silent: true })
      .then((d) => setOrders(d.orders))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const shown = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => {
      const okStatus = statusFilter === 'ALL' || o.status === statusFilter;
      const okQ = !q.trim() || o.orderNo.toLowerCase().includes(q.trim().toLowerCase()) || o.items.some((i) => i.name.toLowerCase().includes(q.trim().toLowerCase()));
      return okStatus && okQ;
    });
  }, [orders, statusFilter, q, user]);

  if (!user) return <RequireLogin />;

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-10 md:px-6">
      <SectionHeading icon={ReceiptText} title="ประวัติการสั่งซื้อ" subtitle="ดูทุกคำสั่งซื้อ สถานะล่าสุด และข้อมูลการส่งมอบ" />

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขคำสั่งซื้อหรือชื่อสินค้า..." className="pl-10 bg-secondary/60" aria-label="ค้นหาคำสั่งซื้อ" />
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING_PAYMENT', 'REVIEWING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'REFUNDED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
                statusFilter === s ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s === 'ALL' ? 'ทั้งหมด' : ORDER_STATUS[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary/30 animate-pulse" />)}</div>
      ) : shown.length === 0 ? (
        <EmptyState title="ไม่พบคำสั่งซื้อ" description="ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ" />
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">เลขคำสั่งซื้อ</th>
                  <th className="px-4 py-3 text-left font-medium">วันที่</th>
                  <th className="px-4 py-3 text-left font-medium">รายการ</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">ประเภท</th>
                  <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">ชำระผ่าน</th>
                  <th className="px-4 py-3 text-right font-medium">ราคาสุทธิ</th>
                  <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                  <th className="px-4 py-3 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs text-[#f0b429]">{o.orderNo}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3 max-w-52"><span className="line-clamp-1">{o.items.map((i) => i.name).join(', ')}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell">{ORDER_TYPE[o.type]}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{PAYMENT_METHOD[o.paymentMethod]}</td>
                    <td className="px-4 py-3 text-right price-gold whitespace-nowrap">{formatTHB(o.total)}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setDetail(o)}>ดูรายละเอียด</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderDetailDialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)} order={detail} />
    </div>
  );
}
