/** Dialog ยืนยันการสั่งซื้อ — ใช้ทั้งซื้อไอดีเกม และเติมเกม (เลือกช่องทางชำระเงิน → ยืนยัน → เลขคำสั่งซื้อ) */
'use client';

import { useState } from 'react';
import { api, type Order } from '@/lib/client';
import { useApp } from '@/lib/store';
import { navigate } from '@/lib/router';
import { formatTHB, PAYMENT_METHOD } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, CreditCard, ImagePlus, Loader2, ReceiptText, Upload, Wallet } from 'lucide-react';

export type OrderDraft = {
  type: 'GAME_ID' | 'TOPUP' | 'GIFT_PASS';
  items: { productId?: string; packageId?: string; quantity?: number }[];
  title: string;
  price: number;
  contact?: { playerId?: string; robloxUsername?: string; email?: string; note?: string };
  requirePlayerId?: boolean;
};

export function PurchaseDialog({
  open, onOpenChange, draft, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: OrderDraft | null;
  onSuccess?: () => void;
}) {
  const { user, refresh } = useApp();
  const [payment, setPayment] = useState<'WALLET' | 'BANK_TRANSFER'>('WALLET');
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [slipUploading, setSlipUploading] = useState(false);
  const [playerId, setPlayerId] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!draft) return null;

  const insufficient = payment === 'WALLET' && (user?.walletBalance ?? 0) < draft.price;

  function reset() {
    setPayment('WALLET');
    setSlipUrl(null);
    setPlayerId('');
    setNote('');
    setDone(null);
    setError(null);
  }

  async function uploadSlip(file: File) {
    setSlipUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'อัปโหลดไม่สำเร็จ');
      setSlipUrl(data.url);
      toast({ title: 'แนบสลิปสำเร็จ' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSlipUploading(false);
    }
  }

  async function submit() {
    setError(null);
    if (draft!.requirePlayerId && !playerId.trim() && !draft!.contact?.playerId) {
      setError('กรุณากรอก Player ID ที่จะรับบริการ');
      return;
    }
    if (payment === 'BANK_TRANSFER' && !slipUrl) {
      setError('กรุณาแนบสลิปการโอนเงินก่อนยืนยัน');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api<{ order: Order }>('/api/data/order', {
        method: 'POST',
        body: JSON.stringify({
          type: draft!.type,
          paymentMethod: payment,
          items: draft!.items,
          contact: {
            ...(draft!.contact ?? {}),
            ...(playerId.trim() ? { playerId: playerId.trim() } : {}),
            ...(note.trim() ? { note: note.trim() } : {}),
          },
          ...(slipUrl ? { slipImage: slipUrl } : {}),
        }),
      });
      setDone(res.order);
      await refresh();
      onSuccess?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function closeAll() {
    onOpenChange(false);
    setTimeout(reset, 300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) closeAll();
      }}
    >
      <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
        {done ? (
          <div className="text-center py-2">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400 glow-purple" />
            <DialogHeader className="mt-3">
              <DialogTitle className="font-display text-xl justify-center text-center">สั่งซื้อสำเร็จ!</DialogTitle>
              <DialogDescription className="text-center">
                เลขคำสั่งซื้อของคุณคือ{' '}
                <span className="font-mono font-bold text-[#f0b429]">{done.orderNo}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-4 text-sm space-y-2 text-left">
              <div className="space-y-1"><span className="text-muted-foreground">รายการที่สั่งซื้อ</span>{done.items.map((item) => <div key={item.id} className="flex justify-between gap-3"><span className="font-medium">{item.name}</span><span className="shrink-0">{formatTHB(item.price)}</span></div>)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">ยอดรวม</span><span className="price-gold">{formatTHB(done.total)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">สถานะ</span><span className="font-medium text-violet-300">
                {done.status === 'PROCESSING' ? 'กำลังดำเนินการ' : done.status === 'REVIEWING' ? 'กำลังตรวจสอบการชำระเงิน' : done.status}
              </span></div>
              <p className="text-xs text-muted-foreground pt-1">
                {done.paymentMethod === 'WALLET'
                  ? 'หักเงินจากกระเป๋าเรียบร้อยแล้ว แอดมินจะดำเนินการส่งของ/เติมไอดีโดยเร็วที่สุด'
                  : 'รอแอดมินตรวจสอบสลิปการโอน โดยปกติใช้เวลาไม่เกิน 15 นาทีในเวลาทำการ'}
              </p>
              {draft?.contact?.note?.includes('สั่งซื้อแล้วทักเพจ LrapX Store') && (
                <div className="mt-3 rounded-xl border border-[#d6b65d]/40 bg-[#d6b65d]/10 p-3 text-left text-sm leading-6">
                  <p className="font-semibold text-[#e7ca79]">ขั้นตอนรับ Robux</p>
                  <p>กรุณาแคปหน้ารายการสั่งซื้อนี้ แล้วส่งให้เพจ LrapX Store พร้อมแจ้ง Username Roblox</p>
                  <p className="mt-1 font-semibold">เวลาเปิดบริการ 16:30-22:00 น.</p>
                  <p className="text-xs text-muted-foreground">ไม่ต้องส่งรหัสผ่านหรือรหัส OTP ของบัญชี Roblox</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="flex-1 btn-neon" onClick={() => { closeAll(); navigate('/orders'); }}>
                <ReceiptText className="mr-1.5 h-4 w-4" /> ดูคำสั่งซื้อ
              </Button>
              <Button variant="outline" className="flex-1" onClick={closeAll}>ปิดหน้าต่าง</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">ยืนยันการสั่งซื้อ</DialogTitle>
              <DialogDescription>ตรวจสอบข้อมูลก่อนชำระเงิน — ระบบจะบันทึกประวัติทุกรายการ</DialogDescription>
            </DialogHeader>

            <div className="mt-2 rounded-xl border border-border bg-secondary/40 p-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground shrink-0">รายการ</span>
                <span className="font-medium text-right">{draft.items.length > 1 ? draft.items.length + ' รายการ' : draft.title}</span>
              </div>
              {draft.contact?.playerId && (
                <div className="flex justify-between"><span className="text-muted-foreground shrink-0">Player ID / ไอดีรับของ</span><span className="font-mono font-medium">{draft.contact.playerId}</span></div>
              )}
              {draft.contact?.robloxUsername && (
                <div className="flex justify-between"><span className="text-muted-foreground">ผู้รับบริการ</span><span className="font-medium">{draft.contact.robloxUsername}</span></div>
              )}
              <div className="flex justify-between border-t border-border pt-2">
                <span className="text-muted-foreground">ยอดชำระ</span>
                <span className="price-gold text-lg">{formatTHB(draft.price)}</span>
              </div>
            </div>

            {/* ข้อมูลผู้รับบริการ (เติมเกม) — กรอกได้เมื่อหน้าก่อนหน้ายังไม่ได้กรอก */}
            {draft.type !== 'GAME_ID' && !draft.contact?.playerId && !draft.contact?.robloxUsername && (
              <div className="space-y-2">
                <Label htmlFor="pid" className="text-sm">
                  {draft.type === 'TOPUP' && draft.requirePlayerId ? 'Player ID ที่จะรับการเติม *' : 'ข้อมูลเพิ่มเติม (ถ้ามี)'}
                </Label>
                <Input
                  id="pid"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  placeholder="เช่น 1234567890"
                  className="bg-secondary/60"
                />
              </div>
            )}

            {/* เลือกช่องทางชำระเงิน */}
            <div className="space-y-2">
              <Label className="text-sm">ช่องทางชำระเงิน</Label>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as 'WALLET' | 'BANK_TRANSFER')} className="grid grid-cols-1 gap-2">
                <label className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${payment === 'WALLET' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <RadioGroupItem value="WALLET" id="pay-wallet" />
                  <Wallet className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">กระเป๋าเงิน LrapX</div>
                    <div className="text-xs text-muted-foreground">ยอดคงเหลือ {formatTHB(user?.walletBalance ?? 0)}</div>
                  </div>
                </label>
                <label className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${payment === 'BANK_TRANSFER' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                  <RadioGroupItem value="BANK_TRANSFER" id="pay-bank" />
                  <CreditCard className="h-5 w-5 text-[#f0b429]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">โอนธนาคาร / TrueMoney</div>
                    <div className="text-xs text-muted-foreground">แนบสลิป รอแอดมินตรวจสอบ</div>
                  </div>
                </label>
              </RadioGroup>
              {insufficient && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>ยอดเงินในกระเป๋าไม่เพียงพอ — <button className="underline font-semibold cursor-pointer" onClick={() => { closeAll(); navigate('/deposit'); }}>เติมเงินเข้ากระเป๋า</button></span>
                </div>
              )}
            </div>

            {/* แนบสลิป */}
            {payment === 'BANK_TRANSFER' && (
              <div className="space-y-2">
                <Label className="text-sm">สลิปการโอนเงิน *</Label>
                <label className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 p-5 cursor-pointer hover:border-primary/60 transition-colors">
                  {slipUrl ? (
                    <img src={slipUrl} alt="สลิปที่แนบ" className="max-h-32 rounded-lg" />
                  ) : slipUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <ImagePlus className="h-7 w-7 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">PNG / JPG / WEBP ขนาดไม่เกิน 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadSlip(f);
                      e.target.value = '';
                    }}
                  />
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Upload className="h-3.5 w-3.5" /> {slipUrl ? 'เปลี่ยนสลิป' : 'เลือกไฟล์สลิป'}
                  </span>
                </label>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ord-note" className="text-sm">หมายเหตุถึงแอดมิน (ถ้ามี)</Label>
              <Textarea id="ord-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ขอเติมหลัง 18:00 น." className="bg-secondary/60 min-h-16" />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-rose-300">{error}</div>
            )}

            <Button
              className="w-full h-12 text-base btn-neon bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"
              disabled={submitting || insufficient}
              onClick={submit}
            >
              {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
              {submitting ? 'กำลังดำเนินการ...' : `ยืนยันสั่งซื้อ ${formatTHB(draft.price)}`}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              เมื่อยืนยันแล้วระบบจะสร้างเลขคำสั่งซื้อและบันทึกประวัติทันที หากมีปัญหาติดต่อแอดมินได้ตลอด 24 ชม.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Dialog แสดงรายละเอียดคำสั่งซื้อ (ใช้ในหน้าประวัติและโปรไฟล์) */
export function OrderDetailDialog({
  open, onOpenChange, order,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order: Order | null;
}) {
  if (!order) return null;
  const contact = order.contactInfo ? (JSON.parse(order.contactInfo) as Record<string, string>) : {};
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">คำสั่งซื้อ {order.orderNo}</DialogTitle>
          <DialogDescription>สร้างเมื่อ {new Date(order.createdAt).toLocaleString('th-TH')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-2">
            {order.items.map((it) => (
              <div key={it.id} className="flex justify-between gap-3">
                <div>
                  <div className="font-medium">{it.name}</div>
                  {it.product && <div className="text-xs font-mono text-muted-foreground">{it.product.code}</div>}
                </div>
                <div className="price-gold shrink-0">{formatTHB(it.price)}</div>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>ยอดรวม ({PAYMENT_METHOD[order.paymentMethod]})</span>
              <span className="price-gold">{formatTHB(order.total)}</span>
            </div>
          </div>
          {contact.playerId && <div><span className="text-muted-foreground">Player ID:</span> <span className="font-mono">{contact.playerId}</span></div>}
          {contact.robloxUsername && <div><span className="text-muted-foreground">ผู้รับบริการ:</span> <span className="font-medium">{contact.robloxUsername}</span></div>}
          {contact.note && <div><span className="text-muted-foreground">หมายเหตุลูกค้า:</span> {contact.note}</div>}
          {order.slipImage && (
            <div>
              <div className="text-muted-foreground mb-1">สลิปที่แนบ</div>
              <img src={order.slipImage} alt="สลิป" className="max-h-40 rounded-lg border border-border" />
            </div>
          )}
          {order.adminNote && (
            <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-200">
              <span className="font-semibold">ข้อความจากแอดมิน:</span> {order.adminNote}
            </div>
          )}
          {order.items.some((it) => it.deliveryInfo) && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
              <span className="font-semibold">ข้อมูลการส่งมอบ:</span>
              {order.items.filter((it) => it.deliveryInfo).map((it, i) => (
                <p key={i} className="mt-1 whitespace-pre-wrap">{it.deliveryInfo}</p>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
