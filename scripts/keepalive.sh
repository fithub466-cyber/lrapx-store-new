#!/bin/bash
# Keepalive supervisor: รีสตาร์ต dev server ถ้าล่ม
cd /home/z/my-project
while true; do
  if ! curl -s --connect-timeout 2 --max-time 4 http://localhost:3000/api/data/settings > /dev/null 2>&1; then
    echo "[$(date '+%H:%M:%S')] server down - restarting..."
    setsid bun run dev >> dev.log 2>&1 < /dev/null &
  fi
  sleep 5
done
