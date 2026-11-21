/** หน้าเสริม: วิธีใช้งาน / ติดต่อร้านค้า / ผลการค้นหา */
'use client';

import { useEffect, useState } from 'react';
import { navigate } from '@/lib/router';
import { api, type Product, type TopupPackage } from '@/lib/client';
import { formatTHB } from '@/lib/format';
import { SectionHeading, EmptyState, ProductCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle, MessageCircle, Search as SearchIcon, Gamepad2, CircleDollarSign, Zap,
  ReceiptText, ShieldCheck, CircleAlert, ChevronRight, Phone, Mail, Clock, Facebook, Package,
} from 'lucide-react';

export function HowToPage() {
  const guides = [
    {
      icon: Gamepad2,
      title: 'วิธีซื้อไอดีเกม',
      steps: [
        'เข้าหน้า "หมวดหมู่ไอดีเกม" แล้วเลือกเกมที่ต้องการ (Free Fire หรือ Roblox)',
        'กดปุ่ม "รายละเอียด" บนการ์ดสินค้า เพื่อดูข้อมูลไอดี ราคา และเงื่อนไขการซื้อ',
        'กด "ซื้อสินค้า" — ถ้ายังไม่ได้เข้าสู่ระบบ ระบบจะพาไปหน้าเข้าสู่ระบบ/สมัครสมาชิก',
        'เลือกช่องทางชำระเงิน: กระเป๋าเงิน (ตัดยอดทันที) หรือโอนธนาคารพร้อมแนบสลิป',
        'ยืนยันการสั่งซื้อ รับเลขคำสั่งซื้อ แล้วติดตามสถานะที่หน้า "ประวัติการสั่งซื้อ"',
        'เมื่อแอดมินส่งข้อมูลไอดี จะแสดงในรายละเอียดคำสั่งซื้อ (ผู้ซื้อเห็นเฉพาะตัวเอง)',
      ],
    },
    {
      icon: Zap,
      title: 'วิธีเติมเกม (Free Fire / Roblox / Gift Pass)',
      steps: [
        'เข้าหน้า "หมวดหมู่เติมเกม" แล้วเลือกบริการที่ต้องการ',
        'เลือกแพ็กเกจ เช่น 70 เพชร, 400 Robux หรือบัตร Gift Pass',
        'กรอก Player ID (Free Fire) หรือชื่อผู้ใช้ Roblox — ตรวจสอบให้ถูกต้องก่อนกดไปต่อ',
        'ตรวจสอบคำสั่งซื้อในหน้าสรุป แล้วเลือกช่องทางชำระเงิน',
        'รอ 5-15 นาที ของจะเข้าไอดีของคุณ หรือรับโค้ดทางหน้าคำสั่งซื้อ',
      ],
    },
    {
      icon: CircleDollarSign,
      title: 'วิธีเติมเงินเข้ากระเป๋า',
      steps: [
        'เข้าหน้า "เติมเงินเข้ากระเป๋า" (ต้องเข้าสู่ระบบก่อน)',
        'ช่องทางที่ 1: ส่งเงินเข้าซองอังเปา TrueMoney ของร้าน แล้ววางลิงก์ซองอังเปา + จำนวนเงิน',
        'ช่องทางที่ 2: โอนเข้าบัญชีธนาคารของร้าน (กดคัดลอกเลขบัญชีได้) แล้วอัปโหลดสลิป',
        'ส่งคำขอแล้วสถานะจะเป็น "รอตรวจสอบ" — แอดมินตรวจยอดจริงแล้วเงินจะเข้ากระเป๋าอัตโนมัติ',
        'ดูประวัติการเคลื่อนไหวทั้งหมดที่หน้า "กระเป๋าเงิน"',
      ],
    },
    {
      icon: ReceiptText,
      title: 'วิธีติดตามคำสั่งซื้อ',
      steps: [
        'เข้าเมนู "ประวัติการสั่งซื้อ" จะแสดงเลขคำสั่งซื้อ รายการ ราคา และสถานะ',
        'ค้นหาด้วยเลขคำสั่งซื้อ หรือกรองตามสถานะ (รอชำระเงิน/กำลังตรวจสอบ/กำลังดำเนินการ/สำเร็จ)',
        'กด "ดูรายละเอียด" เพื่อดูข้อมูลการส่งมอบและข้อความจากแอดมิน',
      ],
    },
  ];

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-10 md:px-6">
      <SectionHeading icon={HelpCircle} title="วิธีใช้งาน LrapX Store" subtitle="คู่มือการใช้บริการทั้งหมดในที่เดียว" />
      <div className="grid gap-5 md:grid-cols-2">
        {guides.map((g, i) => (
          <div key={i} className="gaming-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><g.icon className="h-5.5 w-5.5" /></span>
              <h3 className="font-display text-lg font-bold">{g.title}</h3>
            </div>
            <ol className="space-y-2.5">
              {g.steps.map((s, j) => (
                <li key={j} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-xs font-bold text-foreground">{j + 1}</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="mt-8 gaming-card border-[#f0b429]/30 bg-[#f0b429]/5 p-6">
        <h3 className="font-display font-bold flex items-center gap-2 text-[#f0b429]"><CircleAlert className="h-5 w-5" /> ข้อควรรู้ก่อนใช้บริการ</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>ร้านจะไม่ขอรหัสผ่านของคุณเด็ดขาด — ทุกบริการเติมเกมใช้เพียง Player ID / ชื่อผู้ใช้</li>
          <li>ข้อมูลไอดีที่ซื้อจะส่งเฉพาะผู้ซื้อในหน้าคำสั่งซื้อเท่านั้น ไม่ปรากฏในหน้าเว็บสาธารณะ</li>
          <li>การชำระเงินทุกครั้งให้ตรวจสอบเลขคำสั่งซื้อ/เลขอ้างอิงก่อนโอนเสมอ</li>
          <li>หากพบปัญหา ติดต่อแอดมินได้ทันทีผ่าน LINE หรือหน้า "ติดต่อร้านค้า"</li>
        </ul>
        <Button className="mt-4 border-[#f0b429]/40 text-[#f0b429] hover:bg-[#f0b429]/10 hover:text-[#f0b429]" variant="outline" onClick={() => navigate('/contact')}>
          ไปหน้าติดต่อร้านค้า <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ContactPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  useEffect(() => {
    api<{ settings: Record<string, string> }>('/api/data/settings', { silent: true }).then((d) => setSettings(d.settings)).catch(() => {});
  }, []);

  const channels = [
    { icon: MessageCircle, label: 'LINE Official Account', value: settings.contact_line, desc: 'ช่องทางหลัก ตอบไวที่สุด' },
    { icon: Facebook, label: 'Facebook Page', value: settings.contact_facebook, desc: 'แจ้งปัญหา ให้คะแนนรีวิว' },
    { icon: Phone, label: 'เบอร์โทรศัพท์', value: settings.contact_phone, desc: 'กรณีเร่งด่วน' },
    { icon: Mail, label: 'อีเมล', value: settings.contact_email, desc: 'งานเอกสาร/ความร่วมมือ' },
    { icon: Clock, label: 'เวลาทำการ', value: settings.contact_hours, desc: 'ทีมแอดมินพร้อมช่วยเหลือ' },
  ];

  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 md:px-6">
      <SectionHeading icon={MessageCircle} title="ติดต่อร้านค้า" subtitle="มีปัญหาหรือคำถาม? ทีมงาน LrapX Store พร้อมช่วยเหลือคุณ" />
      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map((c, i) => (
          <div key={i} className="gaming-card p-5 flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><c.icon className="h-5.5 w-5.5" /></span>
            <div className="min-w-0">
              <div className="font-display font-semibold">{c.label}</div>
              <div className="mt-0.5 text-sm text-[#f0b429] font-medium truncate">{c.value || '-'}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{c.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 gaming-card p-6 text-sm text-muted-foreground leading-relaxed">
        <h3 className="font-display font-semibold text-foreground mb-2">ช่องทางการเตือนภัย</h3>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>เจ้าหน้าที่ของร้านจะไม่ขอรหัสผ่าน/OTP ของคุณเด็ดขาด</li>
          <li>ชำระเงินเฉพาะบัญชีที่แสดงในหน้า "เติมเงินเข้ากระเป๋า" ของเว็บไซต์เท่านั้น</li>
          <li>ระวังบัญชีปลอมที่อ้างว่าเป็นแอดมินร้าน — ตรวจสอบผ่าน LINE Official เสมอ</li>
        </ul>
      </div>
    </div>
  );
}

export function SearchPage({ initialQuery }: { initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [packages, setPackages] = useState<(TopupPackage & { category?: { name: string } })[]>([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const d = await api<{ products: Product[]; packages: TopupPackage[] }>(`/api/data/search?q=${encodeURIComponent(query.trim())}`, { silent: true });
      setProducts(d.products);
      setPackages(d.packages);
    } catch {
      setProducts([]);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
  }, [initialQuery]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-10 md:px-6">
      <SectionHeading icon={SearchIcon} title="ค้นหาสินค้า" subtitle="ค้นหาไอดีเกม แพ็กเกจเติมเกม หรือรหัสสินค้า" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(q);
        }}
        className="relative mb-8"
      >
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="เช่น ไอดี FF, Robux, FF-ID-0001..."
          className="pl-12 h-14 text-lg bg-secondary/60"
          aria-label="ช่องค้นหา"
        />
        <Button type="submit" className="absolute right-2 top-2 h-10 px-6 btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white">
          ค้นหา
        </Button>
      </form>

      {loading && <div className="h-40 rounded-2xl bg-secondary/30 animate-pulse" />}

      {!loading && searched && products.length === 0 && packages.length === 0 && (
        <EmptyState title="ไม่พบผลการค้นหา" description={`ไม่มีสินค้าที่ตรงกับ "${q}" — ลองใช้คำอื่น เช่น FF หรือ Robux`} />
      )}

      {products.length > 0 && (
        <section className="mb-10">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Gamepad2 className="h-5 w-5 text-primary" /> ไอดีเกม ({products.length} รายการ)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {packages.length > 0 && (
        <section>
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> แพ็กเกจเติมเกม ({packages.length} รายการ)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {packages.map((p) => (
              <button key={p.id} onClick={() => navigate('/topup')} className="gaming-card p-4 text-left cursor-pointer">
                <div className="text-xs text-muted-foreground">{(p as { category?: { name?: string } }).category?.name}</div>
                <div className="font-display font-semibold text-sm mt-1">{p.name}</div>
                <div className="price-gold mt-1">{formatTHB(p.price)}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {!searched && !loading && (
        <div className="gaming-card p-6 flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          เกร็ดค้นหา: ลองค้นด้วยชื่อเกม (FF, Roblox), ประเภทสินค้า (ไอดี, เพชร, Robux) หรือรหัสสินค้าโดยตรง เช่น FF-ID-0001
        </div>
      )}
    </div>
  );
}
