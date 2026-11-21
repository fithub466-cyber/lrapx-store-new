#!/bin/bash
# แพ็กไฟล์เว็บ LrapX Store เป็น ZIP สำหรับดาวน์โหลด
set -e

SRC=/home/z/my-project
STAGE=/tmp/lrapx-store-stage
OUT=/home/z/my-project/download/LrapX-Store-Website.zip

rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE/LrapX-Store"

# --- โค้ดหลัก ---
cp -r "$SRC/src"          "$STAGE/LrapX-Store/src"
cp -r "$SRC/prisma"       "$STAGE/LrapX-Store/prisma"
cp -r "$SRC/public"       "$STAGE/LrapX-Store/public"
cp -r "$SRC/db"           "$STAGE/LrapX-Store/db"
cp -r "$SRC/scripts"      "$STAGE/LrapX-Store/scripts"

# --- ไฟล์ config / lock ---
cp "$SRC/package.json" "$SRC/bun.lock" "$SRC/tsconfig.json" "$SRC/next.config.ts" \
   "$SRC/postcss.config.mjs" "$SRC/tailwind.config.ts" "$SRC/eslint.config.mjs" \
   "$SRC/components.json" "$SRC/next-env.d.ts" "$SRC/README-DEPLOY-TH.md" \
   "$STAGE/LrapX-Store/"

# --- .env แบบพกพา (relative path) + .env.example ---
cat > "$STAGE/LrapX-Store/.env" <<'EOF'
DATABASE_URL=file:../db/custom.db
EOF
cp "$STAGE/LrapX-Store/.env" "$STAGE/LrapX-Store/.env.example"

# --- เก็บข้อมูลตัวอย่างเว็บ (วิธีใช้) เผื่อผู้ใช้บนมือถือ ---
cp "$SRC/README-DEPLOY-TH.md" "$STAGE/LrapX-Store/คู่มือติดตั้ง-README.md"

# --- ไฟล์ตัวอย่างหน้าเว็บ เปิดดูบนมือถือได้ทันที ---
cp "$SRC/download/LrapX-Store-preview.html" "$STAGE/LrapX-Store/ตัวอย่างเว็บ-เปิดบนมือถือ.html"

# --- ลบไฟล์ที่ไม่จำเป็นออกจากแพ็ก ---
rm -f "$STAGE/LrapX-Store/scripts/keepalive.sh"

# --- สร้างโฟลเดอร์ uploads ให้มีไฟล์ .gitkeep กัน zip ตัดโฟลเดอร์เปล่าทิ้ง ---
touch "$STAGE/LrapX-Store/public/uploads/.gitkeep"

# --- บีบอัด ---
mkdir -p /home/z/my-project/download
cd "$STAGE" && zip -rq "$OUT" LrapX-Store

echo "== DONE =="
ls -lh "$OUT"
echo "== เนื้อหาใน ZIP (สรุป) =="
unzip -l "$OUT" | head -30
unzip -l "$OUT" | tail -3
