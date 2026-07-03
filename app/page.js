'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format, startOfWeek, subWeeks, addDays, isSameDay, differenceInCalendarDays, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { getUpNext } from '@/lib/program';
import { useCounter } from '@/hooks/useCounter';
import PRCard from '@/components/PRCard';
import SessionCard from '@/components/SessionCard';
import PageTransition from '@/components/PageTransition';
import { usePullToRefresh } from '@/components/PullToRefresh';

const fade = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const EASE = [0.16, 1, 0.3, 1];
const WEEKLY_GOAL = 4; // 4-day split

function vol(s) {
  return s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);
}

function fmtVol(v) {
  return v >= 10000 ? `${(v / 1000).toFixed(1)}t` : `${Math.round(v).toLocaleString()}kg`;
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [prs, setPrs]           = useState([]);
  const [streak, setStreak]     = useState(0);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(() =>
    Promise.all([
      api.sessions.list(),
      api.sessions.prs(),
      api.forearm.streak().catch(() => ({ streak: 0 })),
    ]).then(([s, p, f]) => { setSessions(s); setPrs(p); setStreak(f.streak ?? 0); }),
  []);

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  const today     = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  /* Weekly volume series — last 8 weeks, oldest → current */
  const weeks = [...Array(8)].map((_, i) => {
    const start = subWeeks(weekStart, 7 - i);
    const end   = addDays(start, 7);
    const inWeek = sessions.filter(s => { const d = new Date(s.date); return d >= start && d < end; });
    return { start, volume: inWeek.reduce((a, s) => a + vol(s), 0), count: inWeek.length };
  });
  const thisWeek = weeks[7];
  const lastWeek = weeks[6];

  const lastSession   = sessions[0] ?? null;
  const daysSince     = lastSession ? differenceInCalendarDays(today, new Date(lastSession.date)) : null;
  const { next, lastTrained } = getUpNext(sessions);
  const monthAgo      = subDays(today, 30);
  const recentPrs     = [...prs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const newPrCount    = prs.filter(p => new Date(p.date) >= monthAgo).length;
  const totalVol      = sessions.reduce((a, s) => a + vol(s), 0);

  if (loading) return <Skeleton />;

  return (
    <PageTransition>
      <div className="px-4 pt-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-7"
        >
          <p className="label mb-3">
            {format(today, 'EEE, MMM d')}
            <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.12)' }}>·</span>
            <span style={{ color: daysSince === 0 ? '#fff' : daysSince > 2 ? 'rgba(255,120,120,0.7)' : undefined }}>
              {daysSince === null ? 'NO SESSIONS YET'
                : daysSince === 0 ? 'TRAINED TODAY ✓'
                : daysSince === 1 ? 'LAST SESSION YESTERDAY'
                : `LAST SESSION ${daysSince} DAYS AGO`}
            </span>
          </p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.2rem', lineHeight: 0.86 }}>
            DASHBOARD
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        {sessions.length === 0 ? (
          <Empty />
        ) : (
          <>
            {/* ── Up Next ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
              className="card p-5 mb-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="label mb-2">Up Next · Day {next.day}</p>
                  <p className="font-black text-white tracking-tight" style={{ fontSize: '1.55rem', lineHeight: 1.05 }}>
                    {next.label}
                  </p>
                  <p className="label mt-2.5" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                    {next.exercises.length} EXERCISES
                    {lastTrained && ` · LAST TIME ${fmtVol(vol(lastTrained))} · ${format(new Date(lastTrained.date), 'MMM d')}`}
                  </p>
                </div>
                <span
                  className="num font-black shrink-0"
                  style={{ fontSize: '2.6rem', lineHeight: 1, color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.04em' }}
                >
                  {String(next.day).padStart(2, '0')}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href="/workout" className="btn btn-primary flex-1 py-3">START WORKOUT</Link>
                <Link href="/program" className="btn btn-ghost px-5 py-3">PLAN</Link>
              </div>
            </motion.div>

            {/* ── This Week ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease: EASE }}
              className="card p-5 mb-2.5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="label">This Week</p>
                <p className="num font-bold text-white" style={{ fontSize: 13 }}>
                  {thisWeek.count}
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/{WEEKLY_GOAL} sessions</span>
                </p>
              </div>
              <WeekDots sessions={sessions} weekStart={weekStart} today={today} />
            </motion.div>

            {/* ── Volume Trend ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
              className="mb-2.5"
            >
              <TrendCard weeks={weeks} thisWeek={thisWeek} lastWeek={lastWeek} />
            </motion.div>

            {/* ── Small stats ── */}
            <motion.div variants={list} initial="hidden" animate="show" className="grid grid-cols-2 gap-2.5 mb-8">
              <SmallStat label="New PRs · 30 Days" value={newPrCount} delay={0.26} />
              <SmallStat label="Forearm Streak" value={streak} suffix={streak === 1 ? ' day' : ' days'} delay={0.3} />
            </motion.div>

            {/* ── Recent PRs ── */}
            {recentPrs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.34, ease: EASE }}
                className="mb-8"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="label">Latest Records</p>
                  <Link href="/exercises" className="label" style={{ color: 'rgba(255,255,255,0.15)' }}>ALL →</Link>
                </div>
                <motion.div
                  variants={list} initial="hidden" animate="show"
                  className="flex gap-2.5 overflow-x-auto"
                  style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}
                >
                  {recentPrs.slice(0, 8).map((pr) => (
                    <motion.div
                      key={pr.exerciseId}
                      variants={fade}
                      transition={{ duration: 0.45, ease: EASE }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <PRCard {...pr} />
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* ── Recent Sessions ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: EASE }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="label">Recent</p>
                {sessions.length > 3 && (
                  <Link href="/history" className="label" style={{ color: 'rgba(255,255,255,0.15)' }}>ALL →</Link>
                )}
              </div>
              <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2.5">
                {sessions.slice(0, 3).map(s => (
                  <motion.div key={s._id} variants={fade} transition={{ duration: 0.45, ease: EASE }} whileTap={{ scale: 0.98 }}>
                    <SessionCard session={s} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* ── All-time footer ── */}
            <p className="label text-center mb-4" style={{ fontSize: 9, color: 'rgba(255,255,255,0.14)' }}>
              ALL TIME · {sessions.length} SESSIONS · {fmtVol(totalVol)} · {prs.length} RECORDS
            </p>
          </>
        )}

      </div>
    </PageTransition>
  );
}

/* ── Mon–Sun trained/rest dots for the current week ── */
function WeekDots({ sessions, weekStart, today }) {
  const days = [...Array(7)].map((_, i) => addDays(weekStart, i));
  return (
    <div className="flex justify-between">
      {days.map((d, i) => {
        const trained  = sessions.some(s => isSameDay(new Date(s.date), d));
        const isToday  = isSameDay(d, today);
        const isFuture = d > today && !isToday;
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: trained ? '#fff' : 'rgba(255,255,255,0.045)',
                border: isToday ? '1.5px solid rgba(255,255,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isFuture ? 0.4 : 1,
              }}
            >
              {trained && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#050505" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.div>
            <span
              className="label"
              style={{ fontSize: 8, letterSpacing: 0, color: isToday ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)' }}
            >
              {format(d, 'EEEEE')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ── 8-week volume trend: headline + delta + tappable bar sparkline ── */
function TrendCard({ weeks, thisWeek, lastWeek }) {
  const [sel, setSel] = useState(7);
  const shown   = weeks[sel];
  const isCurr  = sel === 7;
  const max     = Math.max(...weeks.map(w => w.volume), 1);
  const diff    = thisWeek.volume - lastWeek.volume;
  const pct     = lastWeek.volume > 0 ? Math.round((diff / lastWeek.volume) * 100) : null;
  const counted = useCounter(Math.round(shown.volume));

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="label">{isCurr ? 'Volume · This Week' : `Week of ${format(shown.start, 'MMM d')}`}</p>
        {isCurr && pct !== null && (
          <span className="num font-bold" style={{ fontSize: 13, color: diff >= 0 ? '#fff' : 'rgba(255,255,255,0.35)' }}>
            {diff >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs last week
          </span>
        )}
        {!isCurr && (
          <span className="num" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            {shown.count} session{shown.count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <p className="num font-black text-white mb-4" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
        {counted.toLocaleString()}
        <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
      </p>

      <div className="flex items-end gap-1.5" style={{ height: 56 }}>
        {weeks.map((w, i) => (
          <button
            key={i}
            onClick={() => setSel(i)}
            aria-label={`Week of ${format(w.start, 'MMM d')}: ${w.volume.toLocaleString()} kg`}
            className="flex-1 flex items-end"
            style={{ height: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((w.volume / max) * 100, 4)}%` }}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.05, ease: EASE }}
              className="w-full"
              style={{
                borderRadius: '4px 4px 2px 2px',
                background: i === sel ? '#fff' : i === 7 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.16)',
                transition: 'background 180ms ease',
              }}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="label" style={{ fontSize: 8, letterSpacing: '0.1em' }}>{format(weeks[0].start, 'MMM d')}</span>
        <span className="label" style={{ fontSize: 8, letterSpacing: '0.1em' }}>THIS WEEK</span>
      </div>
    </div>
  );
}

function SmallStat({ label, value, suffix = '', delay = 0 }) {
  const counted = useCounter(value);
  return (
    <motion.div variants={fade} transition={{ duration: 0.5, ease: EASE, delay }} className="card flex flex-col gap-2 p-4">
      <p className="label">{label}</p>
      <p className="num font-black text-white" style={{ fontSize: '2rem', lineHeight: 1 }}>
        {counted}
        {suffix && <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>{suffix}</span>}
      </p>
    </motion.div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center py-14 gap-4">
      <p className="label">No sessions yet</p>
      <Link href="/workout" className="btn btn-primary px-7 py-3.5">Start First Workout</Link>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-16 w-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-36 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      <div className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    </div>
  );
}
