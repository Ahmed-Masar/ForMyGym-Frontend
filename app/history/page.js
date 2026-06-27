'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useCounter } from '@/hooks/useCounter';
import BottomSheet from '@/components/BottomSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTransition from '@/components/PageTransition';
import { usePullToRefresh } from '@/components/PullToRefresh';

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.055 } } };

const vol = s => s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const load = useCallback(() => api.sessions.list().then(setSessions), []);

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  async function del(id) {
    setDeleting(id);
    try { await api.sessions.remove(id); setSessions(p => p.filter(s => s._id !== id)); setSelected(null); }
    finally { setDeleting(null); setConfirmDel(false); }
  }

  const totalCount = useCounter(sessions.length);

  if (loading) return <Skeleton />;

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
          <p className="label mb-3">
            <span className="num">{totalCount}</span> sessions
          </p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.4rem', lineHeight: 0.86 }}>
            HISTORY
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <p className="label">No sessions yet</p>
            <a href="/exercises" className="btn btn-ghost px-7 py-3.5">Log Session</a>
          </motion.div>
        ) : (
          <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-2.5">
            {sessions.map(session => (
              <motion.div
                key={session._id}
                variants={fade}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  className="card w-full text-left flex items-center gap-3 px-4 py-4"
                  onClick={() => setSelected(session)}
                >
                  {/* Date pill */}
                  <div className="shrink-0 flex flex-col items-center justify-center" style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: 'rgba(255,255,255,0.055)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}>
                    <span className="label" style={{ fontSize: 8 }}>{format(new Date(session.date), 'MMM')}</span>
                    <span className="num font-black text-white" style={{ fontSize: 20, lineHeight: 1 }}>
                      {format(new Date(session.date), 'd')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white" style={{ fontSize: 15 }}>
                      {format(new Date(session.date), 'EEEE')}
                    </p>
                    <p className="num mt-0.5" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                      {session.exercises.length} exercises · {vol(session).toLocaleString()} kg
                    </p>
                  </div>

                  <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="h-6" />
      </div>

      {/* Session Detail Sheet */}
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
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-14 w-40 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      ))}
    </div>
  );
}
