/** Component ที่ใช้ร่วมกันทั่วเว็บไซต์ */
'use client';

import { useId, useRef, useState } from 'react';
import { navigate } from '@/lib/router';
import { formatTHB, ORDER_STATUS, DEPOSIT_STATUS } from '@/lib/format';
import { type Product } from '@/lib/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Eye, ShoppingBag, PackageSearch, ImageOff, ImagePlus, Loader2, X, Link2 } from 'lucide-react';

export function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary glow-purple">
            <Icon className="h-5.5 w-5.5" />
          </span>
        )}
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = ORDER_STATUS[status] ?? { label: status, color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

export function DepositBadge({ status }: { status: string }) {
  const cfg = DEPOSIT_STATUS[status] ?? { label: status, color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30' };
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
}

export function ProductStatusBadge({ status }: { status: string }) {
  if (status === 'AVAILABLE')
    return <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/15">พร้อมขาย</Badge>;
  if (status === 'SOLD')
    return <Badge variant="outline" className="bg-rose-500/10 text-rose-300 border-rose-500/40 hover:bg-rose-500/10">หมดสต็อก</Badge>;
  return <Badge variant="outline" className="text-zinc-400 border-zinc-600">ซ่อนอยู่</Badge>;
}

export function RatingStars({ rating, className = 'h-4 w-4' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`คะแนน ${rating} จาก 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= rating ? 'fill-[#f0b429] text-[#f0b429]' : 'text-zinc-600'}`} />
      ))}
    </span>
  );
}

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const img = product.images?.[0] ?? '/images/hero-banner.png';
  const sold = product.status === 'SOLD' || product.stock <= 0;
  return (
    <div className="gaming-card group overflow-hidden flex flex-col h-full">
      <button
        onClick={() => navigate(`/product/${product.id}`)}
        className="relative block w-full overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-[var(--radius-lg)]"
        aria-label={`ดูรายละเอียด ${product.title}`}
      >
        <div className={`relative ${compact ? 'aspect-[4/3]' : 'aspect-[4/3]'} w-full bg-[#0c0c14]`}>
          {sold && <div className="absolute inset-0 z-10 bg-black/55 backdrop-grayscale" />}
          <img
            src={img}
            alt={product.title}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${sold ? 'grayscale' : ''}`}
            loading="lazy"
          />
          <div className="absolute top-2.5 left-2.5 z-10">
            <ProductStatusBadge status={product.status} />
          </div>
          <span className="absolute top-2.5 right-2.5 z-10 rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-gold border border-[#f0b429]/30">
            {product.code}
          </span>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-4 gap-2.5">
        <button
          onClick={() => navigate(`/product/${product.id}`)}
          className="text-left font-display font-semibold leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
        >
          {product.title}
        </button>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="price-gold text-lg">{formatTHB(product.price)}</span>
          <span className="text-xs text-muted-foreground">ขายแล้ว {product.soldCount} ชิ้น</span>
        </div>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1 border-border hover:border-primary hover:text-primary" onClick={() => navigate(`/product/${product.id}`)}>
            <Eye className="mr-1 h-4 w-4" /> รายละเอียด
          </Button>
          <Button size="sm" className="flex-1 btn-neon" disabled={sold} onClick={() => navigate(`/product/${product.id}`)}>
            <ShoppingBag className="mr-1 h-4 w-4" /> {sold ? 'ขายแล้ว' : 'ซื้อสินค้า'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PackageCard({
  name,
  price,
  amount,
  badge,
  active,
  onSelect,
}: {
  name: string;
  price: number;
  amount?: number | null;
  badge?: string | null;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`gaming-card relative p-4 text-left w-full cursor-pointer ${active ? 'neon-ring scale-[1.02]' : ''}`}
      aria-pressed={active}
    >
      {badge && (
        <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-lg">
          {badge}
        </span>
      )}
      <div className="flex items-center gap-2">
        {amount != null && amount > 0 && (
          <img src="/images/prod-rb-2.png" alt="" className="h-9 w-9 rounded-lg object-cover" aria-hidden="true" />
        )}
        <div>
          <div className="font-display font-semibold text-sm leading-tight">{name}</div>
          <div className="price-gold text-base mt-0.5">{formatTHB(price)}</div>
        </div>
      </div>
    </button>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-14 px-6 text-center">
      <PackageSearch className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="font-display font-semibold text-lg">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
  );
}

export function ProductSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="gaming-card overflow-hidden">
          <Skeleton className="aspect-[4/3] w-full rounded-none bg-muted" />
          <div className="p-4 space-y-2.5">
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-4 w-1/2 bg-muted" />
            <Skeleton className="h-8 w-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SafeImage({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className ?? ''}`}>
        <ImageOff className="h-6 w-6 text-muted-foreground/40" />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

