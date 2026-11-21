#!/bin/bash
# ทดสอบ API ครบทุก flow ของ LrapX Store
BASE="http://localhost:3000"
J1="/tmp/cookies-user.txt"
J2="/tmp/cookies-admin.txt"
rm -f $J1 $J2

echo "=== 1. Register new user ==="
curl -s -c $J1 -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"tester01","email":"tester01@test.com","password":"Test12345","confirmPassword":"Test12345"}' | head -c 200; echo

echo "=== 2. Duplicate register (should fail) ==="
curl -s -X POST $BASE/api/auth/register -H "Content-Type: application/json" \
  -d '{"username":"tester01","email":"other@test.com","password":"Test12345","confirmPassword":"Test12345"}' | head -c 150; echo

echo "=== 3. Login as demo ==="
curl -s -c $J1 -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"demo@lrapx.store","password":"Demo1234"}' | head -c 200; echo

echo "=== 4. Wrong password (should fail) ==="
curl -s -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"demo","password":"wrong"}' | head -c 150; echo

echo "=== 5. Me ==="
curl -s -b $J1 $BASE/api/auth/me | head -c 200; echo

echo "=== 6. Wallet ==="
curl -s -b $J1 $BASE/api/data/wallet | head -c 250; echo

echo "=== 7. Get a product ==="
PRODUCT=$(curl -s "$BASE/api/data/products?category=freefire-id" | python3 -c "import json,sys; d=json.load(sys.stdin); print([p['id'] for p in d['products'] if p['status']=='AVAILABLE'][0])")
echo "product id: $PRODUCT"

echo "=== 8. Buy product with wallet ==="
curl -s -b $J1 -X POST $BASE/api/data/order -H "Content-Type: application/json" \
  -d "{\"type\":\"GAME_ID\",\"paymentMethod\":\"WALLET\",\"items\":[{\"productId\":\"$PRODUCT\",\"quantity\":1}]}" | head -c 300; echo

echo "=== 9. Try to buy SAME product again (should fail - already sold) ==="
curl -s -b $J1 -X POST $BASE/api/data/order -H "Content-Type: application/json" \
  -d "{\"type\":\"GAME_ID\",\"paymentMethod\":\"WALLET\",\"items\":[{\"productId\":\"$PRODUCT\",\"quantity\":1}]}" | head -c 200; echo

echo "=== 10. Wallet after purchase ==="
curl -s -b $J1 $BASE/api/data/wallet | python3 -c "import json,sys; d=json.load(sys.stdin); print('balance:', d['balance'], '| txs:', len(d['transactions']))"

echo "=== 11. Topup FF package ==="
PKG=$(curl -s "$BASE/api/data/packages?category=freefire-topup" | python3 -c "import json,sys; print(json.load(sys.stdin)['packages'][0]['id'])")
curl -s -b $J1 -X POST $BASE/api/data/order -H "Content-Type: application/json" \
  -d "{\"type\":\"TOPUP\",\"paymentMethod\":\"WALLET\",\"items\":[{\"packageId\":\"$PKG\",\"quantity\":1}],\"contact\":{\"playerId\":\"123456789\"}}" | head -c 250; echo

echo "=== 12. Deposit (angpao) ==="
curl -s -b $J1 -X POST $BASE/api/data/deposit -H "Content-Type: application/json" \
  -d '{"method":"TRUEMONEY_ANGPAO","amount":300,"angpaoLink":"https://gift.truemoney.com/cash-gift/?v=test123"}' | head -c 200; echo

echo "=== 13. Admin login ==="
curl -s -c $J2 -X POST $BASE/api/auth/login -H "Content-Type: application/json" \
  -d '{"identifier":"admin@lrapx.store","password":"Admin@LrapX2024"}' | head -c 150; echo

echo "=== 14. User tries admin API (should 403) ==="
curl -s -b $J1 $BASE/api/admin/stats -w " [%{http_code}]" | head -c 150; echo

