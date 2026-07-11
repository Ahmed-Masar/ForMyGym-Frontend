'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isToday, addDays, isAfter,
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCounter } from '@/hooks/useCounter';
import BottomSheet from '@/components/BottomSheet';
import PageTransition from '@/components/PageTransition';
import { usePullToRefresh } from '@/components/PullToRefresh';
import { currentGymDayKey, parseDayKey } from '@/lib/gymDay';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const vol = s => s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);

function buildGrid(month) {
  const start = startOfWeek(startOfMonth(month));
  const end   = endOfWeek(endOfMonth(month));
  const days  = [];
  let cur = start;
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
  return days;
}

// Counts back from the gym day (which, before the morning cutoff, is still
// yesterday) so a not-yet-trained new calendar day doesn't drop the streak.
function calcStreak(byDay) {
  let cursor = parseDayKey(currentGymDayKey());
  if (!byDay.has(format(cursor, 'yyyy-MM-dd'))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (byDay.has(format(cursor, 'yyyy-MM-dd'))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.012 } } };

export default function CalendarPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [month, setMonth]       = useState(startOfMonth(new Date()));
  const [direction, setDirection] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const today = new Date();

  const load = useCallback(() => api.sessions.list().then(setSessions), []);
  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const s of sessions) {
      const key = s.dateKey ?? format(new Date(s.date), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, [sessions]);

  const grid = buildGrid(month);

  const monthSessions    = sessions.filter(s => isSameMonth(new Date(s.date), month));
  const monthTrainedDays = grid.filter(d => isSameMonth(d, month) && byDay.has(format(d, 'yyyy-MM-dd'))).length;
  const monthVolume      = monthSessions.reduce((a, s) => a + vol(s), 0);
  const streak           = useMemo(() => calcStreak(byDay), [byDay]);

  const daySessions = selectedDay ? (byDay.get(format(selectedDay, 'yyyy-MM-dd')) || []) : [];
  const isCurrentMonth = isSameMonth(month, new Date());
  const elapsedDays = isCurrentMonth ? today.getDate() : endOfMonth(month).getDate();

  function nav(dir) {
    setDirection(dir);
    setMonth(m => dir > 0 ? addMonths(m, 1) : subMonths(m, 1));
  }

  if (loading) return <Skeleton />;

  return (
    <PageTransition>
      <div className="px-4 pt-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2 flex items-end justify-between"
        >
          <div>
            <p className="label mb-3">Training Calendar</p>
            <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.6rem', lineHeight: 0.86 }}>
              CALENDAR
            </h1>
          </div>
          {!isCurrentMonth && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => { setDirection(0); setMonth(startOfMonth(new Date())); }}
              className="btn btn-ghost"
              style={{ padding: '9px 16px', fontSize: 11, marginBottom: 4 }}
            >
              TODAY
            </motion.button>
          )}
        </motion.div>
        <p style={{ fontStyle: 'italic', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: '20px' }}>
          Every day you show up, recorded.
        </p>
        <div className="mb-7 section-line" />

        {/* Hero stat card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-5 flex items-center gap-5 p-5"
          style={glassCardStyle(26)}
        >
          <ProgressRing value={monthTrainedDays} max={elapsedDays} />

          <div className="flex-1 flex flex-col gap-3.5">
            <HeroRow label="Streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <HeroRow
              label="Volume"
              value={monthVolume >= 1000 ? Math.floor(monthVolume / 1000) : Math.floor(monthVolume)}
              suffix={monthVolume >= 1000 ? 't' : 'kg'}
            />
          </div>
        </motion.div>

        {/* Calendar card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
          style={glassCardStyle(26)}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between px-3 pt-4 pb-1">
            <button type="button" onClick={() => nav(-1)} style={navBtnStyle} aria-label="Previous month">
              <Chevron left />
            </button>
            <AnimatePresence mode="wait">
              <motion.span
                key={format(month, 'yyyy-MM')}
                initial={{ opacity: 0, y: direction >= 0 ? 6 : -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="num font-black text-white"
                style={{ fontSize: 17, letterSpacing: '0.01em' }}
              >
                {format(month, 'MMMM').toUpperCase()}{' '}
                <span style={{ color: 'rgba(255,255,255,0.32)', fontWeight: 700 }}>{format(month, 'yyyy')}</span>
              </motion.span>
            </AnimatePresence>
            <button type="button" onClick={() => nav(1)} style={navBtnStyle} aria-label="Next month">
              <Chevron />
            </button>
          </div>

          <div className="px-3.5 pb-4">
            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map((d, i) => (
                <div key={i} className="label text-center" style={{ fontSize: 9, letterSpacing: '0.3em' }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <AnimatePresence mode="wait">
              <motion.div
                key={format(month, 'yyyy-MM')}
                variants={list} initial="hidden" animate="show"
                className="grid grid-cols-7 gap-1.5"
                style={{ gridAutoRows: '46px' }}
              >
                {grid.map((day, i) => {
                  const inMonth = isSameMonth(day, month);
                  const key     = format(day, 'yyyy-MM-dd');
                  const trained = byDay.has(key);
                  const isTod   = isToday(day);
                  const future  = isAfter(day, today) && !isTod;
                  const rest    = inMonth && !trained && !future && !isTod;

                  return (
                    <motion.button
                      key={i}
                      variants={fade}
                      transition={{ duration: 0.16 }}
                      whileTap={{ scale: inMonth ? 0.88 : 1 }}
                      type="button"
                      onClick={() => inMonth && setSelectedDay(day)}
                      style={{
                        fontFamily: 'inherit',
                        position: 'relative',
                        fontSize: 14,
                        fontWeight: trained ? 800 : isTod ? 700 : 500,
                        borderRadius: 14,
                        border: isTod && !trained ? '1.5px solid rgba(255,255,255,0.5)' : '1px solid transparent',
                        background: trained
                          ? 'radial-gradient(circle at 32% 28%, #ffffff 0%, #f1f1f1 100%)'
                          : isTod ? 'rgba(255,255,255,0.04)' : 'transparent',
                        boxShadow: trained
                          ? 'inset 0 -2px 3px rgba(0,0,0,0.08), 0 8px 18px -6px rgba(255,255,255,0.32), 0 0 0 1px rgba(255,255,255,0.06)'
                          : 'none',
                        color: trained ? '#050505' : inMonth ? (rest ? 'rgba(255,255,255,0.4)' : '#ffffff') : 'rgba(255,255,255,0.09)',
                        cursor: inMonth ? 'pointer' : 'default',
                        WebkitTapHighlightColor: 'transparent',
                        fontVariantNumeric: 'tabular-nums',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
                      }}
                    >
                      {format(day, 'd')}
                      {isTod && trained && (
                        <span style={{
                          position: 'absolute', bottom: 4, width: 3, height: 3,
                          borderRadius: 99, background: '#050505',
                        }} />
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 px-4 pb-4 pt-3.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 99, background: 'radial-gradient(circle at 32% 28%, #fff, #f1f1f1)', boxShadow: '0 0 7px rgba(255,255,255,0.45)' }} />
              <span className="label" style={{ fontSize: 9 }}>Trained</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.5)' }} />
              <span className="label" style={{ fontSize: 9 }}>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
              <span className="label" style={{ fontSize: 9 }}>Rest</span>
            </div>
          </div>
        </motion.div>

        <div className="h-6" />
      </div>

      {/* Day Detail Sheet */}
      <BottomSheet
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? format(selectedDay, 'EEEE, MMM d · yyyy') : ''}
      >
        {daySessions.length > 0 ? (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-3" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }}>
              <span className="label">Volume</span>
              <span className="num font-black text-white" style={{ fontSize: '1.4rem' }}>
                {daySessions.reduce((a, s) => a + vol(s), 0).toLocaleString()}
                <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
              </span>
            </div>

            {daySessions.flatMap(s => s.exercises).map((ex, i, arr) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-bold text-white" style={{ fontSize: 14 }}>{ex.exercise?.name ?? '—'}</span>
                  <span className="num label">{Math.max(...ex.sets.map(s => s.weight))}kg max</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ex.sets.map((set, si) => (
                    <span key={si} className="num" style={{
                      fontSize: 13, fontWeight: 600,
                      padding: '7px 14px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.65)',
                    }}>
                      {set.reps} × {set.weight}kg
                    </span>
                  ))}
                </div>
                {i < arr.length - 1 && <div className="mt-4 divider" />}
              </div>
            ))}

            <div className="h-2" />
          </div>
        ) : (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="font-bold text-white" style={{ fontSize: 15 }}>Rest Day</p>
            <p className="label" style={{ color: 'rgba(255,255,255,0.22)' }}>No sets logged</p>
            <Link href="/exercises" className="btn btn-ghost px-6 py-3 mt-2" style={{ fontSize: 11 }}>
              Log a Set
            </Link>
          </div>
        )}
      </BottomSheet>
    </PageTransition>
  );
}