// ================= โลโก้ช่องทางชำระเงิน (วาดเองแบบ SVG — ไม่พึ่งไฟล์ภายนอก) =================

/** โลโก้ TrueMoney Wallet (ซองอังเปา) — กระเป๋าสตางค์ขาวบนพื้นส้ม */
export function TrumoneyLogo({ className = 'h-9 w-9' }: { className?: string }) {
  const gid = `tm-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="โลโก้ TrueMoney Wallet" className={`${className} shrink-0 rounded-xl shadow-[0_2px_10px_rgba(255,92,0,0.35)]`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff8a1e" />
          <stop offset="100%" stopColor="#f04d00" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gid})`} />
      {/* ตัวเครื่องกระเป๋าสตางค์ */}
      <path d="M9 14.5C9 12.6 10.6 11 12.5 11h15c1.9 0 3.5 1.6 3.5 3.5v11c0 1.9-1.6 3.5-3.5 3.5h-15C10.6 29 9 27.4 9 25.5v-11Z" fill="#fff" />
      {/* ช่องเหรียญด้านบน (ฝาเปิด) */}
      <path d="M12.5 11 26 7.5c1.1-.3 2.2.4 2.5 1.5l.5 2H12.5Z" fill="#fff" opacity="0.85" />
      {/* ช่องการ์ด + จุดเหรียญ */}
      <rect x="22" y="17.5" width="9" height="6.5" rx="2" fill="#f04d00" />
      <circle cx="25.5" cy="20.7" r="1.4" fill="#fff" />
    </svg>
  );
}

/** โลโก้ธนาคารกสิกรไทย (KBank) — ตัว K ขาวบนพื้นเขียว */
export function KbankLogo({ className = 'h-9 w-9' }: { className?: string }) {
  const gid = `kb-${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label="โลโก้ธนาคารกสิกรไทย" className={`${className} shrink-0 rounded-xl shadow-[0_2px_10px_rgba(74,163,28,0.35)]`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67b32b" />
          <stop offset="100%" stopColor="#3e8a0c" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="10" fill={`url(#${gid})`} />
      {/* ตัว K แบบหนา — วาดด้วย path เพื่อให้คมชัดทุกขนาด */}
      <path
        d="M12 10h4.6v8.1l7-8.1h5.6l-7.9 9 8.2 11h-5.6l-6.1-8.6-1.2 1.4V30H12V10Z"
        fill="#fff"
      />
    </svg>
  );
}

/** โลโก้ + ชื่อช่องทางเติมเงิน ใช้ในตาราง/รายการ */
export function DepositChannelChip({ method, bankName }: { method: string; bankName?: string }) {
  const isTM = method === 'TRUEMONEY_ANGPAO';
  return (
    <span className="inline-flex items-center gap-2">
      {isTM ? <TrumoneyLogo className="h-7 w-7" /> : <KbankLogo className="h-7 w-7" />}
      <span className="leading-tight">
        <span className="block text-sm font-medium">{isTM ? 'ซองอังเปา' : 'โอนธนาคาร'}</span>
        <span className="block text-[10px] text-muted-foreground">{isTM ? 'TrueMoney Wallet' : bankName || 'ธนาคารกสิกรไทย (KBank)'}</span>
      </span>
    </span>
  );
}

// ================= อัปโหลดรูปภาพ (หลังบ้าน) =================

const ACCEPT = 'image/png,image/jpeg,image/webp';
const MAX_MB = 4;

/** ยิงไฟล์ไป /api/upload แล้วคืน URL ของรูป */
export async function uploadImageFile(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('รองรับเฉพาะ PNG, JPG หรือ WEBP');
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`ไฟล์ใหญ่เกิน ${MAX_MB}MB กรุณาย่อรูปก่อนอัปโหลด`);
  }
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
  return data.url as string;
}

