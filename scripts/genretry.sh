#!/bin/bash
cd /home/z/my-project/public/images
retry() {
  local prompt="$1"; local out="$2"; local size="$3"
  for i in 1 2 3 4; do
    if z-ai image -p "$prompt" -o "$out" -s "$size" 2>/dev/null; then
      echo "OK: $out"; return 0
    fi
    echo "retry $i for $out..."; sleep 20
  done
  echo "FAIL: $out"
}
retry "Dark futuristic gaming hero banner background, neon purple and violet glowing grid horizon, floating holographic panels, esports arena atmosphere, deep black background with purple light rays, cinematic, high quality, no text" "./hero-banner.png" "1440x720"
sleep 10
retry "Battle royale mobile game cover art, futuristic soldier character with combat gear, orange and red fiery explosion background, dynamic action pose, professional game key art style, vibrant, high quality, no text" "./cover-freefire.png" "1344x768"
sleep 10
retry "Elite gaming account showcase, futuristic sniper character with red laser scope glow, dark smoky background, orange embers floating, premium game account concept art, high quality, no text" "./prod-ff-2.png" "1024x1024"
sleep 10
retry "Stack of glowing golden virtual coins and gems, blocky voxel style currency, purple neon background light, premium game currency concept, dark scene with sparkles, high quality, no text" "./prod-rb-2.png" "1024x1024"
