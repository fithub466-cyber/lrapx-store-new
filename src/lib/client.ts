/** Client API helper + Type ที่ใช้ร่วมกันฝั่ง UI */
import { toast } from '@/hooks/use-toast';

export type Product = {
  id: string;
  code: string;
  title: string;
  description: string;
  categoryId: string;
  price: number;
  stock: number;
  images: string[];
  details: { label: string; value: string }[];
  status: 'AVAILABLE' | 'SOLD' | 'HIDDEN';
  featured: boolean;
  soldCount: number;
  createdAt: string;
  category?: { slug: string; name: string; game: string | null };
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  type: 'GAME_ID' | 'TOPUP';
  game: string | null;
  image: string | null;
  description: string | null;
  sortOrder?: number;
  active?: boolean;
  _count?: { products: number; packages: number };
};

export type TopupPackage = {
  id: string;
  categoryId: string;
  name: string;
  amount: number | null;
  bonusLabel?: string | null;
  price: number;
  badge?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export type OrderItem = {
  id: string;
  productId?: string | null;
  name: string;
  price: number;
  quantity: number;
  meta?: string | null;
  deliveryInfo?: string | null;
  product?: { code: string } | null;
};

export type Order = {
  id: string;
  orderNo: string;
  type: 'GAME_ID' | 'TOPUP' | 'GIFT_PASS';
  total: number;
  paymentMethod: 'WALLET' | 'BANK_TRANSFER';
  status: string;
  contactInfo?: string | null;
  adminNote?: string | null;
  slipImage?: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: { username: string; email: string };
};

export type WalletTx = {
  id: string;
  refCode: string;
  type: string;
  direction: 'IN' | 'OUT';
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};

export type Deposit = {
  id: string;
  refNo: string;
  method: 'TRUEMONEY_ANGPAO' | 'BANK_TRANSFER';
  amount: number;
  angpaoLink?: string | null;
  slipImage?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'REJECTED';
  adminNote?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
  user?: { username: string; email: string };
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  gameTag?: string | null;
  createdAt: string;
};

export type AdminUserRow = {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED';
  createdAt: string;
  walletBalance: number;
  orderCount: number;
};

export type Settings = Record<string, string>;

export async function api<T>(path: string, options?: RequestInit & { silent?: boolean }): Promise<T> {
  const { silent, ...rest } = options ?? {};
  const res = await fetch(path, {
    ...rest,
    cache: 'no-store', // บังคับข้อมูลสดทุกครั้ง — สิ่งที่บันทึกจากหลังบ้านต้องขึ้นบนเว็บหลักทันที
    headers: { 'Content-Type': 'application/json', ...(rest.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { error?: string }).error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
    if (!silent) toast({ title: 'ไม่สำเร็จ', description: message, variant: 'destructive' });
    throw new Error(message);
  }
  return data as T;
}
