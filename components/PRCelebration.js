'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

/* A brief, self-dismissing celebration when a new PR is set while logging.
   Deliberately lightweight — a burst of accent particles + a headline,
   no confetti library. `pr` = { name, weight } or null. */
const N = 14;
// Deterministic spread so it renders the same each time (no Math.random,
// which is unavailable in some runtimes and would jump on re-render).
const PARTICLES = [...Array(N)].map((_, i) => {
  const angle = (i / N) * Math.PI * 2;
  return { x: Math.cos(angle) * 120, y: Math.sin(angle) * 120, d: (i % 4) * 0.03 };
});

export default function PRCelebration({ pr, onDone }) {
  useEffect(() => {
    if (!pr) return;
    const t = setTimeout(onDone, 1900);
    try { navigator.vibrate?.(30); } catch {}
    return () => clearTimeout(t);
  }, [pr, onDone]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {pr && (
        <motion.div
          key="pr-celebration"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onDone}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, rgba(111,245,154,0.10), rgba(5,5,5,0.72) 60%)',
            pointerEvents: 'auto',
          }}
        >
          {/* particle burst */}
          <div style={{ position: 'absolute', width: 0, height: 0 }}>
            {PARTICLES.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.9, delay: p.d, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  width: 7, height: 7, borderRadius: 2,
                  background: 'var(--accent)',
                  boxShadow: '0 0 10px rgba(111,245,154,0.6)',
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0.7, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            style={{ textAlign: 'center', position: 'relative' }}
          >
            <p className="label" style={{ color: 'var(--accent)', letterSpacing: '0.3em', marginBottom: 8 }}>
              New Record
            </p>
            <p className="num font-black text-white" style={{ fontSize: '3rem', lineHeight: 1 }}>
              {pr.weight}
              <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}> kg</span>
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, maxWidth: 240 }}>
              {pr.name}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
