/** หน้าเติมเกม: Hub + Free Fire + Roblox + Gift Game Pass */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { navigate } from '@/lib/router';
import { api, type Category, type TopupPackage } from '@/lib/client';
import { useApp } from '@/lib/store';
import { formatTHB } from '@/lib/format';
import { SectionHeading, PackageCard, EmptyState } from '@/components/shared';
import { PurchaseDialog, type OrderDraft } from '@/components/purchase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
  Zap, Gift, ChevronRight, ShieldCheck, Timer, Coins, UserRound,
  CheckCircle2, Gamepad2,
} from 'lucide-react';

// ================= Hub รวมบริการเติมเกม =================

export function TopupHubPage() {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>('/api/data/categories', { silent: true })
      .then((d) => setCats(d.categories.filter((c) => c.type === 'TOPUP')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categoryHref = (slug: string) => {
    if (slug === 'freefire-topup') return '/topup/freefire';
    if (slug === 'roblox-topup' || slug === 'robux') return '/topup/roblox';
    if (slug === 'giftpass') return '/topup/gift-pass';
    return `/topup/${slug}`;
  };

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading icon={Zap} title="หมวดหมู่เติมเกม" subtitle="เลือกบริการเติมเกมที่ต้องการ ราคาดีกว่าในเกม ส่งไวภายใน 5 นาที" />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[{}, {}].map((_, i) => <div key={i} className="gaming-card h-56 animate-pulse bg-secondary/40" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(categoryHref(c.slug))}
              className="gaming-card group relative h-56 overflow-hidden text-left cursor-pointer"
              aria-label={`เปิดหมวด ${c.name}`}
            >
              {c.image && <img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070d] via-[#07070d]/60 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h3 className="font-display text-2xl font-bold group-hover:text-primary transition-colors">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full border border-primary/40 bg-primary/20 px-3 py-1 text-xs font-medium text-violet-200">
                    มี {c._count?.packages ?? 0} แพ็กเกจ
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white btn-neon">
                    ดูแพ็กเกจ <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
          {cats.length === 0 && <EmptyState title="ยังไม่มีหมวดหมู่เติมเกม" description="เพิ่มหมวดหมู่ประเภทเติมเกมได้จากหลังบ้าน" />}
        </div>
      )}

      <div className="mt-10">
        <SectionHeading icon={ShieldCheck} title="ขั้นตอนการเติมเกม" subtitle="ทำตาม 4 ขั้นตอนง่าย ๆ ใช้เวลาไม่เกิน 2 นาที" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gamepad2, title: '1. เลือกบริการ', desc: 'เลือกเกมและแพ็กเกจที่ต้องการ' },
            { icon: UserRound, title: '2. กรอกข้อมูล', desc: 'ระบุ Player ID หรือชื่อผู้ใช้ที่จะรับบริการ' },
            { icon: Coins, title: '3. ชำระเงิน', desc: 'จ่ายด้วยกระเป๋าเงินหรือโอนพร้อมแนบสลิป' },
            { icon: CheckCircle2, title: '4. รับของ', desc: 'ระบบ/แอดมินดำเนินการส่งของให้ทันที' },
          ].map((st, i) => (
            <div key={i} className="gaming-card p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary mb-3"><st.icon className="h-5.5 w-5.5" /></span>
              <div className="font-display font-semibold">{st.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================= หน้าเติมเกมเฉพาะเกม (Free Fire / Roblox) =================

export function GameTopupPage({ slug }: { slug: 'freefire-topup' | 'roblox-topup' | 'robux' }) {
  const { user, setPopup } = useApp();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [selected, setSelected] = useState<TopupPackage | null>(null);
  const [selectedRobux, setSelectedRobux] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const isFF = slug === 'freefire-topup';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await api<{ category: Category; packages: TopupPackage[] }>(`/api/data/packages?category=${slug}`, { silent: true });
        setCategory(d.category);
        setPackages(d.packages);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const selectedRobuxPackages = useMemo(() => packages.filter((p) => selectedRobux.includes(p.id)), [packages, selectedRobux]);
  const robuxTotal = selectedRobuxPackages.reduce((sum, p) => sum + p.price, 0);

  const idValid = useMemo(() => {
    if (isFF) return /^[0-9]{6,12}$/.test(playerId.trim());
    return playerId.trim().length >= 3;
  }, [playerId, isFF]);

  function openConfirm() {
    if (isFF ? !selected : selectedRobuxPackages.length === 0) {
      toast({ title: 'กรุณาเลือกแพ็กเกจก่อน', variant: 'destructive' });
      return;
    }
    if (!idValid) {
      toast({
        title: isFF ? 'Player ID ไม่ถูกต้อง' : 'กรอกชื่อผู้ใช้ให้ครบถ้วน',
        description: isFF ? 'Player ID ต้องเป็นตัวเลข 6-12 หลัก (ดูได้ในโปรไฟล์ของเกม)' : 'กรอกชื่อผู้ใช้ Roblox ที่จะรับ Robux',
        variant: 'destructive',
      });
      return;
    }
    if (!user) {
      toast({ title: 'กรุณาเข้าสู่ระบบก่อนเติมเกม', description: 'สมัครสมาชิกได้ฟรี' });
      setPopup('login');
      return;
    }
    setDialogOpen(true);
  }

  const draft: OrderDraft | null = (isFF ? !!selected : selectedRobuxPackages.length > 0)
    ? {
        type: 'TOPUP',
        items: (isFF ? [selected!] : selectedRobuxPackages).map((p) => ({ packageId: p.id, quantity: 1 })),
        title: isFF ? `เติมเพชร Free Fire — ${selected!.name}` : `เติม Roblox — ${selectedRobuxPackages.map((p) => p.name).join(' + ')}`,
        price: isFF ? selected!.price : robuxTotal,
        contact: {
          playerId: isFF ? playerId.trim() : undefined,
          robloxUsername: !isFF ? playerId.trim() : undefined,
        },
        requirePlayerId: true,
      }
    : null;

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="เส้นทาง">
        <button onClick={() => navigate('/')} className="hover:text-primary cursor-pointer">หน้าหลัก</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate('/topup')} className="hover:text-primary cursor-pointer">เติมเกม</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{isFF ? 'เติมเกม Free Fire' : 'เติมเกม Roblox'}</span>
      </nav>

      {/* Banner */}
      <div className="gaming-card relative overflow-hidden mb-8 p-6 md:p-8">
        <img src={isFF ? '/images/cover-freefire.png' : '/images/cover-roblox.png'} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d]/95 via-[#07070d]/80 to-[#07070d]/40" />
        <div className="relative">
          <h1 className="font-display text-3xl font-bold">{isFF ? 'เติมเพชร Free Fire' : 'เติม Robux Roblox'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category?.description ?? ''}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Timer className="h-4 w-4 text-primary" /> ส่งไวใน 5-15 นาที</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-400" /> ไม่ต้องให้รหัสผ่านไอดี ปลอดภัย 100%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          {/* Step 1 */}
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">1</span>
            <h2 className="font-display text-lg font-semibold">เลือกแพ็กเกจ{isFF ? 'เพชร' : ' Robux'}</h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="gaming-card h-20 animate-pulse bg-secondary/40" />)}</div>
          ) : packages.length === 0 ? (
            <EmptyState title="ยังไม่มีแพ็กเกจ" description="แพ็กเกจกำลังจะมาเร็ว ๆ นี้" />
          ) : (
            isFF ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {packages.map((p) => <PackageCard key={p.id} name={p.name} price={p.price} amount={p.amount} badge={p.badge} active={selected?.id === p.id} onSelect={() => setSelected(p)} />)}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div><div className="font-semibold">เลือก Robux ได้หลายแพ็กเกจ</div><p className="mt-1 text-xs text-muted-foreground">แตะเลือกแต่ละรายการที่ต้องการ ระบบจะรวมยอดให้อัตโนมัติ</p></div>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{selectedRobuxPackages.length} รายการ</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {packages.map((p) => {
                    const active = selectedRobux.includes(p.id);
                    return <button key={p.id} type="button" onClick={() => setSelectedRobux((current) => active ? current.filter((id) => id !== p.id) : [...current, p.id])} aria-pressed={active}
                      className={'relative flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-center transition-all ' + (active ? 'border-fuchsia-500 bg-fuchsia-500/15 shadow-[0_0_0_1px_rgba(217,70,239,.35)]' : 'border-border bg-card/80 hover:border-primary/50 hover:bg-primary/5')}>
                      {active && <span className="absolute right-2 top-2 text-[10px] font-bold text-fuchsia-300">เลือกแล้ว ✓</span>}
                      <span className="mt-2 font-display text-lg font-bold">{p.amount?.toLocaleString('th-TH') ?? p.name} <span className="text-xs font-medium text-muted-foreground">Robux</span></span>
                      <span className="text-sm font-semibold text-[#f0b429]">{formatTHB(p.price)}</span>
                    </button>;
                  })}
                </div>
                {selectedRobuxPackages.length > 0 && <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="mb-2 font-semibold text-sm">รายการที่เลือก</div>
                  <div className="space-y-2">{selectedRobuxPackages.map((p) => <div key={p.id} className="flex items-center justify-between gap-3 text-sm"><span>{p.amount?.toLocaleString('th-TH') ?? p.name} Robux</span><span className="font-semibold text-[#f0b429]">{formatTHB(p.price)}</span></div>)}</div>
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-semibold"><span>รวมทั้งหมด</span><span className="price-gold text-xl">{formatTHB(robuxTotal)}</span></div>
                  <button type="button" onClick={() => setSelectedRobux([])} className="mt-2 text-xs text-muted-foreground underline hover:text-foreground">ล้างรายการที่เลือก</button>
                </div>}
              </div>
            )
          )}

          {/* Step 2 */}
          <div className="mt-8 mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">2</span>
            <h2 className="font-display text-lg font-semibold">กรอกข้อมูลที่จะรับบริการ</h2>
          </div>
          <div className="gaming-card p-5">
            <Label htmlFor="tpid" className="text-sm font-medium">
              {isFF ? 'Player ID (ตัวเลข 6-12 หลัก)' : 'ชื่อผู้ใช้ Roblox (Username)'}
            </Label>
            <Input
              id="tpid"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder={isFF ? 'เช่น 1234567890' : 'เช่น lrapx_gamer'}
              className="mt-2 h-12 bg-secondary/60 font-mono text-lg tracking-wide"
              inputMode={isFF ? 'numeric' : 'text'}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {isFF ? (
                <>ดู Player ID ได้ที่หน้าโปรไฟล์ในเกม Free Fire ด้านบนของชื่อ หรือดูจากคู่มือ <button className="text-primary underline cursor-pointer" onClick={() => navigate('/how-to')}>วิธีใช้งาน</button></>
              ) : (
                <>เราจะส่ง Robux ให้รับเองผ่านระบบ Gamepass ในโปรไฟล์ Roblox ของคุณ — กรุณาตั้งค่า Gamepass ก่อนสั่งซื้อ ดูวิธีที่ <button className="text-primary underline cursor-pointer" onClick={() => navigate('/how-to')}>วิธีใช้งาน</button></>
              )}
            </p>
            {playerId.trim() && !idValid && (
              <p className="mt-2 text-xs text-amber-400">
                {isFF ? 'Player ID ต้องเป็นตัวเลข 6-12 หลัก' : 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'}
              </p>
            )}
          </div>
        </div>

        {/* Step 3 — สรุปคำสั่งซื้อ */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0b429] text-black font-bold text-sm">3</span>
            <h2 className="font-display text-lg font-semibold">ตรวจสอบก่อนสั่งซื้อ</h2>
          </div>
          <div className="gaming-card p-5 neon-ring">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">แพ็กเกจที่เลือก</span>
                <span className="font-medium text-right">{isFF ? (selected?.name ?? <span className="text-muted-foreground">ยังไม่ได้เลือก</span>) : (selectedRobuxPackages.length ? selectedRobuxPackages.map((p) => (p.amount ?? p.name) + ' Robux').join(', ') : <span className="text-muted-foreground">ยังไม่ได้เลือก</span>)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">{isFF ? 'Player ID' : 'ชื่อผู้ใช้ Roblox'}</span>
                <span className="font-mono font-medium">{playerId.trim() || <span className="text-muted-foreground">ยังไม่ได้กรอก</span>}</span>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-3">
                <span className="font-medium">ยอดที่ต้องชำระ</span>
                <span className="price-gold text-xl">{(isFF ? selected?.price : selectedRobuxPackages.length ? robuxTotal : 0) ? formatTHB(isFF ? selected!.price : robuxTotal) : '—'}</span>
              </div>
            </div>
            <Button
              className="mt-5 w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
              disabled={(isFF ? !selected : selectedRobuxPackages.length === 0) || !idValid}
              onClick={openConfirm}
            >
              {(isFF ? !!selected : selectedRobuxPackages.length > 0) ? 'ดำเนินการต่อ — ยืนยันการสั่งซื้อ' : 'เลือกแพ็กเกจก่อน'}
            </Button>
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <p className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" /> ระบบตรวจสอบข้อมูลอัตโนมัติก่อนสร้างคำสั่งซื้อ</p>
              <p className="flex items-start gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" /> หากกรอก Player ID ผิด แจ้งแอดมินได้ทันทีที่หน้าคำสั่งซื้อ</p>
            </div>
          </div>
        </div>
      </div>

      {draft && <PurchaseDialog open={dialogOpen} onOpenChange={setDialogOpen} draft={draft} />}
    </div>
  );
}

