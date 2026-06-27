'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import DatePicker from '@/components/DatePicker';
import BottomSheet from '@/components/BottomSheet';
import PageTransition from '@/components/PageTransition';

const EXERCISES = ['Extensors', 'Flexors', 'Brachioradialis'];

const emptySet = () => ({ reps: '', weight: '' });
const emptyExercises = () => EXERCISES.map((name) => ({ name, sets: [emptySet()] }));
const hasSets = (log) => log.exercises.some((e) => e.sets.length > 0);

export default function ForearmPage() {
  const [date, setDate]       = useState(format(new Date(), 'yyyy-MM-dd'));
  const [exercises, setExercises] = useState(emptyExercises());
  const [logs, setLogs]       = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [streak, setStreak]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);

  const refreshLogs = useCallback(() => {
    api.forearm.list().then((all) => setLogs(all.filter(hasSets))).catch(console.error);
    api.forearm.streak().then((r) => setStreak(r.streak)).catch(console.error);
  }, []);

  useEffect(() => { refreshLogs(); }, [refreshLogs]);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    api.forearm.byDate(date)
      .then((log) => {
        if (!log) { setExercises(emptyExercises()); return; }
        setExercises(EXERCISES.map((name) => {
          const found = log.exercises.find((e) => e.name === name);
          const sets = found?.sets.map((s) => ({ reps: String(s.reps), weight: String(s.weight) })) || [];
          return { name, sets: sets.length ? sets : [emptySet()] };
        }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  const addSet    = (name) => setExercises((p) => p.map((e) => e.name === name ? { ...e, sets: [...e.sets, emptySet()] } : e));
  const removeSet = (name, i) => setExercises((p) => p.map((e) => {
    if (e.name !== name) return e;
    const sets = e.sets.filter((_, j) => j !== i);
    return { ...e, sets: sets.length ? sets : [emptySet()] };
  }));
  const updSet = (name, i, f, v) => setExercises((p) => p.map((e) =>
    e.name !== name ? e : { ...e, sets: e.sets.map((set, j) => j === i ? { ...set, [f]: v } : set) }
  ));

  const save = useCallback(async () => {
    setError('');
    setSaving(true);
    try {
      await api.forearm.save({
        date: new Date(date).toISOString(),
        exercises: exercises
          .map((e) => ({ name: e.name, sets: e.sets.filter((s) => s.reps && s.weight).map((s) => ({ reps: +s.reps, weight: +s.weight })) }))
          .filter((e) => e.sets.length),
      });
      setSaved(true);
      refreshLogs();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }, [date, exercises, refreshLogs]);

  async function deleteLog(id) {
    setDeleting(id);
    try {
      await api.forearm.remove(id);
      setSelectedLog(null);
      refreshLogs();
      if (selectedLog && isSameDay(new Date(selectedLog.date), new Date(date))) {
        setExercises(emptyExercises());
      }
    } finally { setDeleting(null); }
  }

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
          <p className="label mb-3">Daily Habit</p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.6rem', lineHeight: 0.86 }}>
            FOREARM
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-6"
        >
          {/* Streak */}
          <div className="card flex items-center justify-between px-5 py-4">
            <span className="label">Streak</span>
            <span className="num font-black text-white" style={{ fontSize: '1.6rem' }}>
              {streak}
              <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {streak === 1 ? 'day' : 'days'}
              </span>
            </span>
          </div>

          {/* Date */}
          <div>
            <p className="label mb-2">Date</p>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Fixed exercises */}
          <AnimatePresence>
            {!loading && exercises.map((ex) => (
              <motion.div
                key={ex.name}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="card overflow-hidden"
              >
                <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="font-bold text-white" style={{ fontSize: 15 }}>{ex.name}</span>
                </div>

                <div className="px-4 pt-3 pb-4 flex flex-col gap-2.5">
                  <div className="grid grid-cols-11 gap-2">
                    <span className="col-span-1" />
                    <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>REPS</span>
                    <span className="col-span-1" />
                    <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>KG</span>
                    <span className="col-span-1" />
                  </div>

                  <AnimatePresence>
                    {ex.sets.map((set, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.25 }}
                        className="grid grid-cols-11 gap-2 items-center"
                      >
                        <span className="col-span-1 num text-center" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                          {i + 1}
                        </span>
                        <input
                          type="number" inputMode="numeric" placeholder="10"
                          value={set.reps}
                          onChange={(e) => updSet(ex.name, i, 'reps', e.target.value)}
                          className="col-span-4 inp text-center num"
                          style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                        />
                        <span className="col-span-1 text-center" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>×</span>
                        <input
                          type="number" inputMode="decimal" placeholder="0"
                          value={set.weight}
                          onChange={(e) => updSet(ex.name, i, 'weight', e.target.value)}
                          step="0.5"
                          className="col-span-4 inp text-center num"
                          style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                        />
                        <button
                          onClick={() => removeSet(ex.name, i)}
                          className="col-span-1 text-center"
                          style={{ color: 'rgba(255,255,255,0.18)', fontSize: 20, lineHeight: 1 }}
                        >×</button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => addSet(ex.name)}
                    className="btn btn-ghost w-full py-3 mt-1"
                  >
                    + Add Set
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 12, color: 'rgba(255,80,80,0.75)' }}
            >{error}</motion.p>
          )}

          {saved && !saving && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 12, color: 'rgba(120,255,150,0.7)' }}
              className="label"
            >Saved ✓</motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving || loading}
            className="btn btn-primary w-full py-4"
            style={{ fontSize: 14, opacity: saving || loading ? 0.32 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>

          {/* History */}
          <div>
            <p className="label mb-3">History</p>
            {logs.length === 0 ? (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>No logged days yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {logs.map((log) => (
                  <button
                    key={log._id}
                    className="card w-full text-left flex items-center gap-3 px-4 py-4"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="shrink-0 flex flex-col items-center justify-center" style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: 'rgba(255,255,255,0.055)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}>
                      <span className="label" style={{ fontSize: 8 }}>{format(new Date(log.date), 'MMM')}</span>
                      <span className="num font-black text-white" style={{ fontSize: 20, lineHeight: 1 }}>
                        {format(new Date(log.date), 'd')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white" style={{ fontSize: 15 }}>
                        {format(new Date(log.date), 'EEEE')}
                      </p>
                      <p className="num mt-0.5" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                        {log.exercises.filter((e) => e.sets.length).map((e) => e.name).join(' · ')}
                      </p>
                    </div>

                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18 }}>›</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-2" />
        </motion.div>
      </div>

      {/* Day detail sheet */}
      <BottomSheet
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? format(new Date(selectedLog.date), 'EEE, MMM d · yyyy') : ''}
      >
        {selectedLog && (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-4">
            {selectedLog.exercises.filter((e) => e.sets.length).map((ex) => (
              <div key={ex.name}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className="font-bold text-white" style={{ fontSize: 14 }}>{ex.name}</span>
                  <span className="num label">{Math.max(...ex.sets.map((s) => s.weight))}kg max</span>
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
              </div>
            ))}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => deleteLog(selectedLog._id)}
              disabled={deleting === selectedLog._id}
              className="btn btn-danger w-full py-4 mt-2"
              style={{ opacity: deleting === selectedLog._id ? 0.4 : 1 }}
            >
              {deleting === selectedLog._id ? 'Deleting...' : 'Delete Day'}
            </motion.button>
          </div>
        )}
      </BottomSheet>
    </PageTransition>
  );
}
