#!/bin/bash
cd /home/z/my-project/public/images
z-ai image -p "Dark futuristic gaming hero banner background, neon purple and violet glowing grid horizon, floating holographic panels, esports arena atmosphere, deep black background with purple light rays, cinematic, high quality, no text" -o "./hero-banner.png" -s 1440x720 &
P1=$!
z-ai image -p "Battle royale mobile game cover art, futuristic soldier character with combat gear, orange and red fiery explosion background, dynamic action pose, professional game key art style, vibrant, high quality, no text" -o "./cover-freefire.png" -s 1344x768 &
P2=$!
z-ai image -p "Blocky voxel 3D game world cover art, colorful cubic characters and structures, teal and purple sky, sandbox building game aesthetic, isometric view, professional game key art, high quality, no text" -o "./cover-roblox.png" -s 1344x768 &
P3=$!
z-ai image -p "Glowing digital gift cards floating in dark space with neon purple and gold light trails, gaming gift pass concept, premium subscription cards with ribbon, dark background, cinematic lighting, high quality, no text" -o "./cover-giftpass.png" -s 1344x768 &
P4=$!
wait $P1 $P2 $P3 $P4
echo "batch 1 done"
z-ai image -p "Rare virtual character skin showcase, legendary warrior bundle with glowing golden armor and fire wings, dark background with purple neon rim light, game inventory item presentation, high quality, no text" -o "./prod-ff-1.png" -s 1024x1024 &
P5=$!
z-ai image -p "Elite gaming account showcase, futuristic sniper character with red laser scope glow, dark smoky background, orange embers floating, premium game account concept art, high quality, no text" -o "./prod-ff-2.png" -s 1024x1024 &
P6=$!
z-ai image -p "Rare limited edition virtual hat and sword items floating on display pedestal, voxel blocky game items, purple magical glow, dark background, game inventory showcase, high quality, no text" -o "./prod-rb-1.png" -s 1024x1024 &
P7=$!
z-ai image -p "Stack of glowing golden virtual coins and gems, blocky voxel style currency, purple neon background light, premium game currency concept, dark scene with sparkles, high quality, no text" -o "./prod-rb-2.png" -s 1024x1024 &
P8=$!
wait $P5 $P6 $P7 $P8
echo "batch 2 done"
