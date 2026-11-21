/** หน้าแรก LrapX Store — โครงใหม่: 2 หมวดหมู่ (ไอดีเกม/เติมเกม) + รีวิวเลื่อนวน + สินค้าแนะนำ */
'use client';

import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { api, type Category, type Product, type Review, type TopupPackage } from '@/lib/client';
import { formatTHB } from '@/lib/format';
import { SectionHeading, RatingStars, SafeImage } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Gamepad2, Zap, Sparkles, ShieldCheck, Timer, BadgeCheck,
  ChevronRight, Gift, Star, ShoppingBag,
} from 'lucide-react';

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bought, setBought] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recommended, setRecommended] = useState<TopupPackage[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api<{ categories: Category[] }>('/api/data/categories', { silent: true }),
      api<{ products: Product[] }>('/api/data/products?limit=8', { silent: true }),
      api<{ reviews: Review[] }>('/api/data/reviews?limit=8', { silent: true }),
      api<{ packages: TopupPackage[] }>('/api/data/packages?category=giftpass', { silent: true }),
      api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true }),
    ])
      .then(([c, b, r, p, s]) => {
        setCategories(c.categories);
        setBought(b.products.filter((x) => x.soldCount > 0).slice(0, 8));
        setReviews(r.reviews);
        setRecommended(p.packages.slice(0, 6));
        setSettings(s.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const idCategories = categories.filter((c) => c.type === 'GAME_ID');
  const topupCategories = categories.filter((c) => c.type === 'TOPUP');

  return (
    <div className="page-enter">
      <Hero settings={settings} />
      <TrustBar />

      {/* หมวดหมู่ที่ 1: ไอดีเกม */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={Gamepad2}
          title="หมวดหมู่ไอดีเกม"
          subtitle="ไอดีสำเร็จรูปพร้อมขาย ตรวจสอบทุกไอดีก่อนส่งมอบ"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/game-ids')} className="border-primary/40 text-primary hover:bg-primary/10">
              ดูทั้งหมด <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {(loading ? [{}, {}] : idCategories).map((c, i) => (
            <CategoryBanner key={i} cat={c as Category} loading={loading} href={i === 0 ? '/game-ids/freefire' : '/game-ids/roblox'} />
          ))}
        </div>
      </section>

      {/* หมวดหมู่ที่ 2: เติมเกม — มีหมวดหมู่ย่อยเหมือนไอดีเกม ไม่รวมแพ็กเกจมาโชว์ */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={Zap}
          title="หมวดหมู่เติมเกม"
          subtitle="เลือกหมวดย่อยที่ต้องการ — เติมเพชร FF, Robux และ Gift Game Pass ส่งไวใน 5 นาที"
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
      <section className="relative py-12 gaming-grid bg-[#0a0a13] border-y border-border">
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

      {/* สินค้าแนะนำ — ไก่ตัน, ผลโมจิตื่น และอื่น ๆ */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <SectionHeading
          icon={Sparkles}
          title="สินค้าแนะนำ"
          subtitle="ของเกมยอดฮิตอย่าง ไก่ตัน, ผลโมจิตื่น, ผลมังกรตื่น และอื่น ๆ อีกมากมาย — จ่ายง่าย ส่งไว มีประกัน"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/topup/gift-pass')} className="border-primary/40 text-primary hover:bg-primary/10">
              ดูทั้งหมด <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {(loading ? Array.from({ length: 6 }) : recommended).map((p, i) => {
            const pack = p as TopupPackage;
            return (
              <button
                key={i}
                onClick={() => navigate('/topup/gift-pass')}
                className="gaming-card group p-4 text-left cursor-pointer hover:border-primary/50 transition-colors"
                aria-label={loading ? undefined : `สั่ง ${pack.name}`}
              >
                {loading ? (
                  <div className="h-24" />
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-500/20 border border-primary/30 text-primary">
                        <Gift className="h-5 w-5" />
                      </span>
                      {pack.badge && (
                        <span className="rounded-full bg-[#f0b429]/15 border border-[#f0b429]/40 px-2 py-0.5 text-[10px] font-semibold text-[#f0b429] whitespace-nowrap">
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-3 font-display text-sm font-semibold leading-snug line-clamp-2 min-h-[2.6rem] group-hover:text-primary transition-colors">
                      {pack.name}
                    </h3>
                    <div className="price-gold text-base mt-2">{formatTHB(pack.price)}</div>
                    <div className="mt-2 inline-flex items-center text-xs font-medium text-primary">
                      สั่งของได้เลย <ChevronRight className="ml-0.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
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
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 font-bold text-white text-sm">
          {r.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="font-display font-semibold text-sm truncate">{r.name}</div>
          <RatingStars rating={r.rating} className="h-3 w-3" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">&ldquo;{r.comment}&rdquo;</p>
      {r.gameTag && (
        <span className="mt-2 inline-block rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] text-violet-200">
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

function Hero({ settings }: { settings: Record<string, string> }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/hero-banner.png" alt="" className="h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d] via-[#07070d]/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070d] via-transparent to-[#07070d]/40" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="max-w-2xl animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f0b429]/40 bg-[#f0b429]/10 px-4 py-1.5 text-sm text-[#f0b429] font-medium">
            <BadgeCheck className="h-4 w-4" /> ร้านเกมมิ่งอันดับต้นของคนไทย
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold leading-tight md:text-6xl">
            <span className="text-glow text-primary">{settings.hero_title || 'พร้อมลุยแล้วหรือยัง?'}</span>
            <br />
            <span className="text-white">LrapX Store จัดให้ครบ</span>
          </h1>
          <p className="mt-4 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
            {settings.hero_subtitle || 'ไอดีเกมคุณภาพ เติมเกมราคาดี ส่งไวปลอดภัย มีประกัน เปิดให้บริการ 24 ชั่วโมง'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="h-12 px-7 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:from-violet-500 hover:to-fuchsia-400" onClick={() => navigate('/game-ids')}>
              <Gamepad2 className="mr-2 h-5 w-5" /> ดูสินค้าไอดีเกม
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-7 text-base border-[#f0b429]/50 text-[#f0b429] hover:bg-[#f0b429]/10 hover:text-[#f0b429]" onClick={() => navigate('/topup')}>
              <Zap className="mr-2 h-5 w-5" /> เติมเกมเลย
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Timer, title: 'ส่งไวใน 5-10 นาที', desc: 'ทำรายการอัตโนมัติ 24 ชม.' },
    { icon: ShieldCheck, title: 'ปลอดภัย 100%', desc: 'ระบบจ่ายเงินมาตรฐาน' },
    { icon: BadgeCheck, title: 'ประกันไอดี 7 วัน', desc: 'ยินดีรับผิดชอบทุกกรณี' },
    { icon: Sparkles, title: 'ราคาดีกว่าในเกม', desc: 'ส่วนลดทุกแพ็กเกจ' },
  ];
  return (
    <div className="border-b border-border bg-card/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:px-6">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <it.icon className="h-5 w-5" />
            </span>
            <div>
              <div className="font-display text-sm font-semibold">{it.title}</div>
              <div className="text-xs text-muted-foreground">{it.desc}</div>
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
      <div className="absolute inset-0 bg-gradient-to-r from-[#07070d]/90 via-[#07070d]/55 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-6">
        <h3 className="font-display text-2xl font-bold text-white">{cat.name}</h3>
        <p className="mt-1 text-sm text-violet-200/80 line-clamp-1">{cat.description}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="rounded-full bg-primary/25 border border-primary/40 px-3 py-1 text-xs font-medium text-violet-200">
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
  const href = cat?.slug === 'giftpass' ? '/topup/gift-pass' : cat?.slug === 'freefire-topup' ? '/topup/freefire' : '/topup/roblox';
  const icon = cat?.slug === 'giftpass' ? Gift : Zap;
  const Icon = icon;
  if (loading || !cat) return <div className="gaming-card h-40 animate-pulse bg-secondary/40" />;
  return (
    <button onClick={() => navigate(href)} className="gaming-card group p-5 text-left cursor-pointer" aria-label={`เข้าบริการ ${cat.name}`}>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-500/20 border border-primary/30 text-primary">
          <Icon className="h-6 w-6" />
        </span>
        {cat.image && <SafeImage src={cat.image} alt={cat.name} className="h-16 w-28 rounded-lg object-cover opacity-80" />}
      </div>
      <h3 className="mt-4 font-display text-lg font-bold group-hover:text-primary transition-colors">{cat.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
      <div className="mt-3 inline-flex items-center text-sm font-semibold text-primary">
        เลือกแพ็กเกจ ({cat._count?.packages ?? 0} แพ็ก) <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}
