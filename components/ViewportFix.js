'use client';
import { useEffect } from 'react';

export default function ViewportFix() {
  useEffect(() => {
    window.scrollTo(0, 1);
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }, []);
  return null;
}
