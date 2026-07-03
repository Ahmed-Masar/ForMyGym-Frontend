'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '@/components/PageTransition';
import { PROGRAM } from '@/lib/program';

const itemFade = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };
const itemList = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };

export default function ProgramPage() {
  const [expanded, setExpanded] = useState(null);
  const [imageOpen, setImageOpen] = useState(false);

  const toggle = (day) => setExpanded(prev => prev === day ? null : day);

  return (
    <PageTransition>
      <div className="px-4 pt-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <p className="label mb-3">Current Split</p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.2rem', lineHeight: 0.86 }}>
            PROGRAM
          </h1>
          <p className="label mt-2" style={{ color: 'rgba(255,255,255,0.18)' }}>
            4-Day Hypertrophy Split
          </p>
          <div className="mt-4 section-line" />
        </motion.div>

        {/* Chart thumbnail */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6"
        >
          <p className="label mb-2.5">Full Chart</p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setImageOpen(true)}
            className="card w-full overflow-hidden relative"
            style={{ borderRadius: 18, height: 88, padding: 0, display: 'block' }}
          >
            <img
              src="/program.jpg"
              alt="Training Program Chart"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                display: 'block',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to right, rgba(5,5,5,0.08) 0%, rgba(5,5,5,0.62) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 18,
              gap: 6,
            }}>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>⊕</span>
              <span className="label" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>VIEW CHART</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Day cards */}
        <p className="label mb-3">Days</p>
        <div className="flex flex-col gap-2.5">
          {PROGRAM.map((item, i) => (
            <motion.div
              key={item.day}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => toggle(item.day)}
                className="card w-full text-left"
                style={{ borderRadius: 18, overflow: 'hidden', padding: 0, display: 'block' }}
              >
                {/* Day header row */}
                <div className="flex items-center justify-between px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* Ghost day number */}
                    <span
                      className="num font-black text-white shrink-0"
                      style={{ fontSize: '2.4rem', lineHeight: 1, opacity: 0.1, letterSpacing: '-0.04em' }}
                    >
                      {String(item.day).padStart(2, '0')}
                    </span>
                    <div>
                      <p className="label" style={{ fontSize: 8 }}>DAY {item.day}</p>
                      <p className="font-bold text-white" style={{ fontSize: 14, marginTop: 2 }}>
                        {item.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="label" style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)' }}>
                      {item.exercises.length}
                    </span>
                    <motion.span
                      animate={{ rotate: expanded === item.day ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, lineHeight: 1, display: 'block', marginTop: -2 }}
                    >
                      ⌄
                    </motion.span>
                  </div>
                </div>

                {/* Expandable exercise list */}
                <AnimatePresence initial={false}>
                  {expanded === item.day && (
                    <motion.div
                      key="ex-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 10, paddingTop: 4 }}>
                        <motion.div variants={itemList} initial="hidden" animate="show">
                          {item.exercises.map((ex, ei) => (
                            <motion.div
                              key={ei}
                              variants={itemFade}
                              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                              className="flex items-center gap-3 px-4 py-2.5"
                            >
                              <span
                                className="num shrink-0"
                                style={{ fontSize: 11, color: 'rgba(255,255,255,0.14)', width: 16, textAlign: 'right' }}
                              >
                                {ei + 1}
                              </span>
                              <div style={{ width: 1, height: 11, background: 'rgba(255,255,255,0.09)', borderRadius: 1, flexShrink: 0 }} />
                              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>
                                {ex}
                              </span>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          ))}
        </div>

        <div className="h-6" />
      </div>

      <ZoomModal open={imageOpen} onClose={() => setImageOpen(false)} />
    </PageTransition>
  );
}

/* ── Pinch-to-zoom image modal ── */
function ZoomModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const st = useRef({
    scale: 1,
    pos: { x: 0, y: 0 },
    pinchDist: null,
    pinchScale: null,
    panStart: null,
    panPos: null,
    lastTap: 0,
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) {
      setScale(1); setPos({ x: 0, y: 0 });
      st.current.scale = 1; st.current.pos = { x: 0, y: 0 };
    }
  }, [open]);

  const getDist = (ts) => {
    const dx = ts[0].clientX - ts[1].clientX;
    const dy = ts[0].clientY - ts[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      st.current.pinchDist  = getDist(e.touches);
      st.current.pinchScale = st.current.scale;
      st.current.panStart   = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - st.current.lastTap < 280) {
        st.current.lastTap = 0;
        if (st.current.scale > 1) {
          st.current.scale = 1; st.current.pos = { x: 0, y: 0 };
          setScale(1); setPos({ x: 0, y: 0 });
        } else {
          st.current.scale = 2.5; setScale(2.5);
        }
        return;
      }
      st.current.lastTap  = now;
      st.current.panStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      st.current.panPos   = { ...st.current.pos };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 2 && st.current.pinchDist != null) {
      const newDist  = getDist(e.touches);
      const newScale = Math.max(1, Math.min(5, st.current.pinchScale * (newDist / st.current.pinchDist)));
      st.current.scale = newScale;
      setScale(newScale);
      if (newScale <= 1) { st.current.pos = { x: 0, y: 0 }; setPos({ x: 0, y: 0 }); }
    } else if (e.touches.length === 1 && st.current.panStart && st.current.scale > 1) {
      const newPos = {
        x: st.current.panPos.x + (e.touches[0].clientX - st.current.panStart.x),
        y: st.current.panPos.y + (e.touches[0].clientY - st.current.panStart.y),
      };
      st.current.pos = newPos;
      setPos(newPos);
    }
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) { st.current.pinchDist = null; st.current.pinchScale = null; }
    if (e.touches.length === 0) st.current.panStart = null;
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="zoom-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: '#000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20, zIndex: 2,
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.55)', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>

          {/* Hint */}
          <p style={{
            position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center',
            fontSize: 9, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.18)',
            fontWeight: 600, textTransform: 'uppercase', pointerEvents: 'none', zIndex: 2,
          }}>
            Pinch · Double-tap to zoom
          </p>

          {/* Image + gesture zone */}
          <div
            style={{
              width: '100%', height: '100%', overflow: 'hidden',
              touchAction: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src="/program.jpg"
              alt="Training Program"
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                transform: `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
                transformOrigin: 'center center',
                transition: (scale === 1 && pos.x === 0 && pos.y === 0)
                  ? 'transform 0.3s cubic-bezier(0.16,1,0.3,1)'
                  : 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
