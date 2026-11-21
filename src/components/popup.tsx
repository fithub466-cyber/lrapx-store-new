/**
 * PopupOverlay — หน้าต่างย่อยที่เปิดทับหน้าหลัก (ไม่เปลี่ยนหน้า)
 * ใช้กับ: เข้าสู่ระบบ / สมัครสมาชิก / ลืมรหัสผ่าน / โปรไฟล์ / กระเป๋าเงิน / เติมเงิน / ประวัติคำสั่งซื้อ
 * เปิดจากเมนูสามขีดหรือปุ่มต่าง ๆ ปิดด้วยปุ่ม X, แตะฉากหลัง หรือปุ่ม Esc
 */
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp, type PopupKind } from '@/lib/store';
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@/components/auth-view';
import { ProfilePage, WalletPage, DepositPage, OrdersPage } from '@/components/account';

const POPUP_TITLE: Record<PopupKind, string> = {
  login: 'เข้าสู่ระบบ',
  register: 'สมัครสมาชิก',
  forgot: 'ลืมรหัสผ่าน',
  profile: 'โปรไฟล์ของฉัน',
  wallet: 'กระเป๋าเงินของฉัน',
  deposit: 'เติมเงินเข้ากระเป๋า',
  orders: 'ประวัติการสั่งซื้อ',
};

export function PopupOverlay() {
  const popup = useApp((s) => s.popup);
  const setPopup = useApp((s) => s.setPopup);

  useEffect(() => {
    if (!popup) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPopup(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [popup, setPopup]);

  if (!popup) return null;

  function content() {
    switch (popup) {
      case 'login': return <LoginPage />;
      case 'register': return <RegisterPage />;
      case 'forgot': return <ForgotPasswordPage />;
      case 'profile': return <ProfilePage />;
      case 'wallet': return <WalletPage />;
      case 'deposit': return <DepositPage />;
      case 'orders': return <OrdersPage />;
      default: return null;
    }
  }

  return (
    <div className="fixed inset-0 z-[45]" role="dialog" aria-modal="true" aria-label={POPUP_TITLE[popup]}>
      {/* ฉากหลัง — แตะเพื่อปิด */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={() => setPopup(null)}
        aria-hidden="true"
      />
      {/* กรอบหน้าต่างย่อย */}
      <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-center sm:items-center sm:p-6">
        <div className="animate-in slide-in-from-bottom-4 fade-in-0 duration-300 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-primary/25 bg-background shadow-[0_-8px_60px_rgba(168,85,247,0.25)] sm:rounded-2xl sm:shadow-[0_10px_60px_rgba(168,85,247,0.3)]">
          {/* แถบหัวข้อ + ปุ่มปิด */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-secondary/40 px-5 py-3.5">
            <span className="h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />
            <h2 className="font-display font-semibold text-[15px]">{POPUP_TITLE[popup]}</h2>
            <button
              onClick={() => setPopup(null)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors cursor-pointer"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* เนื้อหา — เลื่อนได้ในหน้าต่าง */}
          <div className="flex-1 overflow-y-auto px-5 py-5">{content()}</div>
        </div>
      </div>
    </div>
  );
}
