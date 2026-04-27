'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfWeek, subWeeks } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useCounter } from '@/hooks/useCounter';
import PRCard from '@/components/PRCard';
import SessionCard from '@/components/SessionCard';
import WeekComparison from '@/components/WeekComparison';
import PageTransition from '@/components/PageTransition';

const fade  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const list  = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

function vol(s) {
  return s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);
}

/* ── Animated stat number ── */
function BigStat({ value, label, delay = 0 }) {
  const num = parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
  const suffix = String(value).replace(/[0-9.]/g, '');
  const counted = useCounter(num);

  return (
    <motion.div
      variants={fade}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }}
      className="card flex flex-col gap-2 p-4"
    >
      <p className="label">{label}</p>
      <p className="num font-black text-white" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
        {suffix ? `${counted}${suffix}` : counted}
      </p>
    </motion.div>
  );
}

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [prs, setPrs]           = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.sessions.list(), api.sessions.prs()])
      .then(([s, p]) => { setSessions(s); setPrs(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const lastStart = subWeeks(weekStart, 1);
  const thisSess  = sessions.filter(s => new Date(s.date) >= weekStart);
  const lastSess  = sessions.filter(s => { const d = new Date(s.date); return d >= lastStart && d < weekStart; });
  const thisVol   = thisSess.reduce((a, s) => a + vol(s), 0);
  const lastVol   = lastSess.reduce((a, s) => a + vol(s), 0);
  const totalVol  = sessions.reduce((a, s) => a + vol(s), 0);

  if (loading) return <Skeleton />;

  return (
    <PageTransition>
      <div className="px-4 pt-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <p className="label mb-3">{format(new Date(), 'EEE, MMM d · yyyy')}</p>
          <h1
            className="font-black text-white tracking-tighter"
            style={{ fontSize: '3.8rem', lineHeight: 0.86 }}
          >
            DASHBOARD
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          variants={list}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-2.5 mb-8"
        >
          <motion.div variants={fade} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="card col-span-2 p-4 flex justify-between items-center"
          >
            <div>
              <p className="label mb-2">Total Volume</p>
              <VolumeCounter value={totalVol} />
            </div>
            <div className="text-right">
              <p className="label mb-2">Sessions</p>
              <CounterNum target={sessions.length} />
            </div>
          </motion.div>

          <BigStat value={prs.length} label="Records" delay={0.1} />
          <BigStat value={thisSess.length} label="This Week" delay={0.15} />
        </motion.div>

        {/* ── Personal Records ── */}
        {prs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="label">Personal Records</p>
              <Link href="/exercises" className="label" style={{ color: 'rgba(255,255,255,0.15)' }}>ALL →</Link>
            </div>
            <motion.div
              variants={list} initial="hidden" animate="show"
              className="flex gap-2.5 overflow-x-auto"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}
            >
              {prs.slice(0, 8).map((pr) => (
                <motion.div
                  key={pr.exerciseId}
                  variants={fade}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.96 }}
                >
                  <PRCard {...pr} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Week Comparison ── */}
        {(thisVol > 0 || lastVol > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <p className="label mb-3">Week Overview</p>
            <WeekComparison
              thisWeek={{ volume: thisVol, sessions: thisSess.length }}
              lastWeek={{ volume: lastVol, sessions: lastSess.length }}
            />
          </motion.div>
        )}

        {/* ── Recent Sessions ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.34, ease: [0.16, 1, 0.3, 1] }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="label">Recent</p>
            {sessions.length > 4 && (
              <Link href="/history" className="label" style={{ color: 'rgba(255,255,255,0.15)' }}>ALL →</Link>
            )}
          </div>

          {sessions.length === 0 ? (
            <Empty />
          ) : (
            <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {sessions.slice(0, 4).map(s => (
                <motion.div
                  key={s._id}
                  variants={fade}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  whileTap={{ scale: 0.98 }}
                >
                  <SessionCard session={s} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

      </div>
    </PageTransition>
  );
}

function VolumeCounter({ value }) {
  const isTons = value >= 1000;
  const num    = isTons ? value / 1000 : value;
  const count  = useCounter(Math.floor(num));
  return (
    <p className="num font-black text-white" style={{ fontSize: '2.4rem', lineHeight: 1 }}>
      {isTons ? count.toFixed ? `${count}` : count : count.toLocaleString()}
      <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {isTons ? 't' : 'kg'}
      </span>
    </p>
  );
}

function CounterNum({ target }) {
  const count = useCounter(target);
  return (
    <p className="num font-black text-white" style={{ fontSize: '2.4rem', lineHeight: 1 }}>{count}</p>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center py-14 gap-4">
      <p className="label">No sessions yet</p>
      <Link href="/log" className="btn btn-ghost px-7 py-3.5">Log First Session</Link>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-16 w-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="grid grid-cols-2 gap-2.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    </div>
  );
}
