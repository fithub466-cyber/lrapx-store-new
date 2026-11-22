/**
 * LrapX Store — SPA Shell (ทุกหน้าทำงานภายใต้ route / ด้วย hash router)
 * /#/ => หน้าแรก, /#/game-ids, /#/topup, /#/profile ... เป็นต้น
 */
'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useHashRoute, navigate } from '@/lib/router';
import { useApp } from '@/lib/store';
import { api } from '@/lib/client';
import { Header, Footer } from '@/components/shell';
import { PopupOverlay } from '@/components/popup';
import { HomePage } from '@/components/home';
import { GameIdsPage, ProductListPage, ProductDetailPage } from '@/components/shop';
import { TopupHubPage, GameTopupPage, GiftPassPage } from '@/components/topup';
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/components/auth-view';
import { ProfilePage, WalletPage, DepositPage, OrdersPage } from '@/components/account';
import { AdminPage } from '@/components/admin';
import { HowToPage, ContactPage, SearchPage } from '@/components/misc';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

function NotFound() {
  return (
    <div className="page-enter mx-auto max-w-md px-4 py-24 text-center">
      <Gamepad2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
      <h1 className="mt-4 font-display text-2xl font-bold">ไม่พบหน้าที่คุณกำลังหา</h1>
      <p className="mt-1 text-sm text-muted-foreground">ลิงก์อาจผิดพลาดหรือหน้าถูกย้ายไปแล้ว</p>
      <Button className="mt-6 btn-neon bg-gradient-to-r from-[#8f603d] to-[#c89565] text-white" onClick={() => navigate('/')}>กลับหน้าหลัก</Button>
    </div>
  );
}

function Router({ path }: { path: string }) {
  const [pathname, queryString] = path.split('?');
  const query = new URLSearchParams(queryString ?? '');
  const segments = pathname.split('/').filter(Boolean);

  // หน้าแรก
  if (segments.length === 0) return <HomePage />;

  switch (segments[0]) {
    case 'game-ids': {
      if (segments.length === 1) return <GameIdsPage />;
      // รองรับหมวดไอดีที่เพิ่มจากหลังบ้าน โดยใช้ slug ของหมวดโดยตรง
      const categorySlug = segments[1] === 'freefire' ? 'freefire-id' : segments[1] === 'roblox' ? 'roblox-id' : segments[1];
      return <ProductListPage slug={categorySlug} />;
    }
    case 'product':
      return segments[1] ? <ProductDetailPage id={segments[1]} /> : <NotFound />;
    case 'topup': {
      if (segments.length === 1) return <TopupHubPage />;
      if (segments[1] === 'gift-pass') return <GiftPassPage />;
      if (segments[1] === 'freefire') return <GameTopupPage slug="freefire-topup" />;
      if (segments[1] === 'roblox') return <GameTopupPage slug="robux" />;
      if (segments[1] === 'freefire-topup' || segments[1] === 'roblox-topup' || segments[1] === 'robux') return <GameTopupPage slug={segments[1]} />;
      return <NotFound />;
    }
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'forgot':
      return <ForgotPasswordPage />;
    case 'profile':
      return <ProfilePage />;
    case 'wallet':
      return <WalletPage />;
    case 'deposit':
      return <DepositPage />;
    case 'orders':
      return <OrdersPage />;
    case 'admin':
      return <AdminPage />;
    case 'how-to':
      return <HowToPage />;
    case 'contact':
      return <ContactPage />;
    case 'search':
      return <SearchPage initialQuery={query.get('q') ?? ''} />;
    default:
      return <NotFound />;
  }
}

export default function App() {
  const path = useHashRoute();
  const { refresh, setSidebarOpen } = useApp();
  const [loaderSettings, setLoaderSettings] = useState<Record<string, string>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [loaderLogoVersion, setLoaderLogoVersion] = useState(0);
  const [minimumLoaderElapsed, setMinimumLoaderElapsed] = useState(false);

  // แสดงหน้าโหลดอย่างน้อย 1.2 วินาที เพื่อให้ภาพที่ตั้งค่าไว้แสดงผลจริง ไม่หายไปทันทีหลัง API ตอบกลับ
  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumLoaderElapsed(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true })
      .then((d) => {
        setLoaderSettings(d.settings);
        // เปลี่ยน query ทุกครั้งที่โหลดหน้า เพื่อไม่ให้ CDN/เบราว์เซอร์แสดงไฟล์โลโก้เก่าที่ URL เดิม
        setLoaderLogoVersion(Date.now());
      })
      .catch(() => {})
      .finally(() => setSettingsLoaded(true));
  }, []);
  // true เฉพาะหลัง hydration บน client — ใช้กัน SSR/client render ไม่ตรงกัน
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    refresh();
  }, [refresh, path]); // รีเฟรชทุกครั้งที่เปลี่ยนหน้า — ยอดกระเป๋า/สถานะที่เพิ่งอนุมัติหลังบ้านจะอัปเดตทันที

  // ปิด sidebar เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setSidebarOpen(false);
  }, [path, setSidebarOpen]);

  // ป้องกัน hydration mismatch: SSR เรนเดอร์ skeleton เดียวกับ client เฟรมแรก
  const loaderLogo = loaderSettings.loader_logo || loaderSettings.store_logo || "/images/logo.png";
  const withLoaderCacheBuster = (src: string) => {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const hashIndex = src.indexOf('#');
    const base = hashIndex >= 0 ? src.slice(0, hashIndex) : src;
    const hash = hashIndex >= 0 ? src.slice(hashIndex) : '';
    return `${base}${base.includes('?') ? '&' : '?'}v=${loaderLogoVersion}${hash}`;
  };
  const loaderLogoSrc = withLoaderCacheBuster(loaderLogo);
  const loaderBackground = loaderSettings.loader_background_image
    ? withLoaderCacheBuster(loaderSettings.loader_background_image)
    : '';
  if (!mounted || !settingsLoaded || !minimumLoaderElapsed) {
    return (
      <div className="flex min-h-screen flex-col bg-background" style={loaderBackground ? { backgroundImage: `linear-gradient(rgba(0,0,0,.58), rgba(0,0,0,.78)), url("${loaderBackground}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
        <div className="h-[104px] w-full border-b border-border bg-[#000000]" />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {settingsLoaded && <img src={loaderLogoSrc} alt="โลโก้ร้าน" className="h-20 w-20 object-contain animate-floaty" />}
            <div className="text-center text-sm font-semibold text-[#d9b18d]">{loaderSettings.loading_title || loaderSettings.store_name || "LrapX Store"}</div>
            {loaderSettings.loading_subtitle && <div className="text-xs text-muted-foreground">{loaderSettings.loading_subtitle}</div>}
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-[#8f603d] to-[#c89565]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header currentPath={path.split('?')[0]} />
      <main className="flex-1">
        <Router path={path} />
      </main>
      <Footer />
      {/* หน้าต่างย่อย (popup): สมัคร/เข้าสู่ระบบ/โปรไฟล์/กระเป๋าเงิน/เติมเงิน/ประวัติ */}
      <PopupOverlay />
    </div>
  );
}
