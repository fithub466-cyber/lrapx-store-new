/** หน้าหมวดไอดีเกม + รายการสินค้า + รายละเอียดสินค้า */
'use client';

import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { api, type Category, type Product } from '@/lib/client';
import { formatTHB } from '@/lib/format';
import { useApp } from '@/lib/store';
import { SectionHeading, ProductCard, ProductStatusBadge, ProductSkeletonGrid, EmptyState, SafeImage } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { PurchaseDialog, type OrderDraft } from '@/components/purchase';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Gamepad2, ChevronRight, ShieldCheck, RefreshCcw, MessageCircle, Eye,
  ShoppingBag, Flame, BadgeCheck, Lock, FileCheck,
} from 'lucide-react';

// ================= หน้าหมวดหมู่ไอดีเกม =================

export function GameIdsPage() {
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>('/api/data/categories', { silent: true })
      .then((d) => setCats(d.categories.filter((c) => c.type === 'GAME_ID')))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <SectionHeading icon={Gamepad2} title="หมวดหมู่ไอดีเกม" subtitle="เลือกเกมที่ต้องการ เพื่อดูไอดีทั้งหมดที่พร้อมขาย" />
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">{[{}, {}].map((_, i) => <div key={i} className="gaming-card h-56 animate-pulse bg-secondary/40" />)}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(c.slug === 'freefire-id' ? '/game-ids/freefire' : '/game-ids/roblox')}
              className="gaming-card group relative overflow-hidden text-left cursor-pointer h-56"
              aria-label={`ดูไอดีทั้งหมดของ ${c.name}`}
            >
              {c.image && (
                <img src={c.image} alt={c.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070d] via-[#07070d]/60 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-6">
                <h3 className="font-display text-2xl font-bold">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-full bg-primary/20 border border-primary/40 px-3 py-1 text-xs font-medium text-violet-200">
                    จำนวนไอดีที่มี {c._count?.products ?? 0} ชิ้น
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white btn-neon">
                    ดูไอดีทั้งหมด <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, title: 'ตรวจสอบก่อนส่งมอบ', desc: 'ทุกไอดีผ่านการตรวจสถานะและของในไอดีก่อนประกาศขาย' },
          { icon: FileCheck, title: 'เปลี่ยนข้อมูลได้ทันที', desc: 'รับข้อมูลเข้าสู่ระบบทางแชท พร้อมคู่มือเปลี่ยนอีเมล/รหัสผ่านเอง' },
          { icon: RefreshCcw, title: 'ประกัน 7 วันเต็ม', desc: 'มีปัญหาการเข้าใช้งาน แจ้งแอดมินรับผิดชอบถึงที่สุด' },
        ].map((it, i) => (
          <div key={i} className="gaming-card p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary mb-3"><it.icon className="h-5.5 w-5.5" /></span>
            <div className="font-display font-semibold">{it.title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================= หน้ารายการสินค้าของเกม =================

export function ProductListPage({ slug, gameName }: { slug: string; gameName?: string }) {
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'AVAILABLE' | 'SOLD'>('ALL');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [c, p] = await Promise.all([
          api<{ category: Category }>(`/api/data/category/${slug}`, { silent: true }),
          api<{ products: Product[] }>(`/api/data/products?category=${slug}`, { silent: true }),
        ]);
        setCategory(c.category);
        setProducts(p.products);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const shown = products.filter((p) => (filter === 'ALL' ? true : p.status === filter));

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="เส้นทาง">
        <button onClick={() => navigate('/')} className="hover:text-primary cursor-pointer">หน้าหลัก</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate('/game-ids')} className="hover:text-primary cursor-pointer">หมวดหมู่ไอดีเกม</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{category?.name ?? (gameName ?? '...')}</span>
      </nav>

      {category && (
        <div className="gaming-card relative overflow-hidden mb-8 p-6 md:p-8">
          {category.image && (
            <>
              <img src={category.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#07070d]/95 via-[#07070d]/80 to-[#07070d]/40" />
            </>
          )}
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold">{category.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-center">
              <div className="font-display text-2xl font-bold text-primary">{products.filter((p) => p.status === 'AVAILABLE').length}</div>
              <div className="text-xs text-muted-foreground">ไอดีพร้อมขาย</div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2">
        {([
          ['ALL', 'ทั้งหมด'],
          ['AVAILABLE', 'พร้อมขาย'],
          ['SOLD', 'ขายแล้ว'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer border ${
              filter === value ? 'bg-primary text-white border-primary glow-purple' : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <ProductSkeletonGrid />
      ) : shown.length === 0 ? (
        <EmptyState title="ไม่มีสินค้าในหมวดนี้" description="ไอดีอาจขายหมดช่วงนี้ ลองกลับมาดูใหม่ภายหลัง หรือแจ้งแอดมินเพื่อเปิดจอง" />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shown.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

// ================= หน้ารายละเอียดสินค้า =================

export function ProductDetailPage({ id }: { id: string }) {
  const { user, refresh, setPopup } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setImgIdx(0);
      try {
        const d = await api<{ product: Product; related: Product[] }>(`/api/data/product/${id}`, { silent: true });
        setProduct(d.product);
        setRelated(d.related);
      } catch {
        toast({ title: 'ไม่พบสินค้า', description: 'สินค้าอาจถูกลบหรือซ่อนอยู่', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl bg-muted" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4 bg-muted" />
            <Skeleton className="h-6 w-1/3 bg-muted" />
            <Skeleton className="h-40 w-full bg-muted" />
            <Skeleton className="h-12 w-full bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-enter mx-auto max-w-7xl px-4 py-16 md:px-6">
        <EmptyState title="ไม่พบสินค้านี้" description="อาจถูกลบไปแล้วหรือลิงก์ไม่ถูกต้อง" />
        <div className="mt-6 text-center">
          <Button onClick={() => navigate('/game-ids')} variant="outline">กลับหน้าหมวดไอดีเกม</Button>
        </div>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : ['/images/hero-banner.png'];
  const sold = product.status === 'SOLD';
  const details = product.details;

  function buy() {
    if (!user) {
      toast({ title: 'กรุณาเข้าสู่ระบบก่อนซื้อสินค้า', description: 'สมัครสมาชิกได้ฟรีภายในไม่กี่วินาที' });
      setPopup('login');
      return;
    }
    setDialogOpen(true);
  }

  const draft: OrderDraft = {
    type: 'GAME_ID',
    items: [{ productId: product.id, quantity: 1 }],
    title: `${product.title} (${product.code})`,
    price: product.price,
  };

  return (
    <div className="page-enter mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground" aria-label="เส้นทาง">
        <button onClick={() => navigate('/')} className="hover:text-primary cursor-pointer">หน้าหลัก</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate('/game-ids')} className="hover:text-primary cursor-pointer">หมวดหมู่ไอดีเกม</button>
        <ChevronRight className="h-3.5 w-3.5" />
        <button onClick={() => navigate(`/game-ids/${product.category?.slug === 'roblox-id' ? 'roblox' : 'freefire'}`)} className="hover:text-primary cursor-pointer">
          {product.category?.name}
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium line-clamp-1">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* แกลเลอรีภาพ */}
        <div>
          <div className="gaming-card overflow-hidden relative">
            <SafeImage src={images[imgIdx]} alt={product.title} className="aspect-[4/3] w-full object-cover" />
            {sold && <div className="absolute inset-0 bg-black/55 flex items-center justify-center"><span className="font-display text-2xl font-bold text-rose-300 border border-rose-400/40 bg-black/50 rounded-xl px-6 py-3">ขายแล้ว</span></div>}
            <span className="absolute top-3 left-3"><ProductStatusBadge status={product.status} /></span>
            <span className="absolute top-3 right-3 rounded-md bg-black/60 px-2.5 py-1 font-mono text-xs text-[#f0b429] border border-[#f0b429]/30">{product.code}</span>
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2.5">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-colors cursor-pointer ${i === imgIdx ? 'border-primary neon-ring' : 'border-border hover:border-primary/50'}`}
                  aria-label={`ภาพที่ ${i + 1}`}
                >
                  <SafeImage src={img} alt={`${product.title} ภาพ ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ข้อมูลสินค้า */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold leading-snug">{product.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="price-gold text-3xl">{formatTHB(product.price)}</span>
            <span className="text-sm text-muted-foreground">ขายแล้ว {product.soldCount} ชิ้น</span>
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f0b429]/15 border border-[#f0b429]/40 px-3 py-1 text-xs font-medium text-[#f0b429]">
                <Flame className="h-3.5 w-3.5" /> สินค้าแนะนำ
              </span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {/* รายละเอียดไอดี */}
          <div className="mt-6 rounded-2xl border border-border bg-card/70 overflow-hidden">
            <div className="border-b border-border bg-secondary/40 px-5 py-3 font-display font-semibold flex items-center gap-2">
              <BadgeCheck className="h-4.5 w-4.5 text-primary" /> รายละเอียดไอดี
            </div>
            <dl className="divide-y divide-border">
              {details.map((d, i) => (
                <div key={i} className="flex px-5 py-3 text-sm">
                  <dt className="w-40 shrink-0 text-muted-foreground">{d.label}</dt>
                  <dd className="font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* เงื่อนไขการซื้อ */}
          <div className="mt-4 rounded-2xl border border-[#f0b429]/25 bg-[#f0b429]/5 p-5 text-sm">
            <div className="flex items-center gap-2 font-display font-semibold text-[#f0b429] mb-2.5">
              <Lock className="h-4 w-4" /> เงื่อนไขการซื้อ
            </div>
            <ul className="space-y-1.5 text-muted-foreground list-disc pl-5">
              <li>ข้อมูลเข้าสู่ระบบ (อีเมล/รหัสผ่าน) จะส่งให้เฉพาะผู้ซื้อทางหน้าคำสั่งซื้อ ภายใน 10-30 นาทีหลังชำระเงิน และ <span className="text-foreground font-medium">จะไม่มีการแสดงข้อมูลบัญชีในหน้าเว็บสาธารณะ</span></li>
              <li>รับของแล้วควรเปลี่ยนรหัสผ่านและผูกอีเมลของตัวเองทันที</li>
              <li>ประกันไอดี 7 วันเต็ม กรณีปัญหาจากฝั่งผู้ขาย</li>
              <li>สินค้าเป็นของชิ้นเดียว ระบบจะปิดการขายทันทีเมื่อมีผู้ซื้อรายแรก</li>
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="h-13 min-h-12 flex-1 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white" disabled={sold} onClick={buy}>
              <ShoppingBag className="mr-2 h-5 w-5" /> {sold ? 'สินค้าขายแล้ว' : 'ซื้อสินค้าตอนนี้'}
            </Button>
            <Button size="lg" variant="outline" className="min-h-12 border-[#f0b429]/40 text-[#f0b429] hover:bg-[#f0b429]/10 hover:text-[#f0b429]" onClick={() => navigate('/contact')}>
              <MessageCircle className="mr-2 h-5 w-5" /> สอบถามแอดมิน
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            ธุรกรรมทั้งหมดผ่านระบบกระเป๋าเงิน LrapX ที่มีการบันทึกประวัติครบถ้วน
          </div>
        </div>
      </div>

      {/* สินค้าที่เกี่ยวข้อง */}
      {related.length > 0 && (
        <section className="mt-14">
          <SectionHeading icon={Eye} title="ไอดีอื่น ๆ ที่น่าสนใจ" subtitle="จากหมวดเดียวกัน" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <PurchaseDialog open={dialogOpen} onOpenChange={setDialogOpen} draft={draft} onSuccess={refresh} />
    </div>
  );
}