/** ช่องอัปโหลดรูปเดียว (เช่น ภาพปกหมวด, QR PromptPay) — ลากรูปมาวางหรือกดเลือกไฟล์ได้ */
export function SingleImageUpload({
  value,
  onChange,
  label = 'อัปโหลดรูป',
  aspect = 'aspect-video',
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImageFile(file));
    } catch (e) {
      import('@/hooks/use-toast').then(({ toast }) =>
        toast({ title: (e as Error).message || 'อัปโหลดไม่สำเร็จ', variant: 'destructive' }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-dashed border-border bg-secondary/40 ${aspect} cursor-pointer hover:border-primary/60 transition-colors`}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label={label}
      >
        {busy ? (
          <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : value ? (
          <>
            <img src={value} alt={label} className="h-full w-full object-cover" />
            <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-white">กดเพื่อเปลี่ยนรูป</span>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs">{label} (PNG/JPG/WEBP ≤ {MAX_MB}MB)</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
      <div className="flex items-center gap-2">
        <InputUrlAdd onAdd={onChange} compact />
        {value && (
          <Button type="button" variant="outline" size="sm" className="h-9 border-destructive/40 text-rose-300 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => onChange('')}>
            <X className="mr-1 h-3.5 w-3.5" /> ลบรูป
          </Button>
        )}
      </div>
    </div>
  );
}

/** จัดการรูปสินค้าหลายรูป — อัปโหลดจากเครื่อง / เพิ่มด้วยลิงก์ / ลบทีละรูป */
export function MultiImageUpload({ images, onChange, max = 8 }: { images: string[]; onChange: (urls: string[]) => void; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const room = max - images.length;
      const list = Array.from(files).slice(0, Math.max(room, 0));
      const urls: string[] = [];
      for (const f of list) urls.push(await uploadImageFile(f));
      onChange([...images, ...urls]);
    } catch (e) {
      import('@/hooks/use-toast').then(({ toast }) =>
        toast({ title: (e as Error).message || 'อัปโหลดไม่สำเร็จ', variant: 'destructive' }),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2.5">
        {images.map((url, i) => (
          <div key={`${url}-${i}`} className="group relative h-20 w-28 overflow-hidden rounded-lg border border-border bg-secondary/40">
            <img src={url} alt={`รูปที่ ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/70 text-white hover:bg-destructive transition-colors"
              aria-label={`ลบรูปที่ ${i + 1}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-[#f0b429]">ภาพหลัก</span>}
          </div>
        ))}

        {busy ? (
          <div className="flex h-20 w-28 items-center justify-center rounded-lg border border-dashed border-primary/60 bg-primary/5">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          images.length < max && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border bg-secondary/30 text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              aria-label="อัปโหลดรูปสินค้า"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[11px]">อัปโหลดรูป</span>
            </button>
          )
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
      <InputUrlAdd onAdd={(url) => onChange([...images, url])} disabled={images.length >= max} />
      <p className="text-[11px] text-muted-foreground">อัปโหลดได้สูงสุด {max} รูป (PNG/JPG/WEBP รูปละ {MAX_MB}MB) — รูปแรกใช้เป็นภาพปกสินค้า</p>
    </div>
  );
}

/** ช่องเพิ่มรูปด้วยลิงก์ (เสริมจากการอัปโหลด) */
function InputUrlAdd({ onAdd, compact = false, disabled = false }: { onAdd: (url: string) => void; compact?: boolean; disabled?: boolean }) {
  const [url, setUrl] = useState('');
  return (
    <div className={`flex items-center gap-2 ${compact ? 'flex-1 min-w-0' : 'w-full'}`}>
      <div className="relative flex-1 min-w-0">
        <Link2 className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (url.trim()) { onAdd(url.trim()); setUrl(''); }
            }
          }}
          placeholder="หรือวางลิงก์รูปแล้วกด Enter"
          className="h-9 w-full rounded-lg border border-border bg-secondary/60 pl-8 pr-2 text-xs outline-none focus:border-primary"
          aria-label="ลิงก์รูปภาพ"
        />
      </div>
      {!compact && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          disabled={disabled || !url.trim()}
          onClick={() => { onAdd(url.trim()); setUrl(''); }}
        >
          เพิ่มรูป
        </Button>
      )}
    </div>
  );
}
