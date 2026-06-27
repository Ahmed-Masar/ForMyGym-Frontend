'use client';
import { useEffect } from 'react';

function setHeight() {
  const h = window.visualViewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--app-height', `${h}px`);
}

export default function ViewportFix() {
  useEffect(() => {
    setHeight();
    // iOS settles the real safe-area/viewport size slightly after first paint in standalone PWAs.
    const settle = setTimeout(setHeight, 300);

    const vv = window.visualViewport;
    vv?.addEventListener('resize', setHeight);
    vv?.addEventListener('scroll', setHeight);
    window.addEventListener('resize', setHeight);
    window.addEventListener('orientationchange', setHeight);

    return () => {
      clearTimeout(settle);
      vv?.removeEventListener('resize', setHeight);
      vv?.removeEventListener('scroll', setHeight);
      window.removeEventListener('resize', setHeight);
      window.removeEventListener('orientationchange', setHeight);
    };
  }, []);
  return null;
}
