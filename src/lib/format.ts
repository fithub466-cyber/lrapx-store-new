/** ฟังก์ชันจัดรูปแบบที่ใช้ร่วมกัน (Client-safe) */

export function formatTHB(n: number): string {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('th-TH').format(n);
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: 'รอชำระเงิน', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  REVIEWING: { label: 'กำลังตรวจสอบ', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  PROCESSING: { label: 'กำลังดำเนินการ', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  COMPLETED: { label: 'สำเร็จ', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
  REFUNDED: { label: 'คืนเงินแล้ว', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const DEPOSIT_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'รอตรวจสอบ', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  SUCCESS: { label: 'สำเร็จ', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  REJECTED: { label: 'ไม่สำเร็จ', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

export const ORDER_TYPE: Record<string, string> = {
  GAME_ID: 'สินค้าไอดีเกม',
  TOPUP: 'เติมเกม',
  GIFT_PASS: 'Gift Game Pass',
};

export const PAYMENT_METHOD: Record<string, string> = {
  WALLET: 'กระเป๋าเงิน LrapX',
  BANK_TRANSFER: 'โอนธนาคาร / TrueMoney',
};
