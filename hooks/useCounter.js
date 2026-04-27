'use client';
import { useEffect, useRef, useState } from 'react';

export function useCounter(target, duration = 1.1) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const num = parseFloat(target) || 0;
    if (num === 0) { setValue(0); return; }

    const start = performance.now();

    const tick = (now) => {
      const elapsed = (now - start) / (duration * 1000);
      if (elapsed >= 1) { setValue(num); return; }
      // easeOutExpo
      const p = 1 - Math.pow(2, -10 * elapsed);
      setValue(Math.floor(num * p));
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);

  return value;
}
