/** หลังบ้าน Admin: สถิติ, คำสั่งซื้อ, เติมเงิน, สินค้า, หมวดหมู่, สมาชิก, ตั้งค่าร้าน */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { navigate } from '@/lib/router';
import { useApp } from '@/lib/store';
import { api, type Order, type Deposit, type AdminUserRow, type Product, type Category, type TopupPackage, type Settings } from '@/lib/client';
import { formatTHB, formatDateTime, ORDER_STATUS, ORDER_TYPE, PAYMENT_METHOD } from '@/lib/format';
import { SectionHeading, StatusBadge, DepositBadge, SafeImage, MultiImageUpload, SingleImageUpload, DepositChannelChip, TrumoneyLogo, KbankLogo } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  LayoutDashboard, ReceiptText, CircleDollarSign, Package, FolderTree, Users, Settings2,
  Search, TrendingUp, ShieldCheck, KeyRound, Plus, Pencil, Trash2, Loader2,
  MessageCircle, Phone, Mail, Clock, Landmark, Megaphone, Ban, CheckCircle2, XCircle, Zap,
} from 'lucide-react';

export function AdminPage() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24"><div className="h-64 rounded-2xl bg-secondary/30 animate-pulse" /></div>;
  }
  if (!user) {
    return (
      <div className="page-enter mx-auto max-w-md px-4 py-24 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-[#f0b429]" />
        <h1 className="mt-4 font-display text-xl font-bold">เข้าสู่ระบบด้วยบัญชีแอดมิน</h1>
        <p className="mt-1 text-sm text-muted-foreground">สิทธิ์ Admin ตรวจสอบจาก Backend ทุกคำขอ ไม่สามารถปลอมผ่านหน้าเว็บได้</p>
        <Button className="mt-6 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => navigate('/login')}>ไปหน้าเข้าสู่ระบบ</Button>
      </div>
    );
  }
  if (user.role !== 'ADMIN') {
    return (
      <div className="page-enter mx-auto max-w-md px-4 py-24 text-center">
        <Ban className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 font-display text-xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="mt-1 text-sm text-muted-foreground">หน้านี้สำหรับเจ้าของร้านเท่านั้น (สิทธิ์ตรวจสอบจาก Backend)</p>
        <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>กลับหน้าหลัก</Button>
      </div>
    );
  }
  return <AdminDashboard />;
}

