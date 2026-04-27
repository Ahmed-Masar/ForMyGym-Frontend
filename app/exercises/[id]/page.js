'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useCounter } from '@/hooks/useCounter';
import ExerciseChart from '@/components/ExerciseChart';
import PageTransition from '@/components/PageTransition';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.065 } } };

export default function ExerciseDetailPage() {
  const { id } = useParams();
  const [exercise, setExercise]       = useState(null);
  const [progression, setProgression] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([api.exercises.list(), api.sessions.exercise(id)])
      .then(([all, prog]) => {
        setExercise(all.find(e => e._id === id) || null);
        setProgression(prog);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

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
                    className="card flex items-center justify-between px-4 py-3.5"
                  >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      {format(new Date(p.date), 'MMM d, yyyy')}
                    </span>
                    <div className="flex gap-5">
                      <div className="text-right">
                        <p className="num font-bold text-white" style={{ fontSize: 14 }}>
                          {p.maxWeight}
                          <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2, color: 'rgba(255,255,255,0.35)' }}>kg</span>
                        </p>
                        <p className="label" style={{ fontSize: 8 }}>MAX</p>
                      </div>
                      <div className="text-right">
                        <p className="num font-bold" style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
                          {p.volume.toLocaleString()}
                          <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 2, color: 'rgba(255,255,255,0.22)' }}>kg</span>
                        </p>
                        <p className="label" style={{ fontSize: 8 }}>VOL</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <div className="h-4" />
          </div>
        )}
      </div>
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