// ================= หน้า Gift Game Pass =================

export function GiftPassPage() {
  const { user, setPopup } = useApp();
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [packages, setPackages] = useState<TopupPackage[]>([]);
  const [selected, setSelected] = useState<TopupPackage | null>(null);
  const [receiver, setReceiver] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<{ category: Category; packages: TopupPackage[] }>('/api/data/packages?category=giftpass', { silent: true })
      .then((d) => {
        setCategory(d.category);
        setPackages(d.packages);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openConfirm() {
    if (!selected) {
      toast({ title: 'กรุณาเลือก Game Pass ก่อน', variant: 'destructive' });
      return;
    }
    if (receiver.trim().length < 3) {
      toast({ title: 'กรุณากรอกไอดีที่รับของ', description: 'เช่น ชื่อผู้ใช้ Roblox หรือ Player ID ของ Free Fire', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'กรุณาเข้าสู่ระบบก่อนสั่งซื้อ', description: 'สมัครสมาชิกได้ฟรี' });
      setPopup('login');
      return;
    }
    setDialogOpen(true);
  }

  const draft: OrderDraft | null = selected
    ? {
        type: 'GIFT_PASS',
        items: [{ packageId: selected.id, quantity: 1 }],
        title: `Gift Game Pass — ${selected.name}`,
        price: selected.price,
        contact: { playerId: receiver.trim() },
        requirePlayerId: true,
      }
    : null;

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="เส้นทาง">
        <button onClick={() => navigate('/')} className="hover:text-primary cursor-pointer">หน้าหลัก</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate('/topup')} className="hover:text-primary cursor-pointer">เติมเกม</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">Gift Game Pass</span>
      </nav>

      <div className="gaming-card relative overflow-hidden mb-8 p-6 md:p-8">
        <img src="/images/cover-giftpass.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d]/95 via-[#07070d]/80 to-[#07070d]/40" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0b429]/40 bg-[#f0b429]/10 px-3 py-1 text-xs font-medium text-[#f0b429]">
            <Gift className="h-3.5 w-3.5" /> ของขวัญสายเกมเมอร์
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold">Gift Game Pass</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category?.description ?? ''}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">1</span>
            เลือกเกม / ประเภท Game Pass และแพ็กเกจ
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="gaming-card h-20 animate-pulse bg-secondary/40" />)}</div>
          ) : packages.length === 0 ? (
            <EmptyState title="ยังไม่มีบัตรให้เลือก" description="รออัปเดตจากร้านค้า" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {packages.map((p) => (
                <PackageCard key={p.id} name={p.name} price={p.price} badge={p.badge} active={selected?.id === p.id} onSelect={() => setSelected(p)} />
              ))}
            </div>
          )}

          <h2 className="mt-8 font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">2</span>
            กรอกข้อมูลผู้รับของกิฟต์
          </h2>
          <div className="gaming-card p-5">
            <Label htmlFor="gp-recv" className="text-sm font-medium">ไอดีที่รับของกิฟต์ (ชื่อผู้ใช้ Roblox หรือ Player ID)</Label>
            <Input id="gp-recv" value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="เช่น lrapx_gamer" className="mt-2 h-12 bg-secondary/60" />
            <p className="mt-2 text-xs text-muted-foreground">โค้ด/สิทธิ์จะส่งให้ทางหน้าคำสั่งซื้อและแชทของร้าน โดยระบุไอดีผู้รับตามที่คุณกรอก</p>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0b429] text-black font-bold text-sm">3</span>
            ตรวจสอบก่อนชำระเงิน
          </h2>
          <div className="gaming-card p-5 neon-ring">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">บัตรที่เลือก</span>
                <span className="font-medium text-right">{selected ? selected.name : <span className="text-muted-foreground">ยังไม่ได้เลือก</span>}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">ผู้รับของกิฟต์</span>
                <span className="font-mono font-medium">{receiver.trim() || <span className="text-muted-foreground">ยังไม่ได้กรอก</span>}</span>
              </div>
              <div className="flex justify-between gap-2 border-t border-border pt-3">
                <span className="font-medium">ยอดที่ต้องชำระ</span>
                <span className="price-gold text-xl">{selected ? formatTHB(selected.price) : '—'}</span>
              </div>
            </div>
            <Button className="mt-5 w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={!selected || receiver.trim().length < 3} onClick={openConfirm}>
              {selected ? 'ดำเนินการต่อ — ยืนยันคำสั่งซื้อ' : 'เลือกบัตรก่อน'}
            </Button>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> โค้ดทุกใบตรวจสอบการใช้งานก่อนส่งให้ลูกค้าเสมอ
            </div>
          </div>
        </div>
      </div>

      {draft && <PurchaseDialog open={dialogOpen} onOpenChange={setDialogOpen} draft={draft} />}
    </div>
  );
}

