'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useCounter } from '@/hooks/useCounter';
import ExerciseChart from '@/components/ExerciseChart';
import PageTransition from '@/components/PageTransition';
import BottomSheet from '@/components/BottomSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import { usePullToRefresh } from '@/components/PullToRefresh';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.065 } } };

const vol = s => s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const [exercise, setExercise]       = useState(null);
  const [progression, setProgression] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [confirmDel, setConfirmDel]   = useState(false);

  const load = useCallback(() =>
    Promise.all([api.exercises.list(), api.sessions.exercise(id)])
      .then(([all, prog]) => {
        setExercise(all.find(e => e._id === id) || null);
        setProgression(prog);
      }),
  [id]);

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  async function del(sessionId) {
    setDeleting(sessionId);
    try {
      await api.sessions.remove(sessionId);
      setProgression(p => p.filter(s => s._id !== sessionId));
      setSelected(null);
    } finally {
      setDeleting(null);
      setConfirmDel(false);
    }
  }

  const pr       = progression.length ? Math.max(...progression.map(p => p.maxWeight)) : 0;
  const totalVol = progression.reduce((a, p) => a + p.volume, 0);

  const prCount    = useCounter(pr);
  const sessCount  = useCounter(progression.length);
  const volCount   = useCounter(Math.floor(totalVol >= 1000 ? totalVol / 1000 : totalVol));

  if (loading) return <Skeleton />;

  if (!exercise) return (
    <div className="px-4 pt-12">
      <p className="label mb-4">Exercise not found</p>
      <Link href="/exercises" className="btn btn-ghost px-4 py-2.5">← Back</Link>
    </div>
  );

  return (
    <PageTransition>
      <div className="px-4 pt-8">

        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6"
        >
          <Link href="/exercises" className="label" style={{ color: 'rgba(255,255,255,0.22)' }}>
            ← EXERCISES
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <p className="label mb-2">{exercise.category}</p>
          <h1
            className="font-black text-white tracking-tighter"
            style={{ fontSize: 'clamp(2rem, 10vw, 3.4rem)', lineHeight: 0.88 }}
          >
            {exercise.name.toUpperCase()}
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        {progression.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <p className="label">No sessions logged yet</p>
            <Link href="/log" className="btn btn-ghost px-7 py-3.5">Log Session</Link>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5">

            {/* Stats */}
            <motion.div
              variants={list} initial="hidden" animate="show"
              className="grid grid-cols-3 gap-2.5"
            >
              {[
                { label: 'PR', value: prCount, suffix: 'kg', badge: true },
                { label: 'Sessions', value: sessCount, suffix: null },
                { label: 'Volume', value: volCount, suffix: totalVol >= 1000 ? 't' : 'kg' },
              ].map(({ label, value, suffix, badge }) => (
                <motion.div
                  key={label}
                  variants={fade}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="card p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="label" style={{ fontSize: 8 }}>{label.toUpperCase()}</span>
                    {badge && <span className="pr-badge">PR</span>}
                  </div>
                  <p className="num font-black text-white" style={{ fontSize: '1.9rem', lineHeight: 1 }}>
                    {value}
                    {suffix && (
                      <span className="font-normal ml-0.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
                        {suffix}
                      </span>
                    )}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Chart */}
            {progression.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="card p-4"
              >
                <p className="label mb-4">Progression</p>
                <ExerciseChart data={progression} />
              </motion.div>
            )}

            {/* Sessions list */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="label mb-3">All Sessions</p>
              <motion.div
                variants={list} initial="hidden" animate="show"
                className="flex flex-col gap-2"
              >
                {[...progression].reverse().map((p, i) => (
                  <motion.div
                    key={i}
                    variants={fade}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <button
                      className="card w-full text-left flex flex-col gap-2.5 px-4 py-3.5"
                      onClick={() => setSelected(p)}
                    >
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                          {format(new Date(p.date), 'MMM d, yyyy')}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 16 }}>›</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.sets.map((set, si) => (
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
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Day Session Sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => { setSelected(null); setConfirmDel(false); }}
        title={selected ? format(new Date(selected.date), 'EEE, MMM d · yyyy') : ''}
      >
        {selected && (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-4 py-3" style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
            }}>
              <span className="label">Volume</span>
              <span className="num font-black text-white" style={{ fontSize: '1.4rem' }}>
                {vol(selected).toLocaleString()}
                <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
              </span>
            </div>

            {selected.exercises.map((ex, i) => (
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
                {i < selected.exercises.length - 1 && (
                  <div className="mt-4 divider" />
                )}
              </div>
            ))}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmDel(true)}
              disabled={deleting === selected._id}
              className="btn btn-danger w-full py-4 mt-2"
              style={{ opacity: deleting === selected._id ? 0.4 : 1 }}
            >
              {deleting === selected._id ? 'Deleting...' : 'Delete Session'}
            </motion.button>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDel}
        title="Delete Session"
        message="This session and its logged sets will be permanently removed."
        loading={deleting === selected?._id}
        onConfirm={() => del(selected._id)}
        onCancel={() => setConfirmDel(false)}
      />
    </PageTransition>
  );
}

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-4">
      <div className="h-12 w-52 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="grid grid-cols-3 gap-2.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
      <div className="h-52 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
    </div>
  );
}