function glassCardStyle(radius) {
  return {
    borderRadius: radius,
    background: 'linear-gradient(165deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.09), 0 24px 48px -24px rgba(0,0,0,0.65)',
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
  };
}

function HeroRow({ label, value, suffix }) {
  const count = useCounter(value);
  return (
    <div className="flex items-baseline justify-between">
      <span className="label" style={{ fontSize: 9 }}>{label.toUpperCase()}</span>
      <p className="num font-black text-white" style={{ fontSize: '1.5rem', lineHeight: 1 }}>
        {count}
        {suffix && (
          <span className="font-normal ml-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

function ProgressRing({ value, max, size = 100, stroke = 7 }) {
  const r   = (size - stroke) / 2;
  const c   = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const count = useCounter(value);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#ffffff" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - c * pct }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.4))' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="num font-black text-white" style={{ fontSize: '1.7rem', lineHeight: 1 }}>{count}</span>
        <span className="label" style={{ fontSize: 8, marginTop: 2 }}>of {max} days</span>
      </div>
    </div>
  );
}

function Chevron({ left }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: left ? 'none' : 'rotate(180deg)' }}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

const navBtnStyle = {
  fontFamily: 'inherit',
  width: 34, height: 34,
  borderRadius: 99,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: 'rgba(255,255,255,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-14 w-44 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="grid grid-cols-3 gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
      <div className="h-80 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
    </div>
  );
}
