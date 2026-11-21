#!/usr/bin/env python3
# สร้างไฟล์ HTML ตัวอย่าง LrapX Store (static preview) เปิดในมือถือได้ทันที
# โครงหน้าหลักใหม่: 2 หมวดหมู่ (ไอดีเกม/เติมเกม) + รีวิวเลื่อนวน + สินค้าแนะนำ + popup สมัคร/เข้าสู่ระบบ
import base64, io, json, os
from PIL import Image

ROOT = '/home/z/my-project'
IMG = os.path.join(ROOT, 'public/images')
OUT = os.path.join(ROOT, 'download/LrapX-Store-preview.html')

def img_b64(name, max_w, quality=80, as_png=False):
    p = os.path.join(IMG, name)
    im = Image.open(p)
    if im.width > max_w:
        h = int(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    buf = io.BytesIO()
    if as_png or im.mode in ('RGBA', 'P'):
        im = im.convert('RGBA')
        im.save(buf, 'PNG', optimize=True)
        mime = 'image/png'
    else:
        im = im.convert('RGB')
        im.save(buf, 'JPEG', quality=quality, optimize=True)
        mime = 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()

print('ประมวลผลรูป...')
logo  = img_b64('logo.png', 220, as_png=True)
hero  = img_b64('hero-banner.png', 900)
c_ff  = img_b64('cover-freefire.png', 700)
c_rb  = img_b64('cover-roblox.png', 700)
c_gp  = img_b64('cover-giftpass.png', 700)
p_ff1 = img_b64('prod-ff-1.png', 620)
p_ff2 = img_b64('prod-ff-2.png', 620)
p_rb1 = img_b64('prod-rb-1.png', 620)
p_rb2 = img_b64('prod-rb-2.png', 620)

S  = json.load(open('/tmp/lrapx-settings.json'))['settings']
PS = json.load(open('/tmp/lrapx-products.json'))
products = PS.get('products', PS if isinstance(PS, list) else [])
RV = json.load(open('/tmp/lrapx-reviews.json'))
reviews = RV.get('reviews', RV if isinstance(RV, list) else [])
GP = json.load(open('/tmp/pk3.json'))
gp_packages = GP.get('packages', [])[:6]  # สินค้าแนะนำ 6 ชิ้นแรก (ไก่ตัน, ผลโมจิตื่น, ...)

prod_imgs = [p_ff1, p_ff2, p_rb1, p_rb2]

def fmt(n): return f'{n:,.0f}'

def star_svg():
    return '<svg viewBox="0 0 24 24" fill="currentColor" class="st"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'

ICON = {
 'menu':'<path d="M4 6h16M4 12h16M4 18h16"/>',
 'x':'<path d="M18 6L6 18M6 6l12 12"/>',
 'search':'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
 'home':'<path d="M3 10.5L12 3l9 7.5"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
 'gamepad':'<path d="M6 12h4m-2-2v4m7-3h.01M17 9h.01"/><path d="M17.32 5H6.68a4 4 0 00-3.98 3.59c-.02.2-.02.4-.02.6L2 15a3 3 0 003 3c1.28 0 2.44-.8 2.9-2h10.2c.46 1.2 1.62 2 2.9 2a3 3 0 003-3l-.68-5.81A4 4 0 0017.32 5z"/>',
 'zap':'<path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z"/>',
 'wallet':'<path d="M21 12V7H5a2 2 0 010-4h14v4"/><path d="M3 5v14a2 2 0 002 2h16v-5"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/>',
 'user':'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
 'shield':'<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>',
 'timer':'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
 'gem':'<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M12 21L8 9l4-6 4 6-4 12"/>',
 'medal':'<circle cx="12" cy="15" r="6"/><path d="M8 10L6 2h12l-2 8M9 15l2 2 4-4"/>',
 'phone':'<path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.13 1 .37 2 .72 2.8a2 2 0 01-.45 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.45c.9.35 1.9.6 2.8.72A2 2 0 0122 16.9z"/>',
 'mail':'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/>',
 'chat':'<path d="M21 11.5a8.4 8.4 0 01-8.5 8.4 8.6 8.6 0 01-3.8-.9L3 21l1.9-5.6a8.4 8.4 0 01-.9-3.9A8.4 8.4 0 0112.5 3a8.4 8.4 0 018.5 8.5z"/>',
 'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
 'bag':'<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 016 0"/>',
 'eye':'<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
 'chev':'<path d="M9 6l6 6-6 6"/>',
 'check':'<circle cx="12" cy="12" r="9"/><path d="M8.5 12l2.5 2.5 5-5"/>',
 'sparkle':'<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z"/>',
 'bank':'<path d="M3 10h18M5 10V21M9 10V21M15 10V21M19 10V21M3 21h18M12 3l9 7H3l9-7z"/>',
 'login':'<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
 'lock':'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
 'gift':'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8c-2 0-4.5-.5-4.5-2.5S9.5 3 12 8zm0 0c2 0 4.5-.5 4.5-2.5S14.5 3 12 8z"/>',
}
def icon(k, cls='ic'):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="{cls}">{ICON[k]}</svg>'

TAG_TH = {'freefire': 'Free Fire', 'roblox': 'Roblox', 'giftpass': 'Gift Pass', 'general': 'รีวิวร้าน'}

# ===== แถบเลื่อนวน: รีวิว + สินค้าที่มีคนซื้อ (สลับกัน) =====
strip_items = []
for i in range(8):
    if i < len(reviews):
        strip_items.append(('rev', reviews[i]))
    if i < len(products) and products[i].get('soldCount', 0) > 0:
        strip_items.append(('prod', products[i]))

def strip_card(kind, item, idx):
    if kind == 'rev':
        tag = TAG_TH.get(item.get('gameTag', ''), 'รีวิวร้าน')
        return f'''
      <div class="mcard">
        <div class="mrev">
          <div class="mrev-head"><span class="ava">{item["name"][:1]}</span>
            <div><b>{item["name"]}</b><div class="stars">{''.join(star_svg()*item.get('rating',5))}</div></div></div>
          <p>&ldquo;{item["comment"]}&rdquo;</p>
          <span class="mchip">{tag}</span>
        </div>
      </div>'''
    img = prod_imgs[idx % len(prod_imgs)]
    return f'''
      <div class="mcard">
        <button class="mprod" onclick="showToast('ไฟล์ตัวอย่าง — หน้าสินค้าจริงอยู่ในเว็บไซต์จริง (ไฟล์ ZIP)')">
          <div class="mprod-img"><img src="{img}" alt="{item['title']}">
            <span class="mbuy">{icon('bag','ic2')} มีคนซื้อแล้ว {item['soldCount']} ชิ้น</span></div>
          <div class="mprod-body"><h4>{item['title']}</h4><div class="price">฿{fmt(item['price'])}</div></div>
        </button>
      </div>'''

strip_html = ''.join(strip_card(k, it, i) for i, (k, it) in enumerate(strip_items))
# ทำซ้ำ 2 ชุดเพื่อให้เลื่อนวนไม่มีรอยต่อ
marquee_html = strip_html + strip_html

# ===== สินค้าแนะนำ 6 ชิ้น (ไก่ตัน, ผลโมจิตื่น, ...) =====
rec_html = ''
for p in gp_packages:
    badge = f'<span class="rbadge">{p["badge"]}</span>' if p.get('badge') else ''
    rec_html += f'''
    <div class="rec">
      <div class="rec-top"><span class="fico">{icon('gift','ic2')}</span>{badge}</div>
      <h3>{p['name']}</h3>
      <div class="rec-price">฿{fmt(p['price'])}</div>
      <a class="btn1 sm" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — สั่งซื้อจริงอยู่ในเว็บไซต์จริง (ไฟล์ ZIP)');return false;">สั่งของได้เลย</a>
    </div>'''

# ===== หมวดหมู่ไอดีเกม =====
cat_html = f'''
<a class="cat" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — หน้าไอดีเกมจริงอยู่ในเว็บไซต์จริง');return false;">
  <img src="{c_ff}" alt="ไอดีเกม Free Fire"><div class="cat-ov"><h3>ไอดีเกม Free Fire</h3>
  <p>ไอดีสำเร็จรูป ส่งไว มีประกัน 7 วัน</p><span class="cat-btn">ดูไอดีทั้งหมด {icon('chev','ic2')}</span></div></a>
<a class="cat" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — หน้าไอดีเกมจริงอยู่ในเว็บไซต์จริง');return false;">
  <img src="{c_rb}" alt="ไอดีเกม Roblox"><div class="cat-ov"><h3>ไอดีเกม Roblox</h3>
  <p>ไอดีหายาก ของลิมิเต็ด ประวัติสะอาด</p><span class="cat-btn">ดูไอดีทั้งหมด {icon('chev','ic2')}</span></div></a>'''

# ===== หมวดหมู่ย่อยเติมเกม (3 หมวด เหมือนไอดีเกม) =====
topup_html = f'''
<a class="tcard" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — หน้าเติมเกมจริงอยู่ในเว็บไซต์จริง');return false;">
  <div class="tcard-img"><img src="{c_ff}" alt="เติมเกม Free Fire"></div>
  <div class="tcard-body"><h3>{icon('zap','ic2')} เติมเกม Free Fire</h3>
  <p>เพชร สมาชิกรายสัปดาห์/รายเดือน ส่งตรงผ่าน Player ID</p>
  <span class="cat-btn">เริ่มเติมเลย {icon('chev','ic2')}</span></div></a>
<a class="tcard" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — หน้าเติมเกมจริงอยู่ในเว็บไซต์จริง');return false;">
  <div class="tcard-img"><img src="{c_rb}" alt="เติมเกม Roblox"></div>
  <div class="tcard-body"><h3>{icon('gem','ic2')} เติมเกม Roblox</h3>
  <p>Robux และสมาชิก Premium รับเองในเกมผ่านระบบ Gamepass</p>
  <span class="cat-btn">เริ่มเติมเลย {icon('chev','ic2')}</span></div></a>
<a class="tcard" href="#top" onclick="showToast('ไฟล์ตัวอย่าง — หน้าเติมเกมจริงอยู่ในเว็บไซต์จริง');return false;">
  <div class="tcard-img"><img src="{c_gp}" alt="Gift Game Pass"></div>
  <div class="tcard-body"><h3>{icon('gift','ic2')} Gift Game Pass</h3>
  <p>ไก่ตัน, ผลโมจิตื่น, Game Pass เด็ด ๆ ส่งโค้ดทางแชท</p>
  <span class="cat-btn">เริ่มเติมเลย {icon('chev','ic2')}</span></div></a>'''

notice = 'ไฟล์ตัวอย่างดีไซน์ (เปิดดูได้ทันที) — เว็บใช้งานจริงและระบบสั่งซื้อจริง ดูได้จาก Preview Panel หรือไฟล์ ZIP ที่แนบไว้'

html = f'''<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>LrapX Store — ตัวอย่างหน้าเว็บ</title>
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {{ --bg:#0b0b12; --bg2:#131322; --card:#171728; --line:#262640; --tx:#e9e7f6; --mut:#9d9ab8;
 --vio:#a855f7; --vio2:#c084fc; --gold:#f5c451; --ok:#4ade80; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html {{ scroll-behavior:smooth; }}
body {{ background:#060610; color:var(--tx); font-family:'Kanit',sans-serif; }}
.wrap {{ max-width:520px; margin:0 auto; background:var(--bg); min-height:100vh; box-shadow:0 0 60px rgba(168,85,247,.15); position:relative; }}
img {{ display:block; max-width:100%; }}
a {{ color:inherit; text-decoration:none; }}
.ic {{ width:22px; height:22px; }} .ic2 {{ width:16px; height:16px; }}
.st {{ width:14px; height:14px; color:var(--gold); }}

/* ป้ายแจ้ง */
.announce {{ background:linear-gradient(90deg,#241338,#3a1a5c); color:var(--gold); font-size:13px;
 padding:9px 14px; display:flex; gap:8px; align-items:center; }}

/* header */
header {{ position:sticky; top:0; z-index:50; background:rgba(11,11,18,.92); backdrop-filter:blur(10px);
 border-bottom:1px solid var(--line); padding:12px 14px; display:flex; align-items:center; gap:10px; }}
.hbtn {{ width:42px; height:42px; border-radius:12px; border:1px solid var(--line); background:var(--card);
 display:flex; align-items:center; justify-content:center; color:var(--tx); flex:0 0 auto; }}
.hbtn:active {{ background:var(--vio); }}
.logo-img {{ width:44px; height:40px; object-fit:contain; filter:drop-shadow(0 0 8px rgba(245,196,81,.45)); }}
.logo-name {{ display:flex; flex-direction:column; line-height:1.15; }}
.logo-name .l1 {{ font-weight:800; font-size:17px; letter-spacing:.5px; color:var(--gold); text-shadow:0 0 12px rgba(245,196,81,.4); }}
.logo-name .l1 b {{ color:#fff; text-shadow:none; }}
.logo-name .l2 {{ font-size:9.5px; letter-spacing:2px; color:var(--mut); }}
.hspace {{ flex:1; }}

/* notice */
.notice {{ background:#16102a; border-bottom:1px solid var(--line); color:var(--vio2); font-size:12.5px;
 padding:8px 14px; display:flex; gap:8px; align-items:center; }}

/* hero */
.hero {{ position:relative; padding:44px 22px 40px; overflow:hidden; }}
.hero-bg {{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:.55; }}
.hero-ov {{ position:absolute; inset:0; background:linear-gradient(180deg,rgba(11,11,18,.55),rgba(11,11,18,.92) 88%); }}
.hero-in {{ position:relative; }}
.badge {{ display:inline-flex; gap:8px; align-items:center; color:var(--gold); border:1px solid rgba(245,196,81,.45);
 background:rgba(20,14,4,.75); border-radius:999px; padding:8px 16px; font-size:13.5px; margin-bottom:18px; }}
.hero h1 {{ font-size:34px; line-height:1.22; font-weight:800; }}
.hero h1 .glow {{ color:var(--vio2); text-shadow:0 0 18px rgba(168,85,247,.85),0 0 46px rgba(168,85,247,.45); }}
.hero h1 .white {{ color:#fff; }}
.hero p {{ color:var(--mut); margin-top:12px; font-size:15px; line-height:1.6; }}
.ctas {{ display:flex; gap:12px; margin-top:22px; flex-wrap:wrap; }}
.btn1 {{ display:inline-flex; gap:8px; align-items:center; justify-content:center; padding:12px 20px; border-radius:14px;
 font-weight:600; font-size:14.5px; background:linear-gradient(135deg,#9333ea,#d946ef); color:#fff;
 box-shadow:0 6px 22px rgba(168,85,247,.45); border:none; }}
.btn1:active {{ transform:scale(.97); }}
.btn2 {{ display:inline-flex; gap:8px; align-items:center; justify-content:center; padding:12px 18px; border-radius:14px;
 font-weight:600; font-size:14.5px; background:#151222; color:var(--gold); border:1px solid var(--line); }}
.btn1.sm {{ padding:9px 16px; font-size:13.5px; border-radius:11px; }}

/* features */
.feats {{ display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:0 16px; margin-top:6px; }}
.feat {{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; display:flex; gap:12px; align-items:center; }}
.feat .fico {{ width:44px; height:44px; flex:0 0 auto; border-radius:13px; background:linear-gradient(135deg,#3b1d6e,#2a1650);
 display:flex; align-items:center; justify-content:center; color:var(--vio2); box-shadow:0 0 12px rgba(168,85,247,.35); }}
.feat b {{ font-size:14.5px; display:block; }}
.feat span {{ color:var(--mut); font-size:12px; }}

/* sections */
section {{ padding:30px 16px 4px; }}
.sec-head {{ display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }}
.sec-head h2 {{ font-size:21px; font-weight:700; }}
.sec-head h2::before {{ content:''; display:inline-block; width:5px; height:20px; border-radius:3px; margin-right:10px;
 background:linear-gradient(#c084fc,#7c3aed); vertical-align:-3px; }}
.sec-head a {{ color:var(--vio2); font-size:13.5px; display:flex; gap:2px; align-items:center; }}
.sec-sub {{ color:var(--mut); font-size:12.5px; margin:-8px 0 14px; }}

/* categories (ไอดีเกม) */
.cats {{ display:grid; gap:14px; }}
.cat {{ position:relative; border-radius:18px; overflow:hidden; border:1px solid var(--line); min-height:120px; }}
.cat img {{ width:100%; height:150px; object-fit:cover; }}
.cat-ov {{ position:absolute; inset:0; background:linear-gradient(90deg,rgba(8,6,16,.88) 30%,rgba(8,6,16,.25));
 padding:18px; display:flex; flex-direction:column; justify-content:center; gap:6px; }}
.cat-ov h3 {{ font-size:19px; }}
.cat-ov p {{ color:var(--mut); font-size:12.5px; }}
.cat-btn {{ margin-top:8px; display:inline-flex; gap:6px; align-items:center; color:var(--vio2); font-size:13px; font-weight:600; }}

/* หมวดหมู่ย่อยเติมเกม */
.tcards {{ display:grid; gap:14px; }}
.tcard {{ background:var(--card); border:1px solid var(--line); border-radius:18px; overflow:hidden; }}
.tcard-img img {{ width:100%; height:110px; object-fit:cover; }}
.tcard-body {{ padding:14px 16px 16px; }}
.tcard-body h3 {{ font-size:16.5px; display:flex; gap:8px; align-items:center; }}
.tcard-body h3 .ic2 {{ color:var(--vio2); }}
.tcard-body p {{ color:var(--mut); font-size:12.5px; margin-top:4px; line-height:1.55; }}

/* แถบเลื่อนวน (marquee) */
.marquee {{ overflow:hidden; -webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);
 mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent); }}
.marquee-track {{ display:flex; width:max-content; animation:marqueeX 55s linear infinite; padding:4px 0; }}
.marquee-track:hover {{ animation-play-state:paused; }}
@keyframes marqueeX {{ from {{ transform:translateX(0); }} to {{ transform:translateX(-50%); }} }}
.mcard {{ width:270px; flex:0 0 auto; padding-right:14px; }}
.mrev {{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px; height:100%; }}
.mrev-head {{ display:flex; gap:10px; align-items:center; margin-bottom:8px; }}
.ava {{ width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#7c3aed,#d946ef);
 display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff; }}
.mrev b {{ font-size:14px; }} .stars {{ display:flex; gap:2px; }}
.mrev p {{ color:var(--mut); font-size:12.5px; line-height:1.55; }}
.mchip {{ margin-top:8px; display:inline-block; font-size:10.5px; padding:3px 10px; border-radius:999px;
 color:var(--vio2); background:rgba(168,85,247,.12); border:1px solid rgba(168,85,247,.35); }}
.mprod {{ width:100%; background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden;
 text-align:left; color:var(--tx); height:100%; cursor:pointer; }}
.mprod-img {{ position:relative; }}
.mprod-img img {{ width:100%; height:76px; object-fit:cover; }}
.mbuy {{ position:absolute; top:6px; left:6px; display:inline-flex; gap:4px; align-items:center; font-size:10px;
 padding:3px 9px; border-radius:999px; background:rgba(6,20,10,.85); color:var(--ok); border:1px solid rgba(74,222,128,.4); }}
.mprod-body {{ padding:10px 12px 12px; }}
.mprod-body h4 {{ font-size:12.5px; font-weight:500; line-height:1.4; }}
.mprod-body .price {{ color:var(--gold); font-weight:700; font-size:15px; margin-top:5px; }}

/* สินค้าแนะนำ */
.recgrid {{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }}
.rec {{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:14px 12px 12px; }}
.rec-top {{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }}
.rec .fico {{ width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#3b1d6e,#2a1650);
 display:flex; align-items:center; justify-content:center; color:var(--vio2); box-shadow:0 0 10px rgba(168,85,247,.3); }}
.rec .fico .ic2 {{ width:18px; height:18px; }}
.rbadge {{ font-size:10px; padding:3px 9px; border-radius:999px; color:var(--gold);
 background:rgba(69,26,3,.9); border:1px solid rgba(245,196,81,.4); font-weight:600; }}
.rec h3 {{ font-size:13.5px; line-height:1.4; min-height:37px; }}
.rec-price {{ color:var(--gold); font-weight:700; font-size:16px; margin:6px 0 10px; }}
.rec .btn1.sm {{ width:100%; justify-content:center; }}

/* footer */
footer {{ margin-top:34px; background:#0d0d17; border-top:1px solid var(--line); padding:26px 18px 96px; }}
.f-logo {{ display:flex; gap:12px; align-items:center; margin-bottom:12px; }}
.f-logo img {{ width:54px; }}
.f-logo h3 {{ color:var(--gold); letter-spacing:1px; font-size:19px; }}
.f-logo p {{ color:var(--mut); font-size:12px; }}
footer .desc {{ color:var(--mut); font-size:13px; line-height:1.65; margin-bottom:16px; }}
.f-grid {{ display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }}
.f-item {{ display:flex; gap:9px; align-items:center; color:var(--mut); font-size:12.5px; }}
.f-item .ic2 {{ color:var(--vio2); flex:0 0 auto; }}
.f-menu {{ margin-top:18px; padding-top:16px; border-top:1px solid var(--line); display:grid; grid-template-columns:1fr 1fr; gap:9px; }}
.f-menu a {{ color:var(--mut); font-size:13px; }}
.f-menu a b {{ color:var(--tx); }}
.copy {{ margin-top:20px; color:#6d6a88; font-size:11.5px; text-align:center; }}

/* sidebar */
.side {{ position:fixed; inset:0; z-index:100; visibility:hidden; }}
.side.open {{ visibility:visible; }}
.side-ov {{ position:absolute; inset:0; background:rgba(0,0,0,.6); opacity:0; transition:.25s; }}
.side.open .side-ov {{ opacity:1; }}
.side-panel {{ position:absolute; top:0; bottom:0; left:0; width:290px; background:#12101f; border-right:1px solid var(--line);
 transform:translateX(-100%); transition:.28s; padding:18px 14px; max-width:82vw; display:flex; flex-direction:column; }}
.side.open .side-panel {{ transform:none; }}
.sp-head {{ display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }}
.sp-head img {{ width:48px; }}
.sp-scroll {{ flex:1; overflow-y:auto; }}
.sp-item {{ display:flex; gap:12px; align-items:center; padding:13px 12px; border-radius:13px; color:var(--tx); font-size:14.5px; }}
.sp-item .ic2 {{ color:var(--vio2); width:18px; height:18px; }}
.sp-item.active, .sp-item:hover {{ background:linear-gradient(90deg,rgba(168,85,247,.18),transparent); }}
.sp-auth {{ margin-top:14px; display:grid; gap:10px; }}
.sp-foot {{ margin-top:auto; border:1px solid var(--line); background:rgba(255,255,255,.035);
 border-radius:13px; padding:13px; text-align:center; }}
.sp-foot p {{ font-size:11.5px; color:var(--mut); line-height:1.55; margin-bottom:10px; }}

/* popup หน้าต่างย่อย (สมัครสมาชิก / เข้าสู่ระบบ) */
.pmodal {{ position:fixed; inset:0; z-index:200; visibility:hidden; }}
.pmodal.open {{ visibility:visible; }}
.pm-ov {{ position:absolute; inset:0; background:rgba(0,0,0,.75); opacity:0; transition:.25s; }}
.pmodal.open .pm-ov {{ opacity:1; }}
.pm-card {{ position:absolute; left:0; right:0; bottom:0; margin:0 auto; max-width:520px; background:#0e0e1a;
 border:1px solid rgba(168,85,247,.4); border-radius:22px 22px 0 0; padding:0 0 26px; max-height:92vh; overflow-y:auto;
 transform:translateY(100%); transition:.3s; box-shadow:0 -10px 60px rgba(168,85,247,.3); }}
.pmodal.open .pm-card {{ transform:none; }}
.pm-head {{ position:sticky; top:0; background:#131222; display:flex; align-items:center; justify-content:space-between;
 padding:13px 16px; border-bottom:1px solid var(--line); border-radius:22px 22px 0 0; }}
.pm-head b {{ font-size:15px; }}
.pm-handle {{ width:40px; height:4px; border-radius:99px; background:var(--line); position:absolute; left:50%;
 transform:translateX(-50%); top:6px; }}
.pm-x {{ width:34px; height:34px; border-radius:10px; border:1px solid var(--line); background:var(--card);
 color:var(--mut); display:flex; align-items:center; justify-content:center; }}
.pm-body {{ padding:18px 20px 0; }}

/* การ์ดฟอร์ม auth (ใช้ใน popup) */
.auth-card {{ width:100%; max-width:420px; margin:0 auto; background:rgba(23,23,40,.92); border:1px solid rgba(168,85,247,.4);
 border-radius:20px; padding:24px 18px 20px; box-shadow:0 0 46px rgba(168,85,247,.18); }}
.auth-ico {{ width:56px; height:56px; border-radius:16px; background:rgba(168,85,247,.16); color:var(--vio2);
 display:flex; align-items:center; justify-content:center; margin:0 auto 14px;
 box-shadow:0 0 20px rgba(168,85,247,.45); }}
.auth-ico .ic {{ width:26px; height:26px; }}
.auth-card h1 {{ text-align:center; font-size:22px; font-weight:700; }}
.auth-card .sub {{ text-align:center; color:var(--mut); font-size:13px; margin:7px 0 20px; }}
.field {{ margin-bottom:14px; }}
.field label {{ display:block; font-size:13px; margin-bottom:7px; }}
.field input {{ width:100%; height:46px; border-radius:12px; border:1px solid var(--line); background:#10101d;
 color:var(--tx); padding:0 14px; font-family:inherit; font-size:14px; }}
.field input::placeholder {{ color:#5c5978; }}
.field input:focus {{ outline:none; border-color:var(--vio); box-shadow:0 0 0 2px rgba(168,85,247,.28); }}
.btn1.wide {{ width:100%; height:48px; font-size:15px; margin-top:4px; }}
.auto-note {{ margin-top:14px; display:flex; gap:7px; align-items:center; justify-content:center;
 font-size:12px; color:var(--ok); background:rgba(74,222,128,.08); border:1px solid rgba(74,222,128,.3);
 border-radius:11px; padding:10px 12px; }}
.auto-note .ic2 {{ color:var(--ok); flex:0 0 auto; }}
.auth-links {{ display:flex; justify-content:space-between; align-items:center; margin-top:16px; font-size:13px; }}
.auth-links a {{ color:var(--vio2); font-weight:600; cursor:pointer; }}
.auth-links .mut {{ color:var(--mut); }}
.demo-box {{ margin-top:16px; border:1px solid var(--line); background:rgba(255,255,255,.035);
 border-radius:12px; padding:12px 14px; font-size:12px; color:var(--mut); line-height:1.75; }}
.demo-box b {{ color:var(--tx); }}
.secure-note {{ margin-top:16px; display:flex; gap:6px; align-items:center; justify-content:center;
 font-size:11.5px; color:var(--mut); }}
.secure-note .ic2 {{ color:var(--ok); }}

/* toast */
.toast {{ position:fixed; left:50%; bottom:96px; transform:translateX(-50%) translateY(16px);
 background:#221540; border:1px solid var(--vio); color:var(--tx); padding:12px 18px; border-radius:14px;
 font-size:13px; line-height:1.5; opacity:0; pointer-events:none; transition:.3s; z-index:300;
 max-width:88vw; text-align:center; box-shadow:0 8px 30px rgba(0,0,0,.5); }}
.toast.show {{ opacity:1; transform:translateX(-50%) translateY(0); }}

/* bottom nav */
.bnav {{ position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:520px; z-index:60;
 background:rgba(13,13,23,.96); backdrop-filter:blur(12px); border-top:1px solid var(--line);
 display:flex; padding:8px 6px calc(8px + env(safe-area-inset-bottom)); }}
.bnav a {{ flex:1; display:flex; flex-direction:column; align-items:center; gap:3px; color:var(--mut); font-size:10.5px; padding:4px 0; }}
.bnav a.active {{ color:var(--vio2); }}
.bnav a.active .ic {{ filter:drop-shadow(0 0 6px rgba(168,85,247,.8)); }}
.bnav .ic {{ width:20px; height:20px; }}
@media (min-width:521px) {{ body {{ padding:24px 0; }} }}
@media (prefers-reduced-motion:reduce) {{ .marquee-track {{ animation:none; }} .marquee {{ overflow-x:auto; }} }}
</style>
</head>
<body>
<div class="wrap" id="top">

  <div class="announce">{icon('chat','ic2')} {S['announcement']}</div>

  <header>
    <button class="hbtn" id="menuBtn" aria-label="เปิดเมนู">{icon('menu')}</button>
    <a class="logo-link" href="#top" style="display:flex;align-items:center;gap:9px">
      <img class="logo-img" src="{logo}" alt="โลโก้ LrapX Store">
      <span class="logo-name"><span class="l1">LRAPX <b>STORE</b></span><span class="l2">GAME ID &amp; TOP-UP CENTER</span></span>
    </a>
    <span class="hspace"></span>
    <a class="hbtn" href="#categories" aria-label="ค้นหา">{icon('search')}</a>
  </header>

  <div class="notice">{icon('sparkle','ic2')} {notice}</div>

  <div class="hero">
    <img class="hero-bg" src="{hero}" alt="">
    <div class="hero-ov"></div>
    <div class="hero-in">
      <span class="badge">{icon('shield','ic2')} ร้านเกมมืออาชีพชั้นนำของคนไทย</span>
      <h1><span class="glow">{S['hero_title']}</span><br><span class="white">LrapX Store จัดให้ครบ</span></h1>
      <p>{S['hero_subtitle']}</p>
      <div class="ctas">
        <a class="btn1" href="#categories">{icon('gamepad','ic2')} ดูสินค้าไอดีเกม</a>
        <a class="btn2" href="#topups">{icon('zap','ic2')} เติมเกมเลย</a>
      </div>
    </div>
  </div>

  <div class="feats">
    <div class="feat"><span class="fico">{icon('timer')}</span><div><b>ส่งไว 5-10 นาที</b><span>ทำรายการอัตโนมัติ 24 ชม.</span></div></div>
    <div class="feat"><span class="fico">{icon('shield')}</span><div><b>ปลอดภัย 100%</b><span>ระบบจ่ายเงินมาตรฐาน</span></div></div>
    <div class="feat"><span class="fico">{icon('medal')}</span><div><b>ประกันโอ๊ส 7 วัน</b><span>ยืนยันตัวตนทุกไอดีก่อนส่ง</span></div></div>
    <div class="feat"><span class="fico">{icon('gem')}</span><div><b>ราคาสุดคุ้มค่า</b><span>ส่งล็อตทุกแพ็กเพิ่มฟรี</span></div></div>
  </div>

  <section id="categories">
    <div class="sec-head"><h2>หมวดหมู่ไอดีเกม</h2></div>
    <p class="sec-sub">ไอดีสำเร็จรูปพร้อมขาย ตรวจสอบทุกไอดีก่อนส่งมอบ</p>
    <div class="cats">{cat_html}</div>
  </section>

  <section id="topups">
    <div class="sec-head"><h2>หมวดหมู่เติมเกม</h2></div>
    <p class="sec-sub">เลือกหมวดย่อยที่ต้องการ — เติมเพชร FF, Robux และ Gift Game Pass ส่งไวใน 5 นาที</p>
    <div class="tcards">{topup_html}</div>
  </section>

  <section id="reviews">
    <div class="sec-head"><h2>รีวิวจากลูกค้า</h2></div>
    <p class="sec-sub">ความเห็นจริงจากผู้ใช้ พร้อมสินค้าที่ลูกค้าซื้อไปแล้ว — เลื่อนวนไปเรื่อย ๆ</p>
    <div class="marquee">
      <div class="marquee-track">{marquee_html}</div>
    </div>
  </section>

  <section id="recommended">
    <div class="sec-head"><h2>สินค้าแนะนำ</h2></div>
    <p class="sec-sub">ของเกมยอดฮิตอย่าง ไก่ตัน, ผลโมจิตื่น, ผลมังกรตื่น และอื่น ๆ — จ่ายง่าย ส่งไว มีประกัน</p>
    <div class="recgrid">{rec_html}</div>
  </section>

  <footer>
    <div class="f-logo"><img src="{logo}" alt="LrapX Store"><div><h3>LRAPX STORE</h3><p>{S['store_tagline']}</p></div></div>
    <p class="desc">ศูนย์รวมไอดีเกมคุณภาพและบริการเติมเกมราคาดี ส่งไวในไม่กี่นาที พร้อมระบบชำระเงินที่ปลอดภัย มีประกันทุกไอดี 7 วันเต็ม</p>
    <div class="f-grid">
      <span class="f-item">{icon('chat','ic2')} {S['contact_line']}</span>
      <span class="f-item">{icon('phone','ic2')} {S['contact_phone']}</span>
      <span class="f-item">{icon('mail','ic2')} {S['contact_email']}</span>
      <span class="f-item">{icon('clock','ic2')} {S['contact_hours']}</span>
    </div>
    <div class="f-menu">
      <a href="#top"><b>เมนูลัด</b></a><a href="#categories">หมวดหมู่ไอดีเกม</a>
      <a href="#topups">เติมเกมออนไลน์</a><a href="#recommended">สินค้าแนะนำ</a>
      <a href="#reviews">รีวิวลูกค้า</a><a href="#top">ติดต่อร้านค้า</a>
    </div>
    <p class="copy">© 2026 LrapX Store — ไฟล์ตัวอย่างดีไซน์สำหรับเปิดดูบนมือถือ</p>
  </footer>

  <nav class="bnav">
    <a href="#top" class="active">{icon('home')}<span>หน้าหลัก</span></a>
    <a href="#categories">{icon('gamepad')}<span>ไอดีเกม</span></a>
    <a href="#topups">{icon('zap')}<span>เติมเกม</span></a>
    <a href="#recommended">{icon('gift')}<span>แนะนำ</span></a>
    <a href="#top" id="bnavProfile">{icon('user')}<span>โปรไฟล์</span></a>
  </nav>

  <div class="side" id="side">
    <div class="side-ov" id="sideOv"></div>
    <div class="side-panel">
      <div class="sp-head">
        <a href="#top" style="display:flex;align-items:center;gap:9px">
          <img src="{logo}" alt="LrapX Store">
          <span class="logo-name"><span class="l1">LRAPX <b>STORE</b></span></span>
        </a>
        <button class="hbtn" id="sideClose" aria-label="ปิดเมนู">{icon('x')}</button>
      </div>
      <div class="sp-scroll">
        <a class="sp-item active" href="#top">{icon('home','ic2')} หน้าหลัก</a>
        <a class="sp-item" href="#categories">{icon('gamepad','ic2')} หมวดหมู่ไอดีเกม</a>
        <a class="sp-item" href="#topups">{icon('zap','ic2')} หมวดหมู่เติมเกม</a>
        <a class="sp-item" href="#recommended">{icon('gift','ic2')} สินค้าแนะนำ</a>
        <a class="sp-item" href="#reviews">{icon('chat','ic2')} รีวิวจากลูกค้า</a>
        <a class="sp-item" href="#top">{icon('clock','ic2')} ติดต่อร้านค้า</a>
        <div class="sp-auth">
          <a class="btn1" href="#top" data-popup="register">{icon('user','ic2')} สมัครสมาชิกฟรี</a>
          <a class="btn2" href="#top" data-popup="login" style="justify-content:center">{icon('login','ic2')} เข้าสู่ระบบ</a>
        </div>
      </div>
      <div class="sp-foot">
        <p>สมัครสมาชิกเพื่อรับสิทธิพิเศษและบันทึกประวัติการซื้อ</p>
        <a class="btn1 sm" href="#top" data-popup="register" style="justify-content:center">{icon('user','ic2')} สมัครสมาชิกฟรี</a>
      </div>
    </div>
  </div>

  <!-- หน้าต่างย่อย: สมัครสมาชิก -->
  <div class="pmodal" id="pmRegister">
    <div class="pm-ov" data-close="1"></div>
    <div class="pm-card">
      <div class="pm-head"><span class="pm-handle"></span><b>สมัครสมาชิก</b><button class="pm-x" data-close="1" aria-label="ปิดหน้าต่าง">{icon('x','ic2')}</button></div>
      <div class="pm-body">
        <div class="auth-card">
          <div class="auth-ico">{icon('user')}</div>
          <h1>สมัครสมาชิก</h1>
          <p class="sub">สมัครฟรี พร้อมรับส่วนลดคำสั่งซื้อแรก</p>
          <form data-demo="นี่คือไฟล์ตัวอย่างดีไซน์ — ระบบสมัครสมาชิกจริงทำงานบนเว็บไซต์จริง (ไฟล์ ZIP)">
            <div class="field"><label>ชื่อผู้ใช้</label><input placeholder="a-z 0-9 _ ยาว 3-20 ตัว" autocomplete="username"></div>
            <div class="field"><label>อีเมล</label><input type="email" placeholder="you@example.com" autocomplete="email"></div>
            <div class="field"><label>รหัสผ่าน</label><input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" autocomplete="new-password"></div>
            <div class="field"><label>ยืนยันรหัสผ่าน</label><input type="password" placeholder="พิมพ์รหัสผ่านเดียวกันอีกครั้ง" autocomplete="new-password"></div>
            <button class="btn1 wide" type="submit">{icon('user','ic2')} สมัครสมาชิก</button>
          </form>
          <div class="auto-note">{icon('check','ic2')} สมัครเสร็จระบบจะพาเข้าสู่ระบบให้อัตโนมัติทันที</div>
          <div class="auth-links"><span class="mut">มีบัญชีอยู่แล้ว?</span><a data-popup="login">เข้าสู่ระบบ</a></div>
        </div>
        <div class="secure-note">{icon('lock','ic2')} รหัสผ่านของคุณถูกเข้ารหัสอย่างปลอดภัย</div>
      </div>
    </div>
  </div>

  <!-- หน้าต่างย่อย: เข้าสู่ระบบ -->
  <div class="pmodal" id="pmLogin">
    <div class="pm-ov" data-close="1"></div>
    <div class="pm-card">
      <div class="pm-head"><span class="pm-handle"></span><b>เข้าสู่ระบบ</b><button class="pm-x" data-close="1" aria-label="ปิดหน้าต่าง">{icon('x','ic2')}</button></div>
      <div class="pm-body">
        <div class="auth-card">
          <div class="auth-ico">{icon('login')}</div>
          <h1>เข้าสู่ระบบ</h1>
          <p class="sub">ใช้อีเมลหรือชื่อผู้ใช้เพื่อเข้าใช้งาน LrapX Store</p>
          <form data-demo="นี่คือไฟล์ตัวอย่างดีไซน์ — ระบบเข้าสู่ระบบจริงทำงานบนเว็บไซต์จริง (ไฟล์ ZIP)">
            <div class="field"><label>อีเมลหรือชื่อผู้ใช้</label><input placeholder="you@example.com หรือ yourname" autocomplete="username"></div>
            <div class="field"><label>รหัสผ่าน</label><input type="password" placeholder="รหัสผ่านของคุณ" autocomplete="current-password"></div>
            <button class="btn1 wide" type="submit">{icon('login','ic2')} เข้าสู่ระบบ</button>
          </form>
          <div class="auth-links"><a data-popup="register"><b>สมัครสมาชิกใหม่</b></a></div>
          <div class="demo-box"><b>บัญชีทดลอง:</b> demo@lrapx.store / Demo1234<br><b>บัญชีแอดมิน:</b> admin@lrapx.store / Admin@LrapX2024</div>
        </div>
        <div class="secure-note">{icon('lock','ic2')} รหัสผ่านของคุณถูกเข้ารหัสอย่างปลอดภัย</div>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
</div>

<script>
const side = document.getElementById('side');
document.getElementById('menuBtn').onclick = () => side.classList.add('open');
document.getElementById('sideClose').onclick = () => side.classList.remove('open');
document.getElementById('sideOv').onclick = () => side.classList.remove('open');
document.querySelectorAll('.sp-item').forEach(a => a.onclick = () => side.classList.remove('open'));

// ===== หน้าต่างย่อย (popup): สมัครสมาชิก / เข้าสู่ระบบ =====
function openPopup(name) {{
  side.classList.remove('open');
  closePopups();
  const id = 'pm' + name.charAt(0).toUpperCase() + name.slice(1);
  document.getElementById(id).classList.add('open');
}}
function closePopups() {{
  document.getElementById('pmRegister').classList.remove('open');
  document.getElementById('pmLogin').classList.remove('open');
}}
document.querySelectorAll('[data-popup]').forEach(el => el.addEventListener('click', e => {{
  e.preventDefault();
  openPopup(el.getAttribute('data-popup'));
}}));
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', closePopups));
document.getElementById('bnavProfile').addEventListener('click', e => {{
  e.preventDefault();
  openPopup('login');
}});
document.addEventListener('keydown', e => {{ if (e.key === 'Escape') closePopups(); }});

// ===== toast แจ้งไฟล์ตัวอย่าง =====
const toastEl = document.getElementById('toast');
function showToast(msg) {{
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastEl._h);
  toastEl._h = setTimeout(() => toastEl.classList.remove('show'), 3200);
}}
document.querySelectorAll('form[data-demo]').forEach(f => f.addEventListener('submit', e => {{
  e.preventDefault();
  showToast(f.getAttribute('data-demo'));
}}));

// ===== bottom nav active state =====
document.querySelectorAll('.bnav a').forEach(a => a.addEventListener('click', () => {{
  if (a.id === 'bnavProfile') return;
  document.querySelectorAll('.bnav a').forEach(x => x.classList.remove('active'));
  a.classList.add('active');
}}));
</script>
</body>
</html>'''

with open(OUT, 'w', encoding='utf-8') as f:
    f.write(html)
print('เขียนไฟล์:', OUT, f'{os.path.getsize(OUT)/1024:.0f} KB')