function AdminDashboard() {
  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading icon={LayoutDashboard} title="หลังบ้าน LrapX Store" subtitle="จัดการร้านค้าทั้งหมดจากที่เดียว — สิทธิ์ตรวจสอบจาก Backend ทุกคำขอ" />
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/60 h-11 flex-wrap h-auto">
          <TabsTrigger value="overview" className="px-4"><LayoutDashboard className="mr-1.5 h-4 w-4" /> ภาพรวม</TabsTrigger>
          <TabsTrigger value="orders" className="px-4"><ReceiptText className="mr-1.5 h-4 w-4" /> คำสั่งซื้อ</TabsTrigger>
          <TabsTrigger value="deposits" className="px-4"><CircleDollarSign className="mr-1.5 h-4 w-4" /> เติมเงิน</TabsTrigger>
          <TabsTrigger value="products" className="px-4"><Package className="mr-1.5 h-4 w-4" /> สินค้า</TabsTrigger>
          <TabsTrigger value="packages" className="px-4"><Zap className="mr-1.5 h-4 w-4" /> แพ็กเกจเติมเกม</TabsTrigger>
          <TabsTrigger value="categories" className="px-4"><FolderTree className="mr-1.5 h-4 w-4" /> หมวดหมู่</TabsTrigger>
          <TabsTrigger value="users" className="px-4"><Users className="mr-1.5 h-4 w-4" /> สมาชิก</TabsTrigger>
          <TabsTrigger value="settings" className="px-4"><Settings2 className="mr-1.5 h-4 w-4" /> ตั้งค่าร้าน</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-5"><OverviewTab /></TabsContent>
        <TabsContent value="orders" className="mt-5"><OrdersTab /></TabsContent>
        <TabsContent value="deposits" className="mt-5"><DepositsTab /></TabsContent>
        <TabsContent value="products" className="mt-5"><ProductsTab /></TabsContent>
        <TabsContent value="packages" className="mt-5"><PackagesTab /></TabsContent>
        <TabsContent value="categories" className="mt-5"><CategoriesTab /></TabsContent>
        <TabsContent value="users" className="mt-5"><UsersTab /></TabsContent>
        <TabsContent value="settings" className="mt-5"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ================= ภาพรวม =================

function OverviewTab() {
  const [data, setData] = useState<{
    stats: { orderCount: number; userCount: number; productsAvailable: number; productsSold: number; depositPending: number; revenue: number; statuses: Record<string, number>; salesByDay: { day: string; total: number; count: number }[] };
    recentOrders: (Order & { user?: { username: string } })[];
  } | null>(null);

  const load = () => api<typeof data>('/api/admin/stats', { silent: true }).then(setData).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!data) return <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-secondary/30 animate-pulse" />)}</div>;

  const { stats } = data;
  const maxDay = Math.max(...stats.salesByDay.map((d) => d.total), 1);

  const cards = [
    { icon: TrendingUp, label: 'ยอดขายรวม (สำเร็จ)', value: formatTHB(stats.revenue), color: 'text-emerald-400 bg-emerald-500/15' },
    { icon: ReceiptText, label: 'คำสั่งซื้อทั้งหมด', value: `${stats.orderCount} รายการ`, color: 'text-primary bg-primary/15' },
    { icon: Users, label: 'สมาชิกทั้งหมด', value: `${stats.userCount} คน`, color: 'text-sky-400 bg-sky-500/15' },
    { icon: CircleDollarSign, label: 'คำขอเติมเงินรอตรวจ', value: `${stats.depositPending} รายการ`, color: 'text-amber-400 bg-amber-500/15' },
    { icon: Package, label: 'สินค้าพร้อมขาย', value: `${stats.productsAvailable} ชิ้น`, color: 'text-violet-300 bg-violet-500/15' },
    { icon: CheckCircle2, label: 'สินค้าขายแล้ว', value: `${stats.productsSold} ชิ้น`, color: 'text-rose-300 bg-rose-500/15' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c, i) => (
          <div key={i} className="gaming-card p-5 flex items-center gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.color}`}><c.icon className="h-6 w-6" /></span>
            <div>
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="font-display text-xl font-bold mt-0.5">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="gaming-card p-5">
          <h3 className="font-display font-semibold mb-4">ยอดขาย 7 วันล่าสุด</h3>
          <div className="flex items-end gap-2 h-40">
            {stats.salesByDay.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5" title={`${d.day}: ${formatTHB(d.total)} (${d.count} รายการ)`}>
                <div className="w-full rounded-t-lg bg-gradient-to-t from-violet-700 to-fuchsia-500 transition-all" style={{ height: `${Math.max((d.total / maxDay) * 100, 3)}%` }} />
                <span className="text-[10px] text-muted-foreground">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="gaming-card p-5">
          <h3 className="font-display font-semibold mb-4">สถานะคำสั่งซื้อทั้งหมด</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(ORDER_STATUS).map((s) => (
              <div key={s} className="flex items-center justify-between rounded-xl bg-secondary/40 px-4 py-2.5 text-sm">
                <StatusBadge status={s} />
                <span className="font-bold">{stats.statuses?.[s] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gaming-card p-5">
        <h3 className="font-display font-semibold mb-4">คำสั่งซื้อล่าสุด</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground border-b border-border">
              <tr>
                <th className="px-3 py-2 text-left font-medium">เลขคำสั่งซื้อ</th>
                <th className="px-3 py-2 text-left font-medium">ลูกค้า</th>
                <th className="px-3 py-2 text-left font-medium">รายการ</th>
                <th className="px-3 py-2 text-right font-medium">ยอด</th>
                <th className="px-3 py-2 text-center font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.recentOrders.map((o) => (
                <tr key={o.id}>
                  <td className="px-3 py-2.5 font-mono text-xs text-[#f0b429]">{o.orderNo}</td>
                  <td className="px-3 py-2.5">{o.user?.username}</td>
                  <td className="px-3 py-2.5 max-w-64"><span className="line-clamp-1">{o.items.map((i) => i.name).join(', ')}</span></td>
                  <td className="px-3 py-2.5 text-right price-gold">{formatTHB(o.total)}</td>
                  <td className="px-3 py-2.5 text-center"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ================= คำสั่งซื้อ =================

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState('ALL');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api<{ orders: Order[] }>(`/api/admin/orders?status=${status}&q=${encodeURIComponent(q)}`, { silent: true })
    .then((d) => setOrders(d.orders)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [status]);

  function openEdit(o: Order) {
    setEdit(o);
    setNewStatus(o.status);
    setAdminNote(o.adminNote ?? '');
    setDeliveryInfo('');
  }

  async function save() {
    if (!edit) return;
    setSaving(true);
    try {
      await api(`/api/admin/orders/${edit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus !== edit.status ? newStatus : undefined,
          adminNote,
          ...(deliveryInfo.trim() ? { deliveryInfo: deliveryInfo.trim() } : {}),
        }),
      });
      toast({ title: 'อัปเดตคำสั่งซื้อสำเร็จ' });
      setEdit(null);
      load();
    } catch {
      // toast จาก api()
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเลขคำสั่งซื้อ/ชื่อลูกค้า แล้วกด Enter" className="pl-10 bg-secondary/60" onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-52 bg-secondary/60"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
            {Object.keys(ORDER_STATUS).map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">เลขคำสั่งซื้อ</th>
                <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
                <th className="px-4 py-3 text-left font-medium">รายการ</th>
                <th className="px-4 py-3 text-right font-medium">ยอด</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">ชำระผ่าน</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">ไม่พบคำสั่งซื้อ</td></tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs text-[#f0b429]">{o.orderNo}</td>
                    <td className="px-4 py-3">{o.user?.username}<div className="text-[11px] text-muted-foreground">{o.user?.email}</div></td>
                    <td className="px-4 py-3 max-w-56"><span className="line-clamp-1">{o.items.map((i) => i.name).join(', ')}</span><span className="text-[11px] text-muted-foreground">{ORDER_TYPE[o.type]}</span></td>
                    <td className="px-4 py-3 text-right price-gold whitespace-nowrap">{formatTHB(o.total)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">{PAYMENT_METHOD[o.paymentMethod]}{o.slipImage && <a href={o.slipImage} target="_blank" rel="noreferrer" className="block text-[11px] text-primary underline">ดูสลิป</a>}</td>
                    <td className="px-4 py-3 text-center"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(o)}><Pencil className="mr-1 h-3.5 w-3.5" /> จัดการ</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!edit} onOpenChange={(v) => !v && setEdit(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">จัดการคำสั่งซื้อ {edit?.orderNo}</DialogTitle>
            <DialogDescription>เปลี่ยนสถานะ ใส่ข้อความถึงลูกค้า และส่งข้อมูลการจัดส่ง (ลูกค้าเห็นเฉพาะของตัวเอง)</DialogDescription>
          </DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="rounded-xl bg-secondary/40 p-4 text-sm space-y-1">
                {edit.items.map((i) => (
                  <div key={i.id} className="flex justify-between"><span className="line-clamp-1">{i.name}</span><span className="price-gold">{formatTHB(i.price)}</span></div>
                ))}
                <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><span>รวม</span><span className="price-gold">{formatTHB(edit.total)}</span></div>
                {edit.paymentMethod === 'WALLET' && <p className="text-xs text-muted-foreground">* ยกเลิก/คืนเงินระบบจะคืนยอดเข้ากระเป๋าลูกค้าอัตโนมัติ</p>}
              </div>
              {edit.contactInfo && (
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-2">
                  <Label>ข้อมูลลูกค้าสำหรับดำเนินการเติมเกม</Label>
                  <div className="space-y-1 text-sm">
                    {(() => {
                      try {
                        const info = JSON.parse(edit.contactInfo) as Record<string, unknown>;
                        const labels: Record<string, string> = { playerId: 'Player ID', robloxUsername: 'Username Roblox', note: 'หมายเหตุ / วิธีรับบริการ' };
                        const rows = Object.entries(info).filter(([key, value]) => value != null && value !== '' && !/pass(word)?|otp|token|secret/i.test(key));
                        return rows.map(([key, value]) => (
                          <div key={key} className="break-words">
                            <span className="text-muted-foreground">{labels[key] ?? key}: </span>
                            <span className="whitespace-pre-wrap">{String(value)}</span>
                          </div>
                        ));
                      } catch {
                        return <p className="whitespace-pre-wrap break-words">{edit.contactInfo}</p>;
                      }
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">ข้อมูลส่วนนี้แสดงเฉพาะในหลังบ้านแอดมินที่ได้รับอนุญาต</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>เปลี่ยนสถานะ</Label>
              </div>
              <div className="space-y-1.5">
                <Label>เปลี่ยนสถานะ</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(ORDER_STATUS).map((s) => <SelectItem key={s} value={s}>{ORDER_STATUS[s].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ข้อความจากแอดมินถึงลูกค้า</Label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="เช่น กำลังจัดเตรียมของ ขออภัยในความล่าช้า" className="bg-secondary/60" />
              </div>
              <div className="space-y-1.5">
                <Label>ข้อมูลการส่งมอบ (เช่น ข้อมูลไอดี/โค้ด — ลูกค้าเห็นเฉพาะของตัวเอง)</Label>
                <Textarea value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} placeholder="เช่น ไอดี: xxx / รหัสผ่าน: yyy (ควรส่งข้อมูลจริงทางช่องทางปลอดภัย)" className="bg-secondary/60" />
              </div>
              <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= เติมเงิน =================

function DepositsTab() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [reject, setReject] = useState<Deposit | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [bankName, setBankName] = useState('');

  const load = () => api<{ deposits: Deposit[] }>('/api/admin/deposits?status=ALL', { silent: true })
    .then((d) => setDeposits(d.deposits)).finally(() => setLoading(false));
  useEffect(() => {
    load();
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true })
      .then((d) => setBankName(d.settings.bank_name ?? ''))
      .catch(() => {});
  }, []);

  async function approve(d: Deposit) {
    setBusy(true);
    try {
      await api(`/api/admin/deposits/${d.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'approve' }) });
      toast({ title: `อนุมัติเติมเงิน ${formatTHB(d.amount)} สำเร็จ`, description: `เงินเข้ากระเป๋าของ ${d.user?.username} แล้ว` });
      load();
    } catch {
      // toast จาก api()
    } finally {
      setBusy(false);
    }
  }

  async function doReject() {
    if (!reject) return;
    setBusy(true);
    try {
      await api(`/api/admin/deposits/${reject.id}`, { method: 'PATCH', body: JSON.stringify({ action: 'reject', adminNote: note.trim() || 'ไม่พบรายการชำระเงิน' }) });
      toast({ title: 'ปฏิเสธคำขอเติมเงินแล้ว' });
      setReject(null);
      setNote('');
      load();
    } catch {
      // toast จาก api()
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">การอนุมัติจะเพิ่มยอดเข้ากระเป๋าลูกค้าทันที (มีการป้องกันการอนุมัติซ้ำจาก Backend) — กรุณาตรวจสอบสลิป/ลิงก์อังเปาจริงก่อนอนุมัติ</p>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">เลขอ้างอิง</th>
                <th className="px-4 py-3 text-left font-medium">สมาชิก</th>
                <th className="px-4 py-3 text-left font-medium">ช่องทาง</th>
                <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                <th className="px-4 py-3 text-left font-medium">หลักฐาน</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
              ) : deposits.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">ไม่มีคำขอเติมเงิน</td></tr>
              ) : (
                deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{d.refNo}</td>
                    <td className="px-4 py-3">{d.user?.username}<div className="text-[11px] text-muted-foreground">{d.user?.email}</div></td>
                    <td className="px-4 py-3"><DepositChannelChip method={d.method} bankName={bankName} /></td>
                    <td className="px-4 py-3 text-right price-gold">{formatTHB(d.amount)}</td>
                    <td className="px-4 py-3 max-w-48">
                      {d.angpaoLink && <a href={d.angpaoLink} target="_blank" rel="noreferrer" className="text-primary underline text-xs line-clamp-1">เปิดลิงก์อังเปา</a>}
                      {d.slipImage && <a href={d.slipImage} target="_blank" rel="noreferrer" className="text-primary underline text-xs">ดูสลิป</a>}
                    </td>
                    <td className="px-4 py-3 text-center"><DepositBadge status={d.status} />{d.adminNote && <div className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{d.adminNote}</div>}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {d.status === 'PENDING' ? (
                        <>
                          <Button size="sm" className="mr-1.5 bg-emerald-600 hover:bg-emerald-500 text-white" disabled={busy} onClick={() => approve(d)}>
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> อนุมัติ
                          </Button>
                          <Button size="sm" variant="outline" className="border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300" disabled={busy} onClick={() => { setReject(d); setNote(''); }}>
                            <XCircle className="mr-1 h-3.5 w-3.5" /> ปฏิเสธ
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">ตรวจแล้ว {d.reviewedAt ? formatDateTime(d.reviewedAt) : ''}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!reject} onOpenChange={(v) => !v && setReject(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">ปฏิเสธคำขอ {reject?.refNo}</DialogTitle>
            <DialogDescription>ระบุเหตุผลเพื่อแจ้งลูกค้า (ลูกค้าเห็นข้อความนี้)</DialogDescription>
          </DialogHeader>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ยอดโอนไม่ตรง / สลิปไม่ชัด กรุณาส่งใหม่" className="bg-secondary/60" />
          <Button className="w-full h-11 border-destructive/50 bg-destructive/20 text-rose-300 hover:bg-destructive/30" onClick={doReject} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} ยืนยันปฏิเสธ
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= สินค้า =================

function ProductsTab() {
  const [products, setProducts] = useState<(Product & { _count?: { orderItems: number } })[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [filterCat, setFilterCat] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'new' | 'edit' | null>(null);
  const [form, setForm] = useState({
    id: '', code: '', title: '', description: '', categoryId: '', price: '', stock: '1', privateDelivery: '', credentialText: '',
    images: ['/images/prod-ff-1.png', '/images/prod-ff-2.png'] as string[],
    status: 'AVAILABLE', featured: false,
    detailsText: 'เลเวล: 60\nสกินทั้งหมด: 20 สกิน',
  });
  const [saving, setSaving] = useState(false);

  const load = () => api<{ products: Product[] }>('/api/admin/products', { silent: true })
    .then((d) => setProducts(d.products as never)).finally(() => setLoading(false));
  useEffect(() => {
    load();
    api<{ categories: Category[] }>('/api/admin/categories', { silent: true }).then((d) => setCats(d.categories)).catch(() => {});
  }, []);

  function openNew() {
    setForm({ id: '', code: `ID-${Date.now().toString().slice(-6)}`, title: '', description: '', categoryId: cats.find((c) => c.type === 'GAME_ID')?.id ?? '', price: '', stock: '1', privateDelivery: '', credentialText: '', images: ['/images/prod-ff-1.png'], status: 'AVAILABLE', featured: false, detailsText: '' });
    setDialog('new');
  }
  function openEdit(p: Product) {
    setForm({
      id: p.id, code: p.code, title: p.title, description: p.description, categoryId: p.categoryId, price: String(p.price), stock: String(p.status === 'SOLD' ? 0 : (p.stock ?? 1)), privateDelivery: p.privateDelivery ?? '', credentialText: (p.credentials ?? []).map((c) => `${c.username}:${c.password}`).join('\n'),
      images: p.images.length > 0 ? p.images : ['/images/prod-ff-1.png'], status: p.status, featured: p.featured,
      detailsText: p.details.map((d) => `${d.label}: ${d.value}`).join('\n'),
    });
    setDialog('edit');
  }

  async function save() {
    const selectedCategory = cats.find((c) => c.id === form.categoryId && c.type === 'GAME_ID');
    if (!selectedCategory) {
      toast({ title: 'กรุณาเลือกหมวดไอดีเกมให้ถูกต้อง', description: 'เลือกหมวด Free Fire หรือหมวดไอดีเกมที่ต้องการก่อนบันทึก', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const images = form.images.map((s) => s.trim()).filter(Boolean);
      if (images.length === 0) {
        toast({ title: 'กรุณาเพิ่มรูปสินค้าอย่างน้อย 1 รูป', variant: 'destructive' });
        setSaving(false);
        return;
      }
      const details = form.detailsText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const idx = l.indexOf(':');
        return { label: idx > 0 ? l.slice(0, idx).trim() : 'รายละเอียด', value: idx > 0 ? l.slice(idx + 1).trim() : l };
      });
      const credentials = form.credentialText.split('\n').map((line) => {
        const index = line.indexOf(':');
        return index > 0 ? { username: line.slice(0, index).trim(), password: line.slice(index + 1).trim() } : null;
      }).filter((item): item is { username: string; password: string } => !!item && !!item.username && !!item.password);
      const body = JSON.stringify({
        code: form.code, title: form.title, description: form.description, categoryId: form.categoryId,
        price: parseFloat(form.price), stock: selectedCategory.deliveryMode === 'ACCOUNT' ? credentials.length : 1,
        credentials, privateDelivery: form.privateDelivery.trim() || null, images, details, status: form.status, featured: form.featured,
      });
      if (dialog === 'new') await api('/api/admin/products', { method: 'POST', body });
      else await api(`/api/admin/products/${form.id}`, { method: 'PATCH', body });
      toast({ title: dialog === 'new' ? 'เพิ่มสินค้าใหม่สำเร็จ' : 'บันทึกสินค้าสำเร็จ', description: 'เว็บหน้าหลักอัปเดตทันทีที่บันทึก' });
      setDialog(null);
      load();
    } catch {
      // toast จาก api()
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`ลบสินค้า ${p.code}? หากมีประวัติการซื้อ ระบบจะซ่อนแทนการลบ`)) return;
    try {
      const res = await api<{ message?: string }>(`/api/admin/products/${p.id}`, { method: 'DELETE' });
      toast({ title: res.message || 'ลบสินค้าสำเร็จ' });
      load();
    } catch {
      // toast จาก api()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">สินค้าที่เพิ่ม/แก้ไขจะแสดงในหน้าเว็บหลักของหมวดนั้นทันทีหลังกดบันทึก</p>
        <div className="flex items-center gap-2">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-56 bg-secondary/60" aria-label="กรองตามหมวดหมู่"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">ทุกหมวดหมู่</SelectItem>
              {cats.filter((c) => c.type === 'GAME_ID').map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> เพิ่มสินค้าใหม่</Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium">รหัส</th>
                <th className="px-4 py-3 text-left font-medium">ภาพ</th>
                <th className="px-4 py-3 text-left font-medium">ชื่อสินค้า</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">หมวด</th>
                <th className="px-4 py-3 text-right font-medium">ราคา</th>
                <th className="px-4 py-3 text-center font-medium">สต็อก</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
              ) : products.filter((p) => filterCat === 'ALL' || p.categoryId === filterCat).length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีสินค้าในหมวดนี้ — กด "เพิ่มสินค้าใหม่" เพื่อเริ่ม</td></tr>
              ) : (
                products.filter((p) => filterCat === 'ALL' || p.categoryId === filterCat).map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                    <td className="px-4 py-3"><SafeImage src={p.images[0]} alt={p.title} className="h-10 w-14 rounded object-cover border border-border" /></td>
                    <td className="px-4 py-3 max-w-56"><span className="line-clamp-1">{p.title}</span>{p.featured && <span className="text-[10px] text-[#f0b429]">แนะนำ</span>}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right price-gold">{formatTHB(p.price)}</td>
                    <td className="px-4 py-3 text-center font-mono">{p.stock ?? 1}</td>
                    <td className="px-4 py-3 text-center">{p.status === 'SOLD' || p.stock <= 0 ? <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300">หมดสต็อก</span> : p.status === 'HIDDEN' ? <span className="text-xs text-zinc-400">ซ่อน</span> : <span className="text-xs text-emerald-300">พร้อมขาย</span>}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="mr-1.5" onClick={() => openEdit(p)}><Pencil className="mr-1 h-3.5 w-3.5" /> แก้ไข</Button>
                      <Button size="sm" variant="outline" className="border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => remove(p)}><Trash2 className="mr-1 h-3.5 w-3.5" /> ลบ</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === 'new' ? 'เพิ่มสินค้าใหม่' : 'แก้ไขสินค้า'}</DialogTitle>
            <DialogDescription>ตั้งราคา รูปภาพ และรายละเอียดไอดี (ห้ามใส่รหัสผ่านจริงในช่องข้อมูลสาธารณะ)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>รหัสสินค้า</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="bg-secondary/60 font-mono" /></div>
            <div className="space-y-1.5"><Label>ราคา (บาท)</Label><Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>สต็อกสินค้า</Label><Input value={cats.find((c) => c.id === form.categoryId)?.deliveryMode === 'ACCOUNT' ? String(form.credentialText.split('\n').filter((line) => line.includes(':') && line.split(':')[0].trim() && line.split(':').slice(1).join(':').trim()).length) : '1'} readOnly className="bg-secondary/60" /><p className="text-[11px] text-muted-foreground">{cats.find((c) => c.id === form.categoryId)?.deliveryMode === 'ACCOUNT' ? 'นับจากจำนวน User:Pass ที่เพิ่มด้านล่างอัตโนมัติ' : 'หมวดทักเพจมีสต็อก 1 ชิ้นต่อสินค้า'}</p></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>ชื่อสินค้า</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-secondary/60" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label>รายละเอียดสินค้า</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-secondary/60 min-h-20" /></div>
            <div className="space-y-1.5">
              <Label>หมวดหมู่</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue placeholder="เลือกหมวด" /></SelectTrigger>
                <SelectContent>
                  {cats.filter((c) => c.type === 'GAME_ID').map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>สถานะ</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">พร้อมขาย</SelectItem>
                  <SelectItem value="SOLD">ขายแล้ว</SelectItem>
                  <SelectItem value="HIDDEN">ซ่อน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>รูปสินค้า (อัปโหลดจากเครื่อง หรือวางลิงก์)</Label>
              <MultiImageUpload images={form.images} onChange={(urls) => setForm((f) => ({ ...f, images: urls }))} />
            </div>
            {cats.find((c) => c.id === form.categoryId)?.deliveryMode === 'ACCOUNT' && <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3"><Label>สต็อกบัญชี (User:Pass) — เพิ่ม 1 บรรทัดต่อ 1 บัญชี</Label><Textarea value={form.credentialText} onChange={(e) => setForm((f) => ({ ...f, credentialText: e.target.value }))} placeholder={'user1:pass1\nuser2:pass2'} className="bg-secondary/60 min-h-28 font-mono text-xs" /><p className="text-[11px] text-muted-foreground">จำนวนสต็อกคำนวณจากจำนวนบรรทัด User:Pass และระบบจะตัดออก 1 ชุดเมื่อลูกค้าซื้อสำเร็จ ข้อมูลจะไม่แสดงต่อสาธารณะ</p></div>}
            <div className="space-y-1.5 sm:col-span-2">
              <Label>รายละเอียดไอดี (บรรทัดละรายการ รูปแบบ "หัวข้อ: ค่า")</Label>
              <Textarea value={form.detailsText} onChange={(e) => setForm((f) => ({ ...f, detailsText: e.target.value }))} className="bg-secondary/60 min-h-24 font-mono text-xs" />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))} id="feat" />
              <Label htmlFor="feat">ตั้งเป็นสินค้าแนะนำ (แสดงหน้าแรก)</Label>
            </div>
          </div>
          <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกสินค้า
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= แพ็กเกจเติมเกม =================

function PackagesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [catId, setCatId] = useState('');
  const [pkgs, setPkgs] = useState<TopupPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'new' | 'edit' | null>(null);
  const [form, setForm] = useState({ id: '', name: '', amount: '', price: '', badge: '', sortOrder: '0', active: true });
  const [saving, setSaving] = useState(false);

  const topupCats = cats.filter((c) => c.type === 'TOPUP');

  useEffect(() => {
    api<{ categories: Category[] }>('/api/admin/categories', { silent: true })
      .then((d) => {
        setCats(d.categories);
        const first = d.categories.find((c) => c.type === 'TOPUP');
        if (first) setCatId(first.id);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadPkgs = () => {
    if (!catId) { setPkgs([]); return; }
    api<{ packages: TopupPackage[] }>(`/api/admin/packages?categoryId=${catId}`, { silent: true })
      .then((d) => setPkgs(d.packages))
      .catch(() => setPkgs([]));
  };
  useEffect(() => { loadPkgs(); }, [catId]);

  function openNew() {
    setForm({ id: '', name: '', amount: '', price: '', badge: '', sortOrder: String(pkgs.length), active: true });
    setDialog('new');
  }
  function openEdit(p: TopupPackage) {
    setForm({ id: p.id, name: p.name, amount: p.amount != null ? String(p.amount) : '', price: String(p.price), badge: p.badge ?? '', sortOrder: String(p.sortOrder ?? 0), active: p.active ?? true });
    setDialog('edit');
  }

  async function save() {
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: form.name,
        amount: form.amount.trim() ? parseInt(form.amount, 10) : null,
        price: parseFloat(form.price),
        badge: form.badge.trim() || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
        active: form.active,
      });
      if (dialog === 'new') await api('/api/admin/packages', { method: 'POST', body: JSON.stringify({ ...JSON.parse(body), categoryId: catId }) });
      else await api(`/api/admin/packages/${form.id}`, { method: 'PATCH', body });
      toast({ title: dialog === 'new' ? 'เพิ่มแพ็กเกจสำเร็จ' : 'บันทึกแพ็กเกจสำเร็จ', description: 'ลูกค้าจะเห็นแพ็กเกจนี้ในหน้าเติมเกมทันที' });
      setDialog(null);
      loadPkgs();
    } catch {
      // toast จาก api()
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: TopupPackage) {
    try {
      await api(`/api/admin/packages/${p.id}`, { method: 'PATCH', body: JSON.stringify({ active: !(p.active ?? true) }) });
      toast({ title: (p.active ?? true) ? 'ปิดแสดงแพ็กเกจแล้ว' : 'เปิดแสดงแพ็กเกจแล้ว' });
      loadPkgs();
    } catch {
      // toast จาก api()
    }
  }

  async function remove(p: TopupPackage) {
    if (!confirm(`ลบแพ็กเกจ "${p.name}" ?`)) return;
    try {
      await api(`/api/admin/packages/${p.id}`, { method: 'DELETE' });
      toast({ title: 'ลบแพ็กเกจสำเร็จ' });
      loadPkgs();
    } catch {
      // toast จาก api()
    }
  }

  const currentCat = topupCats.find((c) => c.id === catId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">แพ็กเกจเติมเกม (เช่น เพชร, Robux) แสดงในหมวด «หมวดหมู่เติมเกม» ของเว็บหลักทันทีเมื่อบันทึก</p>
        <div className="flex items-center gap-2">
          <Select value={catId} onValueChange={setCatId}>
            <SelectTrigger className="w-56 bg-secondary/60" aria-label="เลือกหมวดเติมเกม"><SelectValue placeholder="เลือกหมวด" /></SelectTrigger>
            <SelectContent>
              {topupCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={!catId} onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> เพิ่มแพ็กเกจ</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium">แพ็กเกจ</th>
                <th className="px-4 py-3 text-right font-medium">จำนวน</th>
                <th className="px-4 py-3 text-right font-medium">ราคา</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">ป้ายกำกับ</th>
                <th className="px-4 py-3 text-center font-medium">ลำดับ</th>
                <th className="px-4 py-3 text-center font-medium">แสดง</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
              ) : !currentCat ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีหมวดประเภท «เติมเกม» — เพิ่มได้ในแท็บหมวดหมู่</td></tr>
              ) : pkgs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีแพ็กเกจในหมวดนี้ — กด «เพิ่มแพ็กเกจ» เพื่อเริ่ม</td></tr>
              ) : (
                pkgs.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.amount != null ? p.amount.toLocaleString('th-TH') : '-'}</td>
                    <td className="px-4 py-3 text-right price-gold">{formatTHB(p.price)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{p.badge ? <span className="rounded-md bg-primary/15 border border-primary/30 px-2 py-0.5 text-[11px] text-primary">{p.badge}</span> : <span className="text-muted-foreground text-xs">-</span>}</td>
                    <td className="px-4 py-3 text-center">{p.sortOrder ?? 0}</td>
                    <td className="px-4 py-3 text-center"><Switch checked={p.active ?? true} onCheckedChange={() => toggleActive(p)} aria-label={`สลับการแสดง ${p.name}`} /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="mr-1.5" onClick={() => openEdit(p)}><Pencil className="mr-1 h-3.5 w-3.5" /> แก้ไข</Button>
                      <Button size="sm" variant="outline" className="border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => remove(p)}><Trash2 className="mr-1 h-3.5 w-3.5" /> ลบ</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === 'new' ? `เพิ่มแพ็กเกจใน ${currentCat?.name ?? ''}` : 'แก้ไขแพ็กเกจ'}</DialogTitle>
            <DialogDescription>ตั้งชื่อ จำนวน (เพชร/Robux) ราคา และป้ายกำกับ เช่น ยอดนิยม / คุ้มสุด</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>ชื่อแพ็กเกจ *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="เช่น 520 เพชร" className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>จำนวน (เช่น 520 — เว้นว่างได้)</Label><Input value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '') }))} inputMode="numeric" className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>ราคา (บาท) *</Label><Input value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^\d.]/g, '') }))} inputMode="decimal" className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>ป้ายกำกับ (เช่น ยอดนิยม)</Label><Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>ลำดับการแสดง (0-99)</Label><Input value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value.replace(/[^\d]/g, '') }))} inputMode="numeric" className="bg-secondary/60" /></div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm((f) => ({ ...f, active: v }))} id="pkg-active" />
              <Label htmlFor="pkg-active">เปิดแสดงแพ็กเกจนี้ในหน้าเว็บหลัก</Label>
            </div>
          </div>
          <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={save} disabled={saving || !form.name.trim() || !parseFloat(form.price)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกแพ็กเกจ
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= หมวดหมู่ =================

function CategoriesTab() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'new' | 'edit' | null>(null);
  const [form, setForm] = useState({ id: '', slug: '', name: '', type: 'GAME_ID', game: 'freefire', deliveryMode: 'PAGE', image: '/images/cover-freefire.png', description: '', sortOrder: '6', active: true });
  const [saving, setSaving] = useState(false);

  const load = () => api<{ categories: Category[] }>('/api/admin/categories', { silent: true })
    .then((d) => setCats(d.categories)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  function openNew() {
    setForm({ id: '', slug: '', name: '', type: 'GAME_ID', game: 'freefire', deliveryMode: 'PAGE', image: '/images/cover-freefire.png', description: '', sortOrder: '6', active: true });
    setDialog('new');
  }
  function openEdit(c: Category) {
    setForm({ id: c.id, slug: c.slug, name: c.name, type: c.type, game: c.game ?? 'freefire', deliveryMode: c.deliveryMode ?? 'PAGE', image: c.image ?? '', description: c.description ?? '', sortOrder: String(c.sortOrder ?? 0), active: c.active ?? true });
    setDialog('edit');
  }

  async function save() {
    setSaving(true);
    try {
      const body = JSON.stringify({
        slug: form.slug, name: form.name, type: form.type, game: form.type === 'GAME_ID' ? form.game : null, deliveryMode: form.type === 'GAME_ID' ? form.deliveryMode : 'PAGE',
        image: form.image || null, description: form.description || null,
        sortOrder: parseInt(form.sortOrder, 10) || 0, active: form.active,
      });
      if (dialog === 'new') await api('/api/admin/categories', { method: 'POST', body });
      else await api(`/api/admin/categories/${form.id}`, { method: 'PATCH', body });
      toast({ title: dialog === 'new' ? 'เพิ่มหมวดหมู่สำเร็จ' : 'บันทึกหมวดหมู่สำเร็จ', description: 'เว็บหน้าหลักจะแสดงหมวดนี้ทันที (ปิดใช้งาน = ซ่อน)' });
      setDialog(false);
      load();
    } catch {
      // toast จาก api()
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: Category) {
    try {
      await api(`/api/admin/categories/${c.id}`, { method: 'PATCH', body: JSON.stringify({ active: !c.active }) });
      toast({ title: c.active ? 'ปิดใช้งานหมวดแล้ว' : 'เปิดใช้งานหมวดแล้ว' });
      load();
    } catch {
      // toast จาก api()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">หมวดหมู่ที่ «เปิดใช้งาน» เท่านั้นที่แสดงบนเว็บหลัก — แต่ละหมวดใส่รูปปก ชื่อ และคำอธิบายได้เอง</p>
        <Button className="btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={openNew}><Plus className="mr-1.5 h-4 w-4" /> เพิ่มหมวดหมู่</Button>
      </div>
      <div className="grid gap-3 md:hidden">
        {loading ? (
          <div className="rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">กำลังโหลดหมวดหมู่...</div>
        ) : cats.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-3 flex gap-3">
            <SafeImage src={c.image} alt={`ปก ${c.name}`} className="h-16 w-20 shrink-0 rounded-lg object-cover border border-border" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{c.name}</div>
              <div className="text-[11px] text-muted-foreground font-mono">{c.slug}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {c.type === 'GAME_ID' ? 'ไอดีเกม' : 'เติมเกม'} · {c.type !== 'GAME_ID' ? 'แพ็กเกจเติมเกม' : c.deliveryMode === 'ACCOUNT' ? 'รับ User:Pass' : 'ทักเพจ'}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit / แก้ไข</Button>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} aria-label={`สลับการใช้งาน ${c.name}`} />
                  {c.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden md:block rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ปก</th>
              <th className="px-4 py-3 text-left font-medium">Slug</th>
              <th className="px-4 py-3 text-left font-medium">ชื่อ</th>
              <th className="px-4 py-3 text-left font-medium">ประเภท</th>
              <th className="px-4 py-3 text-left font-medium">วิธีรับสินค้า</th>
              <th className="px-4 py-3 text-center font-medium">สินค้า</th>
              <th className="px-4 py-3 text-center font-medium">แพ็กเกจ</th>
              <th className="px-4 py-3 text-center font-medium">ใช้งาน</th>
              <th className="px-4 py-3 text-right font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
            ) : (
              cats.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3"><SafeImage src={c.image} alt={`ปก ${c.name}`} className="h-9 w-16 rounded object-cover border border-border" /></td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.type === 'GAME_ID' ? 'ไอดีเกม' : 'เติมเกม'}</td>
                  <td className="px-4 py-3">{c.type !== 'GAME_ID' ? 'เติมเกม' : c.deliveryMode === 'ACCOUNT' ? 'รับ User:Pass' : 'ทักเพจ'}</td>
                  <td className="px-4 py-3 text-center">{c._count?.products ?? 0}</td>
                  <td className="px-4 py-3 text-center">{c._count?.packages ?? 0}</td>
                  <td className="px-4 py-3 text-center"><Switch checked={c.active} onCheckedChange={() => toggleActive(c)} aria-label={`สลับการใช้งาน ${c.name}`} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Pencil className="mr-1 h-3.5 w-3.5" /> แก้ไข</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!dialog} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="sm:max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{dialog === 'new' ? 'เพิ่มหมวดหมู่ใหม่' : `แก้ไขหมวดหมู่: ${form.name}`}</DialogTitle>
            <DialogDescription>ตั้งชื่อหมวด อัปโหลดรูปปก และเลือกประเภท (ไอดีเกม = ขายไอดี, เติมเกม = ขายแพ็กเกจเติม)</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Slug (a-z 0-9 -)</Label><Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} className="bg-secondary/60 font-mono" /></div>
            <div className="space-y-1.5"><Label>ชื่อหมวด *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="เช่น ไอดี Valorant" className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>ลำดับการแสดงผล</Label><Input type="number" min="0" max="99" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="bg-secondary/60" /><p className="text-[11px] text-muted-foreground">เลขน้อยจะแสดงก่อน</p></div>
            <div className="space-y-1.5">
              <Label>ประเภท</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GAME_ID">ไอดีเกม (ขายไอดี)</SelectItem>
                  <SelectItem value="TOPUP">เติมเกม (แพ็กเกจ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              {form.type === 'GAME_ID' && <div className="space-y-1.5 sm:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
              <Label>วิธีรับสินค้าของหมวดนี้</Label>
              <Select value={form.deliveryMode} onValueChange={(v) => setForm((f) => ({ ...f, deliveryMode: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGE">ทักเพจร้านเพื่อรับสินค้า (สต็อก 1 ต่อสินค้า)</SelectItem>
                  <SelectItem value="ACCOUNT">รับ User : Pass อัตโนมัติ (สต็อกจากบัญชีที่เพิ่ม)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">เปลี่ยนได้ทั้งตอนสร้างหมวดใหม่และแก้ไขหมวดเดิม</p>
            </div>}
            <Label>เกม (สำหรับไอดีเกม)</Label>
              <Select value={form.game} onValueChange={(v) => setForm((f) => ({ ...f, game: v }))} disabled={form.type !== 'GAME_ID'}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="freefire">Free Fire</SelectItem>
                  <SelectItem value="roblox">Roblox</SelectItem>
                  <SelectItem value="giftpass">Gift Pass</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>รูปปกหมวด (อัปโหลดจากเครื่อง หรือวางลิงก์)</Label>
              <SingleImageUpload value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} label="อัปโหลดรูปปกหมวด" />
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label>คำอธิบาย</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="bg-secondary/60" /></div>
          </div>
          <Button className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={save} disabled={saving || !form.name.trim() || !form.slug.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกหมวดหมู่
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= สมาชิก =================

function UsersTab() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [resets, setResets] = useState<{ id: string; code: string; expiresAt: string; user: { username: string; email: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjust, setAdjust] = useState<AdminUserRow | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [resetPw, setResetPw] = useState<AdminUserRow | null>(null);
  const [newPw, setNewPw] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => Promise.all([
    api<{ users: AdminUserRow[] }>('/api/admin/users', { silent: true }),
    api<{ requests: typeof resets }>('/api/admin/reset-requests', { silent: true }),
  ]).then(([u, r]) => {
    setUsers(u.users);
    setResets(r.requests);
  }).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function patch(id: string, body: Record<string, unknown>, msg: string) {
    setBusy(true);
    try {
      await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
      toast({ title: msg });
      load();
    } catch {
      // toast จาก api()
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {resets.length > 0 && (
        <div className="gaming-card border-[#f0b429]/40 p-5">
          <h3 className="font-display font-semibold flex items-center gap-2 text-[#f0b429] mb-2"><KeyRound className="h-4.5 w-4.5" /> คำขอรีเซ็ตรหัสผ่านที่รอให้รหัส</h3>
          <p className="text-xs text-muted-foreground mb-3">ยังไม่ได้เชื่อมผู้ให้บริการส่งอีเมล — แจ้งรหัสนี้ให้ลูกค้าผ่านช่องทางติดต่อที่ยืนยันตัวตนได้</p>
          <div className="space-y-2">
            {resets.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-secondary/40 px-4 py-2.5 text-sm">
                <span className="font-medium">{r.user.username}</span>
                <span className="text-muted-foreground text-xs">{r.user.email}</span>
                <span className="ml-auto font-mono font-bold text-lg tracking-widest text-[#f0b429]">{r.code}</span>
                <span className="text-[11px] text-muted-foreground">หมดอายุ {formatDateTime(r.expiresAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">สมาชิก</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">สมัครเมื่อ</th>
                <th className="px-4 py-3 text-right font-medium">ยอดกระเป๋า</th>
                <th className="px-4 py-3 text-center font-medium">คำสั่งซื้อ</th>
                <th className="px-4 py-3 text-center font-medium">สถานะ</th>
                <th className="px-4 py-3 text-right font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{u.username} {u.role === 'ADMIN' && <span className="ml-1 rounded bg-[#f0b429]/15 border border-[#f0b429]/40 px-1.5 py-0.5 text-[10px] text-[#f0b429]">ADMIN</span>}</div>
                      <div className="text-[11px] text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDateTime(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right price-gold">{formatTHB(u.walletBalance)}</td>
                    <td className="px-4 py-3 text-center">{u.orderCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border-rose-500/30'}`}>
                        {u.status === 'ACTIVE' ? 'ปกติ' : 'ถูกระงับ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="mr-1.5" onClick={() => { setAdjust(u); setAmount(''); setNote(''); }}><CircleDollarSign className="mr-1 h-3.5 w-3.5" /> ปรับยอด</Button>
                      <Button size="sm" variant="outline" className="mr-1.5" onClick={() => { setResetPw(u); setNewPw(''); }}><KeyRound className="mr-1 h-3.5 w-3.5" /> รีเซ็ตรหัส</Button>
                      <Button
                        size="sm" variant="outline"
                        className={u.status === 'ACTIVE' ? 'border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300' : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-300'}
                        disabled={busy || u.role === 'ADMIN'}
                        onClick={() => patch(u.id, { status: u.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE' }, u.status === 'ACTIVE' ? 'ระงับบัญชีแล้ว' : 'ปลดระงับบัญชีแล้ว')}
                      >
                        <Ban className="mr-1 h-3.5 w-3.5" /> {u.status === 'ACTIVE' ? 'ระงับ' : 'ปลดระงับ'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!adjust} onOpenChange={(v) => !v && setAdjust(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">ปรับยอดกระเป๋า — {adjust?.username}</DialogTitle>
            <DialogDescription>บันทึกเป็นรายการ ADMIN_ADJUST ในประวัติกระเป๋าของสมาชิก</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>จำนวนเงิน (ใส่ลบเพื่อหัก เช่น -100)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.-]/g, ''))} className="bg-secondary/60" /></div>
            <div className="space-y-1.5"><Label>เหตุผล *</Label><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น คืนเงินกรณีพิเศษ" className="bg-secondary/60" /></div>
            <Button
              className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={busy || !parseFloat(amount) || !note.trim()}
              onClick={async () => {
                await patch(adjust!.id, { adjustBalance: { amount: parseFloat(amount), note: note.trim() } }, 'ปรับยอดสำเร็จ');
                setAdjust(null);
              }}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกการปรับยอด
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetPw} onOpenChange={(v) => !v && setResetPw(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">ตั้งรหัสผ่านใหม่ให้ {resetPw?.username}</DialogTitle>
            <DialogDescription>ระบบจะเข้ารหัสรหัสผ่านใหม่ด้วย scrypt และบังคับล็อกเอาต์ทุกเครื่อง</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</Label><Input value={newPw} onChange={(e) => setNewPw(e.target.value)} className="bg-secondary/60" /></div>
            <Button
              className="w-full h-11 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={busy || newPw.length < 8}
              onClick={async () => {
                await patch(resetPw!.id, { newPassword: newPw }, 'ตั้งรหัสผ่านใหม่สำเร็จ');
                setResetPw(null);
              }}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกรหัสผ่านใหม่
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ================= ตั้งค่าร้าน =================

function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ settings: Settings }>('/api/admin/settings', { silent: true })
      .then((d) => setSettings(d.settings))
      .finally(() => setLoading(false));
  }, []);

  const fields: { key: string; label: string; icon?: React.ComponentType<{ className?: string }>; placeholder?: string }[] = [
    { key: 'store_tagline', label: 'คำโปรยร้าน' },
    { key: 'hero_title', label: 'หัวข้อ Hero Banner' },
    { key: 'hero_subtitle', label: 'ข้อความรอง Hero Banner' },
    { key: 'home_id_title', label: 'หัวข้อหมวดหมู่ไอดีเกม (หน้าแรก)' },
    { key: 'home_id_subtitle', label: 'คำอธิบายหมวดหมู่ไอดีเกม (หน้าแรก)' },
    { key: 'home_topup_title', label: 'หัวข้อหมวดหมู่เติมเกม (หน้าแรก)' },
    { key: 'home_topup_subtitle', label: 'คำอธิบายหมวดหมู่เติมเกม (หน้าแรก)' },
    { key: 'announcement', label: 'ข้อความประกาศ (แถบบนหัวเว็บ)', icon: Megaphone },
    { key: 'contact_line', label: 'LINE ID', icon: MessageCircle },
    { key: 'contact_facebook', label: 'Facebook', icon: MessageCircle },
    { key: 'contact_phone', label: 'เบอร์โทรศัพท์', icon: Phone },
    { key: 'contact_email', label: 'อีเมล', icon: Mail },
    { key: 'contact_hours', label: 'เวลาทำการ', icon: Clock },
    { key: 'policy_delivery', label: 'นโยบายการส่งมอบ' },
    { key: 'policy_warranty', label: 'นโยบายการรับประกัน' },
  ];

  const bankFields: { key: string; label: string; placeholder?: string }[] = [
    { key: 'bank_name', label: 'ชื่อธนาคาร', placeholder: 'เช่น ธนาคารกสิกรไทย (KBank)' },
    { key: 'bank_account_name', label: 'ชื่อบัญชีร้าน' },
    { key: 'bank_account_number', label: 'เลขบัญชี', placeholder: 'เช่น 123-4-56789-0' },
    { key: 'bank_promptpay', label: 'พร้อมเพย์ / เบอร์รับเงิน', placeholder: 'เช่น 08x-xxx-xxxx' },
  ];

  async function save() {
    setSaving(true);
    try {
      await api('/api/admin/settings', { method: 'PATCH', body: JSON.stringify({ settings }) });
      toast({ title: 'บันทึกตั้งค่าร้านสำเร็จ', description: 'หน้าเว็บหลักและหน้าเติมเงินจะใช้ค่าใหม่ทันที' });
    } catch {
      // toast จาก api()
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-64 rounded-2xl bg-secondary/30 animate-pulse" />;

  return (
    <div className="space-y-5">
      <div className="gaming-card p-6 space-y-4">
        <div>
          <h3 className="font-display font-semibold mb-1">แบรนด์ร้านค้า</h3>
          <p className="text-xs text-muted-foreground">ตั้งชื่อร้านและอัปโหลดโลโก้ที่จะแสดงบนหัวเว็บ เมนูด้านข้าง และท้ายเว็บ</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="st-store_name">ชื่อร้าน</Label>
            <Input id="st-store_name" value={settings.store_name ?? 'LrapX Store'} onChange={(e) => setSettings((s) => ({ ...s, store_name: e.target.value }))} placeholder="ชื่อร้าน" className="bg-secondary/60" />
          </div>
          <div className="space-y-1.5">
            <Label>โลโก้ร้าน (แนะนำ PNG พื้นหลังโปร่งใส)</Label>
            <SingleImageUpload value={settings.store_logo ?? ''} onChange={(url) => setSettings((s) => ({ ...s, store_logo: url }))} label="อัปโหลดโลโก้ร้าน" aspect="aspect-square max-w-40" />
          </div>
        </div>
      </div>
      <div className="gaming-card p-6">
        <h3 className="font-display font-semibold mb-4">ข้อมูลร้านและช่องทางติดต่อ</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label htmlFor={`st-${f.key}`} className="flex items-center gap-1.5 text-sm">
                {f.icon && <f.icon className="h-3.5 w-3.5 text-muted-foreground" />} {f.label}
              </Label>
              <Input
                id={`st-${f.key}`}
                value={settings[f.key] ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                className="bg-secondary/60"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ช่องทางรับเงิน — โลโก้แสดงหน้าชื่อช่องทางในหน้าเติมเงิน */}
      <div className="gaming-card p-6 space-y-5">
        <div>
          <h3 className="font-display font-semibold mb-1">ช่องทางรับเงิน (หน้าเติมเงิน)</h3>
          <p className="text-xs text-muted-foreground">ลูกค้าจะเห็นสองช่องทางนี้ในหน้า «เติมเงินเข้ากระเป๋า» — แก้ค่าได้เลยแล้วกดบันทึก หน้าเว็บหลักจะเปลี่ยนตามทันที</p>
        </div>

        {/* ซองอั่งเปา — TrueMoney Wallet */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <TrumoneyLogo className="h-10 w-10" />
            <div>
              <div className="font-display font-semibold text-sm">ซองอังเปา — TrueMoney Wallet</div>
              <div className="text-[11px] text-muted-foreground">ลูกค้าส่งลิงก์ซองอังเปา (gift.truemoney.com) + แอดมินกดรับเงินจากลิงก์แล้วอนุมัติ</div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="st-truemoney" className="flex items-center gap-1.5 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> เบอร์ TrueMoney Wallet ของร้าน (ถ้ามี — จะแสดงให้ลูกค้าดูในหน้าเติมเงิน)</Label>
            <Input
              id="st-truemoney"
              value={settings.truemoney_phone ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, truemoney_phone: e.target.value }))}
              placeholder="เช่น 08x-xxx-xxxx" className="bg-secondary/60"
            />
          </div>
        </div>

        {/* ธนาคาร — KBank */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center gap-3 mb-3">
            <KbankLogo className="h-10 w-10" />
            <div>
              <div className="font-display font-semibold text-sm">โอนเงินผ่านธนาคาร — {settings.bank_name || 'ธนาคารกสิกรไทย (KBank)'}</div>
              <div className="text-[11px] text-muted-foreground">ลูกค้าโอนเข้าบัญชี/สแกน QR แล้วแนบสลิป — แอดมินตรวจสลิปและกดอนุมัติ</div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {bankFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`st-${f.key}`} className="flex items-center gap-1.5 text-sm"><Landmark className="h-3.5 w-3.5 text-muted-foreground" /> {f.label}</Label>
                <Input
                  id={`st-${f.key}`}
                  value={settings[f.key] ?? ''}
                  onChange={(e) => setSettings((s) => ({ ...s, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="bg-secondary/60"
                />
              </div>
            ))}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="flex items-center gap-1.5 text-sm"><Landmark className="h-3.5 w-3.5 text-muted-foreground" /> QR PromptPay / QR บัญชีร้าน (แสดงในหน้าเติมเงินถ้าอัปโหลด)</Label>
              <SingleImageUpload
                value={settings.bank_qr_image ?? ''}
                onChange={(url) => setSettings((s) => ({ ...s, bank_qr_image: url }))}
                label="อัปโหลดภาพ QR สำหรับลูกค้าสแกนจ่าย"
                aspect="aspect-square max-w-52"
              />
            </div>
          </div>
        </div>

        <Button className="h-11 px-8 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} บันทึกตั้งค่าทั้งหมด
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        ชื่อร้านและโลโก้เปลี่ยนได้จากส่วน «แบรนด์ร้านค้า» ด้านบน แล้วกดบันทึกตั้งค่าทั้งหมด
      </p>
    </div>
  );
}
