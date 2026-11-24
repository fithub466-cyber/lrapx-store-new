/** หน้าแรก LrapX Store — โครงใหม่: 2 หมวดหมู่ (ไอดีเกม/เติมเกม) + รีวิวเลื่อนวน + สินค้าแนะนำ */
'use client';

import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { api, type Category, type Product, type Review } from '@/lib/client';
import { formatTHB } from '@/lib/format';
import { SectionHeading, RatingStars, SafeImage, ProductCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Gamepad2, Zap, ShieldCheck, Timer, BadgeCheck,
  ChevronRight, Gift, Star, ShoppingBag, Sparkles,
} from 'lucide-react';

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bought, setBought] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api<{ categories: Category[] }>('/api/data/categories', { silent: true }),
      api<{ products: Product[] }>('/api/data/products?limit=8', { silent: true }),
      api<{ reviews: Review[] }>('/api/data/reviews?limit=8', { silent: true }),
      api<{ products: Product[] }>('/api/data/products?featured=1&limit=8', { silent: true }),
      api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true }),
    ])
      .then(([c, b, r, p, s]) => {
        setCategories(c.categories);
        setBought(b.products.filter((x) => x.soldCount > 0).slice(0, 8));
        setReviews(r.reviews);
        setRecommendedProducts(p.products);
        setSettings(s.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const idCategories = categories.filter((c) => c.type === 'GAME_ID');
  const topupCategories = categories.filter((c) => c.type === 'TOPUP');

  return (
    <div className="page-enter lrapx-home-page" style={settings.home_background_image ? { backgroundImage: `linear-gradient(rgba(0,0,0,.10), rgba(0,0,0,.16)), url("${settings.home_background_image.replace(/["\\\\]/g, "")}")` } : undefined}>
      <Hero settings={settings} loading={loading} />
      <TrustBar settings={settings} />

      {/* หมวดหมู่ที่ 1: ไอดีเกม */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={Gamepad2}
          title={settings.home_id_title || "หมวดหมู่ไอดีเกม"}
          subtitle={settings.home_id_subtitle || "ไอดีสำเร็จรูปพร้อมขาย ตรวจสอบทุกไอดีก่อนส่งมอบ"}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/game-ids')} className="border-primary/40 text-primary hover:bg-primary/10">
              ดูทั้งหมด <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {(loading ? [{}, {}] : idCategories).map((c, i) => (
            <CategoryBanner key={i} cat={c as Category} loading={loading} href={`/game-ids/${(c as Category).slug}`} />
          ))}
        </div>
      </section>

      {/* หมวดหมู่ที่ 2: เติมเกม — มีหมวดหมู่ย่อยเหมือนไอดีเกม ไม่รวมแพ็กเกจมาโชว์ */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={Zap}
          title={settings.home_topup_title || "หมวดหมู่เติมเกม"}
          subtitle={settings.home_topup_subtitle || "เลือกหมวดย่อยที่ต้องการ — เติมเพชร FF, Robux และ Gift Game Pass"}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/topup')} className="border-primary/40 text-primary hover:bg-primary/10">
              ดูทั้งหมด <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {(loading ? [{}, {}, {}] : topupCategories).map((c, i) => (
            <TopupServiceCard key={i} cat={c as Category} loading={loading} />
          ))}
        </div>
      </section>

      {/* รีวิวจากลูกค้า + สินค้าที่มีคนซื้อ — เลื่อนไปข้าง ๆ เรื่อย ๆ วนไม่สิ้นสุด */}
      <section className="relative py-12 border-y border-border bg-black/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <SectionHeading
            icon={Star}
            title="รีวิวจากลูกค้า"
            subtitle="ความเห็นจริงจากผู้ใช้ พร้อมสินค้าที่ลูกค้าซื้อไปแล้ว"
          />
          <div className="marquee" aria-label="รีวิวและสินค้าที่มีคนซื้อ เลื่อนอัตโนมัติ">
            <div className="marquee-track py-1">
              {(loading ? Array.from({ length: 8 }) : [...buildStrip(reviews, bought), ...buildStrip(reviews, bought)]).map((item, i) => (
                <div key={i} className="w-[270px] shrink-0 pr-4">
                  {loading ? (
                    <div className="gaming-card h-44 animate-pulse bg-secondary/40" />
                  ) : 'rating' in (item as object) ? (
                    <MarqueeReviewCard r={item as Review} />
                  ) : (
                    <MarqueeProductCard p={item as Product} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* สินค้าแนะนำ: แสดงสินค้าเด่นที่แอดมินเลือก ไม่ใช่หมวดหมู่ */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={ShoppingBag}
          title="สินค้าแนะนำ"
        />
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="gaming-card aspect-[3/4] animate-pulse bg-secondary/40" />)}
          </div>
        ) : recommendedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-4">
            {recommendedProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="gaming-card px-5 py-8 text-center text-sm text-muted-foreground">
            ยังไม่มีสินค้าแนะนำ — เลือกเปิด “สินค้าแนะนำ” ในหน้าจัดการสินค้าเพื่อให้แสดงที่นี่
          </div>
        )}
      </section>
    </div>
  );
}

/** จัดแถวเลื่อน: สลับรีวิวกับสินค้าที่มีคนซื้อ */
function buildStrip(reviews: Review[], products: Product[]): (Review | Product)[] {
  const items: (Review | Product)[] = [];
  const max = Math.max(reviews.length, products.length);
  for (let i = 0; i < max; i++) {
    if (reviews[i]) items.push(reviews[i]);
    if (products[i]) items.push(products[i]);
  }
  return items;
}

function MarqueeReviewCard({ r }: { r: Review }) {
  return (
    <div className="gaming-card h-44 overflow-hidden p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#8f603d] to-[#c89565] font-bold text-white text-sm">
          {r.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="font-display font-semibold text-sm truncate">{r.name}</div>
          <RatingStars rating={r.rating} className="h-3 w-3" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
      {r.gameTag && (
        <span className="mt-2 inline-block rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] text-[#d9b18d]">
          {r.gameTag === 'freefire' ? 'Free Fire' : r.gameTag === 'roblox' ? 'Roblox' : r.gameTag === 'giftpass' ? 'Gift Pass' : 'รีวิวร้าน'}
        </span>
      )}
    </div>
  );
}

function MarqueeProductCard({ p }: { p: Product }) {
  return (
    <button onClick={() => navigate(`/product/${p.id}`)} className="gaming-card h-44 w-full overflow-hidden text-left cursor-pointer hover:border-primary/50 transition-colors">
      <div className="relative h-[4.6rem]">
        {p.images?.[0] && <SafeImage src={p.images[0]} alt={p.title} className="h-full w-full object-cover" />}
        <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/75 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
          <ShoppingBag className="h-3 w-3" /> มีคนซื้อแล้ว {p.soldCount} ชิ้น
        </span>
      </div>
      <div className="p-3">
        <h3 className="text-xs font-medium leading-snug line-clamp-2 min-h-[2.2rem]">{p.title}</h3>
        <div className="price-gold text-sm mt-1.5">{formatTHB(p.price)}</div>
      </div>
    </button>
  );
}

function Hero({ settings, loading }: { settings: Record<string, string>; loading: boolean }) {
  const image = settings.hero_background_image || '/images/hero-banner.png';

  return (
    <section className="relative w-full bg-transparent pt-5 pb-8 sm:pt-7 sm:pb-10 lg:pt-8 lg:pb-12">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="relative aspect-[100/51.3] w-full overflow-hidden rounded-[18px] bg-transparent sm:aspect-[100/29.925] sm:rounded-[26px]">
        {!loading && (
          <div className="shine-sweep shine-target-hero absolute inset-0 overflow-hidden rounded-[18px] sm:rounded-[26px]" style={{ borderRadius: 18, clipPath: "inset(0 round 18px)" }}>
            <span className="shine-sweep-overlay" aria-hidden="true" />
            <img
              key={image}
              src={image}
              alt="LrapX Store"
              className="absolute inset-0 h-full w-full object-contain object-center"
              style={{ borderRadius: 18, clipPath: "inset(0 round 18px)" }}
              fetchPriority="high"
              decoding="async"
            />
          </div>
        )}
        {settings.hero_corner_image && (
          <img
            src={settings.hero_corner_image}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute left-2 top-1 z-20 h-auto w-[58%] max-w-[620px] object-contain object-left-top drop-shadow-[0_0_14px_rgba(255,150,20,0.28)] sm:left-4 sm:top-2 sm:w-[46%]"
            loading="eager"
            decoding="async"
          />
        )}
        </div>
      </div>
    </section>
  );
}

function TrustBar({ settings }: { settings: Record<string, string> }) {
  const items = [
    { icon: Timer, image: settings.trust_1_image, title: settings.trust_1_title || 'ส่งไวใน 5-10 นาที', desc: settings.trust_1_desc || 'ดำเนินการรวดเร็วทุกออเดอร์' },
    { icon: ShieldCheck, image: settings.trust_2_image, title: settings.trust_2_title || 'ปลอดภัย 100%', desc: settings.trust_2_desc || 'ระบบจ่ายเงินมาตรฐาน' },
    { icon: BadgeCheck, image: settings.trust_3_image, title: settings.trust_3_title || 'ประกันไอดี 7 วัน', desc: settings.trust_3_desc || 'ยินดีรับผิดชอบทุกกรณี' },
    { icon: Sparkles, image: settings.trust_4_image, title: settings.trust_4_title || 'ราคาดีกว่าในเกม', desc: settings.trust_4_desc || 'ส่วนลดทุกแพ็กเกจ' },
  ];
  return (
    <div className="bg-transparent">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
        {items.map((it, i) => (
          <div key={i} className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-primary">
              {it.image ? <span className={`shine-sweep shine-target-trust-${i+1} inline-flex h-full w-full`}><span className="shine-sweep-overlay" aria-hidden="true" /><img src={it.image} alt="" className="h-full w-full object-contain" /></span> : <it.icon className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <div className="font-display text-sm font-semibold leading-snug">{it.title}</div>
              <p className="mt-1 block text-xs leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBanner({ cat, loading, href }: { cat?: Category; loading: boolean; href: string }) {
  if (loading || !cat) {
    return <div className="gaming-card h-48 animate-pulse bg-secondary/40" />;
  }
  return (
    <button onClick={() => navigate(href)} className="gaming-card group relative overflow-hidden text-left cursor-pointer h-48" aria-label={`เข้าหมวด ${cat.name}`}>
      {cat.image && (
        <img src={cat.image} alt={cat.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-[#000000]/90 via-[#000000]/55 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-6">
        <h3 className="font-display text-2xl font-bold text-white">{cat.name}</h3>
        <p className="mt-1 text-sm text-[#d9b18d]/80 line-clamp-1">{cat.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-primary/25 border border-primary/40 px-3 py-1 text-xs font-medium text-[#d9b18d]">
            มีไอดีพร้อมขาย {cat._count?.products ?? 0} ชิ้น
          </span>
          <span className="inline-flex items-center text-sm font-semibold text-[#f0b429]">
            ดูไอดีทั้งหมด <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </button>
  );
}

function TopupServiceCard({ cat, loading }: { cat?: Category; loading: boolean }) {
  const href = cat?.slug === 'giftpass' ? '/topup/gift-pass' : `/topup/${cat?.slug ?? ''}`;
  if (loading || !cat) return <div className="gaming-card h-48 animate-pulse bg-secondary/40" />;
  return (
    <button
      onClick={() => navigate(href)}
      className="gaming-card group relative h-48 overflow-hidden text-left cursor-pointer"
      aria-label={`เข้าบริการ ${cat.name}`}
    >
      {cat.image && (
        <img
          src={cat.image}
          alt={cat.name}
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#07070d]/95 via-[#07070d]/55 to-[#07070d]/10" />
      <div className="relative flex h-full flex-col justify-end p-6">
        <h3 className="font-display text-2xl font-bold text-white group-hover:text-primary transition-colors">{cat.name}</h3>
        <p className="mt-1 text-sm text-white/80 line-clamp-2">{cat.description}</p>
        <div className="mt-3 inline-flex items-center text-sm font-semibold text-[#d9b18d]">
          เลือกแพ็กเกจ ({cat._count?.packages ?? 0} แพ็ก) <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
