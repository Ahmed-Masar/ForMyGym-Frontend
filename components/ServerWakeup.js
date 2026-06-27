'use client';
import { useEffect } from 'react';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function ServerWakeup() {
  useEffect(() => {
    fetch(`${BASE}/health`).catch(() => {});
  }, []);
  return null;
}
