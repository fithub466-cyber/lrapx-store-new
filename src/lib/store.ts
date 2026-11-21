/** Zustand store: สถานะผู้ใช้ + UI (sidebar / popup) ของ LrapX Store */
import { create } from 'zustand';

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar?: string | null;
  walletBalance: number;
};

/** หน้าต่างย่อย (popup) ที่เปิดทับหน้าหลัก — สมัคร/เข้าสู่ระบบ/โปรไฟล์ ฯลฯ */
export type PopupKind = 'login' | 'register' | 'forgot' | 'profile' | 'wallet' | 'deposit' | 'orders';

type AppState = {
  user: CurrentUser | null;
  authLoading: boolean;
  sidebarOpen: boolean;
  popup: PopupKind | null;
  setUser: (u: CurrentUser | null) => void;
  setAuthLoading: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  setPopup: (p: PopupKind | null) => void;
  refresh: () => Promise<void>;
};

export const useApp = create<AppState>((set) => ({
  user: null,
  authLoading: true,
  sidebarOpen: false,
  popup: null,
  setUser: (u) => set({ user: u }),
  setAuthLoading: (v) => set({ authLoading: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setPopup: (p) => set({ popup: p }),
  refresh: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, authLoading: false });
      } else {
        set({ user: null, authLoading: false });
      }
    } catch {
      set({ user: null, authLoading: false });
    }
  },
}));
