/** โครงหน้าเว็บ: Header + Sidebar สามขีด + Footer */
'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { navigate } from '@/lib/router';
import { api } from '@/lib/client';
import { formatTHB } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  Menu, X, Search, Wallet, LogIn, UserPlus, User, LogOut, Home, Gamepad2,
  Zap, CircleDollarSign, ReceiptText, HelpCircle, MessageCircle, ShieldCheck,
  Facebook, Phone, Mail, Clock, ChevronRight, Megaphone,
} from 'lucide-react';

export type MenuLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const MAIN_MENU: MenuLink[] = [
  { href: '/', label: 'หน้าหลัก', icon: Home },
  { href: '/game-ids', label: 'หมวดหมู่ไอดีเกม', icon: Gamepad2 },
  { href: '/topup', label: 'หมวดหมู่เติมเกม', icon: Zap },
  { href: '/deposit', label: 'เติมเงินเข้ากระเป๋า', icon: CircleDollarSign },
  { href: '/orders', label: 'ประวัติการสั่งซื้อ', icon: ReceiptText },
  { href: '/how-to', label: 'วิธีใช้งาน', icon: HelpCircle },
  { href: '/contact', label: 'ติดต่อร้านค้า', icon: MessageCircle },
];

export function Header({ currentPath }: { currentPath: string }) {
  const { user, sidebarOpen, setSidebarOpen, refresh, setPopup } = useApp();
  const [q, setQ] = useState('');

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        {/* แถบประกาศ */}
        <AnnouncementBar />
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-3 md:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
            aria-label="เปิดเมนู"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button onClick={() => navigate('/')} className="flex shrink-0 items-center gap-2 cursor-pointer" aria-label="ไปหน้าหลัก">
            {/* โลโก้พื้นหลังโปร่งใส ไม่มีกรอบ */}
            <img src="/images/logo.png" alt="โลโก้ LrapX Store" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(240,180,41,0.45)]" />
            <span className="text-left leading-tight">
              <span className="font-display text-base sm:text-lg font-bold tracking-wide text-glow-gold text-[#f0b429]">LRAPX</span>
              <span className="font-display text-base sm:text-lg font-bold"> STORE</span>
              <span className="hidden sm:block text-[10px] text-muted-foreground tracking-widest uppercase">Game ID &amp; Top-Up Center</span>
            </span>
          </button>

          <form onSubmit={submitSearch} className="relative ml-2 hidden flex-1 md:block max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ค้นหาไอดีเกม, แพ็กเกจเติมเกม, รหัสสินค้า..."
              className="pl-10 h-10 bg-secondary/60 border-border focus-visible:ring-primary/60"
              aria-label="ค้นหาสินค้า"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate('/search')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border hover:border-primary hover:text-primary transition-colors md:hidden"
              aria-label="ค้นหา"
            >
              <Search className="h-5 w-5" />
            </button>

            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex h-10 border-[#f0b429]/40 text-[#f0b429] hover:bg-[#f0b429]/10 hover:text-[#f0b429]"
              onClick={() => (user ? setPopup('wallet') : setPopup('login'))}
            >
              <Wallet className="mr-1.5 h-4 w-4" />
              {user ? formatTHB(user.walletBalance) : 'กระเป๋าเงิน'}
            </Button>

            {user ? (
              <UserMenu />
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button size="sm" variant="ghost" className="h-10" onClick={() => setPopup('login')}>
                  <LogIn className="mr-1 h-4 w-4" /> เข้าสู่ระบบ
                </Button>
                <Button size="sm" className="h-10 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:from-violet-500 hover:to-fuchsia-400" onClick={() => setPopup('register')}>
                  <UserPlus className="mr-1 h-4 w-4" /> สมัครสมาชิก
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <SidebarDrawer currentPath={currentPath} />
    </>
  );
}

function AnnouncementBar() {
  const [text, setText] = useState('');
  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true })
      .then((d) => setText(d.settings.announcement ?? ''))
      .catch(() => {});
  }, []);
  if (!text) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-violet-700/30 via-fuchsia-600/25 to-violet-700/30 px-4 py-1.5 text-xs text-violet-200 border-b border-violet-500/20">
      <Megaphone className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function UserMenu() {
  const { user, refresh, setPopup } = useApp();
  if (!user) return null;
  const isAdmin = user.role === 'ADMIN';

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST', silent: true });
      await refresh();
      setPopup(null);
      toast({ title: 'ออกจากระบบสำเร็จ', description: 'แล้วพบกันใหม่ครับ' });
      navigate('/');
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setPopup('profile')}
        className="flex h-10 items-center gap-2 rounded-lg border border-border bg-secondary/50 px-2.5 hover:border-primary transition-colors cursor-pointer"
        aria-label="เมนูโปรไฟล์"
      >
        {user.avatar ? (
          <img src={user.avatar} alt={`รูปโปรไฟล์ของ ${user.username}`} className="h-7 w-7 rounded-full object-cover border border-primary/40" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white text-sm font-bold">
            {user.username.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden lg:block text-sm font-medium max-w-28 truncate">{user.username}</span>
        {isAdmin && <ShieldCheck className="h-4 w-4 text-[#f0b429]" />}
      </button>
      <button
        onClick={logout}
        className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
        aria-label="ออกจากระบบ"
        title="ออกจากระบบ"
      >
        <LogOut className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}

function SidebarDrawer({ currentPath }: { currentPath: string }) {
  const { user, sidebarOpen, setSidebarOpen, refresh, setPopup } = useApp();
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true })
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  async function logout() {
    try {
      await api('/api/auth/logout', { method: 'POST', silent: true });
      await refresh();
      toast({ title: 'ออกจากระบบสำเร็จ' });
      setSidebarOpen(false);
      setPopup(null);
      navigate('/');
    } catch {
      toast({ title: 'เกิดข้อผิดพลาด', variant: 'destructive' });
    }
  }

  const isActive = (href: string) =>
    href === '/' ? currentPath === '/' : currentPath.startsWith(href);

  /** เปิดหน้าต่างย่อย (popup) แทนการเปลี่ยนหน้า — ใช้กับโปรไฟล์/กระเป๋าเงิน/เติมเงิน/ประวัติ */
  function openPopup(kind: 'profile' | 'wallet' | 'deposit' | 'orders' | 'login' | 'register') {
    setSidebarOpen(false);
    setPopup(kind);
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col border-r border-border bg-sidebar shadow-2xl transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="เมนูหลัก"
        aria-hidden={!sidebarOpen}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/images/logo.png" alt="โลโก้ LrapX Store" className="h-10 w-10 object-contain" />
            <div className="leading-tight">
              <div className="font-display font-bold text-[#f0b429]">LRAPX STORE</div>
              <div className="text-[10px] text-muted-foreground">Game ID &amp; Top-Up Center</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground"
            aria-label="ปิดเมนู"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {MAIN_MENU.map((m) => {
            const isPopupItem = m.href === '/deposit' || m.href === '/orders';
            return (
              <button
                key={m.href}
                onClick={() => {
                  if (isPopupItem) openPopup(m.href === '/deposit' ? 'deposit' : 'orders');
                  else {
                    navigate(m.href);
                    setSidebarOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                  !isPopupItem && isActive(m.href)
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-foreground/85 hover:bg-secondary hover:text-foreground border border-transparent'
                }`}
              >
                <m.icon className="h-4.5 w-4.5 shrink-0" />
                {m.label}
                {isPopupItem && <span className="ml-1 rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">หน้าต่างย่อย</span>}
                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
              </button>
            );
          })}

          <div className="my-3 border-t border-border" />

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    navigate('/admin');
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    isActive('/admin') ? 'bg-[#f0b429]/15 text-[#f0b429] border border-[#f0b429]/40' : 'text-[#f0b429] hover:bg-[#f0b429]/10 border border-transparent'
                  }`}
                >
                  <ShieldCheck className="h-4.5 w-4.5" />
                  หลังบ้าน (Admin)
                  <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
                </button>
              )}
              <button
                onClick={() => openPopup('profile')}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/85 hover:bg-secondary transition-colors cursor-pointer"
              >
                <User className="h-4.5 w-4.5" />
                โปรไฟล์ของฉัน
                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
              </button>
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                ออกจากบัญชี
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => openPopup('register')}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/85 hover:bg-secondary transition-colors cursor-pointer"
              >
                <UserPlus className="h-4.5 w-4.5" />
                สมัครสมาชิก
                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
              </button>
              <button
                onClick={() => openPopup('login')}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground/85 hover:bg-secondary transition-colors cursor-pointer"
              >
                <LogIn className="h-4.5 w-4.5" />
                เข้าสู่ระบบ
                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
              </button>
            </>
          )}

          <div className="my-3 border-t border-border" />
          <div className="rounded-xl bg-secondary/50 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {settings.contact_hours || 'ทุกวัน 09:00 - 24:00 น.'}</div>
            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {settings.contact_phone || '-'}</div>
            <div className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" /> LINE: {settings.contact_line || '-'}</div>
          </div>
        </nav>

        {/* กล่องโปรไฟล์ด้านล่างซ้ายของ Sidebar */}
        <div className="border-t border-border p-3">
          {user ? (
            <div className="rounded-xl bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10 border border-primary/30 p-3.5">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={`รูปโปรไฟล์ของ ${user.username}`} className="h-11 w-11 rounded-full object-cover border-2 border-primary/50 shadow-lg" />
                ) : (
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white text-lg font-bold shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate font-display font-semibold">{user.username}</div>
                  <div className="text-xs text-[#f0b429] font-medium">{formatTHB(user.walletBalance)}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 w-full h-9 border-primary/40 text-primary hover:bg-primary/10" onClick={() => openPopup('profile')}>
                <User className="mr-1 h-4 w-4" /> ดูโปรไฟล์
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-secondary/50 p-3.5 text-center">
              <p className="text-xs text-muted-foreground mb-2.5">สมัครสมาชิกเพื่อรับสิทธิพิเศษและบันทึกประวัติการซื้อ</p>
              <Button size="sm" className="w-full h-9 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" onClick={() => openPopup('register')}>
                สมัครสมาชิกฟรี
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true })
      .then((d) => setSettings(d.settings))
      .catch(() => {});
  }, []);

  return (
    <footer className="mt-auto border-t border-border bg-[#0a0a12]">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/images/logo.png" alt="โลโก้ LrapX Store" className="h-12 w-12 object-contain" />
              <div>
                <div className="font-display font-bold text-lg text-glow-gold text-[#f0b429]">LRAPX STORE</div>
                <div className="text-xs text-muted-foreground">{settings.store_tagline || 'ร้านขายไอดีเกมและเติมเกมออนไลน์'}</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              เราคัดสรรไอดีเกมคุณภาพและให้บริการเติมเกมราคาดี ส่งไวภายในไม่กี่นาที พร้อมทีมแอดมินดูแลตลอดเวลาทำการ ประกันทุกไอดี 7 วันเต็ม
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">เมนูลัด</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/game-ids', label: 'หมวดหมู่ไอดีเกม' },
                { href: '/topup', label: 'เติมเกมออนไลน์' },
                { href: '/deposit', label: 'เติมเงินเข้ากระเป๋า' },
                { href: '/orders', label: 'ประวัติการสั่งซื้อ' },
                { href: '/how-to', label: 'วิธีใช้งาน' },
              ].map((l) => (
                <li key={l.href}>
                  <button onClick={() => navigate(l.href)} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">หมวดหมู่ยอดนิยม</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { href: '/game-ids/freefire', label: 'ไอดี Free Fire' },
                { href: '/game-ids/roblox', label: 'ไอดี Roblox' },
                { href: '/topup/freefire', label: 'เติมเพชร Free Fire' },
                { href: '/topup/roblox', label: 'เติม Robux' },
                { href: '/topup/gift-pass', label: 'Gift Game Pass' },
              ].map((l) => (
                <li key={l.href}>
                  <button onClick={() => navigate(l.href)} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold mb-4">ช่องทางติดต่อ</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary shrink-0" /> LINE: {settings.contact_line || '-'}</li>
              <li className="flex items-center gap-2"><Facebook className="h-4 w-4 text-primary shrink-0" /> {settings.contact_facebook || '-'}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary shrink-0" /> {settings.contact_phone || '-'}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary shrink-0" /> {settings.contact_email || '-'}</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary shrink-0" /> {settings.contact_hours || '-'}</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} LrapX Store — สงวนลิขสิทธิ์ทุกประการ</p>
          <p>ชำระเงินผ่านกระเป๋าเงิน LrapX, ธนาคาร และ TrueMoney Wallet อย่างปลอดภัย</p>
        </div>
      </div>
    </footer>
  );
}
