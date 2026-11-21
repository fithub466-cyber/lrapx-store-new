/** Hash-based router — ทุกหน้าทำงานภายใต้ route / เดียว ใช้ #/... สำหรับ navigation */
import { useEffect, useState } from 'react';

export function useHashRoute() {
  const [path, setPath] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.hash.replace(/^#/, '') || '/';
  });

  useEffect(() => {
    const onChange = () => {
      setPath(window.location.hash.replace(/^#/, '') || '/');
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

export function navigate(to: string) {
  window.location.hash = to;
  window.scrollTo({ top: 0 });
}