echo "=== 15. Admin stats ==="
curl -s -b $J2 $BASE/api/admin/stats | python3 -c "import json,sys; d=json.load(sys.stdin)['stats']; print('revenue:', d['revenue'], '| orders:', d['orderCount'], '| users:', d['userCount'], '| pendingDeposits:', d['depositPending'])"

echo "=== 16. Admin deposits list ==="
DEPOSIT=$(curl -s -b $J2 "$BASE/api/admin/deposits?status=PENDING" | python3 -c "import json,sys; d=json.load(sys.stdin)['deposits']; print(d[0]['id'] if d else '')")
echo "pending deposit: $DEPOSIT"

echo "=== 17. Admin approve deposit ==="
curl -s -b $J2 -X PATCH $BASE/api/admin/deposits/$DEPOSIT -H "Content-Type: application/json" -d '{"action":"approve"}' | head -c 200; echo

echo "=== 18. Double approve (should fail - already reviewed) ==="
curl -s -b $J2 -X PATCH $BASE/api/admin/deposits/$DEPOSIT -H "Content-Type: application/json" -d '{"action":"approve"}' | head -c 150; echo

echo "=== 19. User wallet after deposit approve ==="
curl -s -b $J1 $BASE/api/data/wallet | python3 -c "import json,sys; d=json.load(sys.stdin); print('balance:', d['balance'])"

echo "=== 20. Admin orders + change status ==="
ORDER=$(curl -s -b $J2 "$BASE/api/admin/orders?status=PROCESSING" | python3 -c "import json,sys; d=json.load(sys.stdin)['orders']; print(d[0]['id'] if d else '')")
curl -s -b $J2 -X PATCH $BASE/api/admin/orders/$ORDER -H "Content-Type: application/json" -d '{"status":"COMPLETED","adminNote":"ส่งของเรียบร้อย","deliveryInfo":"ไอดี: test / รหัสผ่าน: test123 (ตัวอย่าง)"}' | head -c 150; echo

echo "=== 21. Admin create product ==="
CAT=$(curl -s "$BASE/api/data/categories" | python3 -c "import json,sys; print([c['id'] for c in json.load(sys.stdin)['categories'] if c['slug']=='roblox-id'][0])")
curl -s -b $J2 -X POST $BASE/api/admin/products -H "Content-Type: application/json" \
  -d "{\"code\":\"RB-ID-TEST\",\"title\":\"ไอดีทดสอบจาก Admin\",\"description\":\"สินค้าทดสอบระบบหลังบ้าน\",\"categoryId\":\"$CAT\",\"price\":99,\"images\":[\"/images/prod-rb-1.png\"],\"details\":[{\"label\":\"ทดสอบ\",\"value\":\"ค่าทดสอบ\"}],\"status\":\"AVAILABLE\",\"featured\":false}" | head -c 150; echo

echo "=== 22. Forgot password (generic response) ==="
curl -s -X POST $BASE/api/auth/forgot -H "Content-Type: application/json" -d '{"email":"demo@lrapx.store"}' | head -c 200; echo

echo "=== 23. Admin sees reset code ==="
curl -s -b $J2 $BASE/api/admin/reset-requests | python3 -c "import json,sys; d=json.load(sys.stdin)['requests']; print('code for', d[0]['user']['username'], ':', d[0]['code'] if d else 'none')"

echo "=== 24. Review ==="
curl -s -b $J1 -X POST $BASE/api/data/review -H "Content-Type: application/json" -d '{"rating":5,"comment":"ทดสอบรีวิวจากสคริปต์","gameTag":"freefire"}' | head -c 150; echo

echo "=== 25. Search ==="
curl -s "$BASE/api/data/search?q=FF" | python3 -c "import json,sys; d=json.load(sys.stdin); print('products:', len(d['products']), '| packages:', len(d['packages']))"

echo "=== DONE ==="
