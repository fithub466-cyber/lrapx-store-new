'use client';

import { useEffect } from 'react';

export function SiteImageEffects() {
  useEffect(() => {
    let active = true;
    fetch('/api/data/settings', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!active || !data?.settings) return;
        const s = data.settings as Record<string, string>;
        const root = document.documentElement;
        root.dataset.motionShine = s.motion_shine_enabled === 'true' ? 'on' : 'off';
        root.dataset.motionAllImages = s.motion_all_images === 'false' ? 'off' : 'on';
        const speed = Number(s.motion_shine_speed);
        root.style.setProperty('--image-shine-duration', [1.5, 3, 5].includes(speed) ? speed + 's' : '3s');
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return null;
}
