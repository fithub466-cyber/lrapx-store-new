'use client';

import { useEffect } from 'react';

const TARGET_CLASSES: Record<string, string> = {
  hero: '.shine-target-hero',
  store_logo: '.shine-target-store-logo',
  loader_logo: '.shine-target-loader-logo',
  loader_background: '.shine-target-loader-background',
  robux_logo: '.shine-target-robux-logo',
  announcement: '.shine-target-announcement',
  trust_1: '.shine-target-trust-1',
  trust_2: '.shine-target-trust-2',
  trust_3: '.shine-target-trust-3',
  trust_4: '.shine-target-trust-4',
};

export function SiteImageEffects() {
  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let observer: MutationObserver | undefined;
    let duration = 1200;

    const startSweep = () => {
      if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      document.querySelectorAll<HTMLElement>('.shine-sweep:not(.shine-preview) .shine-sweep-overlay').forEach((overlay) => {
        const parent = overlay.parentElement;
        if (!parent || parent.dataset.shineDisabled === 'true') return;
        const last = Number(overlay.dataset.lastSweep || '0');
        if (Date.now() - last < 29000) return;
        overlay.dataset.lastSweep = String(Date.now());
        overlay.animate(
          [{ transform: 'translateX(0) skewX(-18deg)', opacity: 0 },
           { transform: 'translateX(220%) skewX(-18deg)', opacity: 1, offset: 0.5 },
           { transform: 'translateX(440%) skewX(-18deg)', opacity: 0 }],
          { duration, easing: 'ease-in-out', fill: 'none' }
        );
      });
    };

    fetch('/api/data/settings', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!active || !data?.settings) return;
        const s = data.settings as Record<string, string>;
        const enabled = s.motion_shine_enabled === 'true';
        const targets = (s.motion_shine_targets || 'hero,store_logo').split(',').filter((key) => key in TARGET_CLASSES);
        duration = [700, 1200, 2000].includes(Number(s.motion_shine_speed)) ? Number(s.motion_shine_speed) : 1200;

        const updateTargets = () => {
          Object.entries(TARGET_CLASSES).forEach(([key, selector]) => {
            document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
              element.dataset.shineDisabled = enabled && targets.includes(key) ? 'false' : 'true';
            });
          });
          startSweep();
        };
        updateTargets();
        observer = new MutationObserver(updateTargets);
        observer.observe(document.body, { childList: true, subtree: true });
        interval = setInterval(startSweep, 30000);
      })
      .catch(() => {});

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      observer?.disconnect();
    };
  }, []);
  return null;
}
