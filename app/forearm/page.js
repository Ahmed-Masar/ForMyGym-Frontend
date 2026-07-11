'use client';
import { useState, useEffect, useCallback } from 'react';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import DatePicker from '@/components/DatePicker';
import BottomSheet from '@/components/BottomSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import PageTransition from '@/components/PageTransition';
import SetEditor, { newSet, toPayload, cloneLastSet } from '@/components/SetEditor';
import { usePullToRefresh } from '@/components/PullToRefresh';
import { currentGymDayKey } from '@/lib/gymDay';

const EXERCISES = ['Extensors', 'Flexors', 'Brachioradialis'];

const emptyExercises = () => EXERCISES.map((name) => ({ name, sets: [newSet()] }));
const hasSets = (log) => log.exercises.some((e) => e.sets.length > 0);

export default function ForearmPage() {
  const [date, setDate]       = useState(currentGymDayKey());
  const [exercises, setExercises] = useState(emptyExercises());
  const [logs, setLogs]       = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [streak, setStreak]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [saved, setSaved]     = useState(false);
  const [cardStatus, setCardStatus] = useState({}); // { [exercise name]: 'saving' | 'saved' }

  const refreshLogs = useCallback(() => Promise.all([
    api.forearm.list().then((all) => setLogs(all.filter(hasSets))),
    api.forearm.streak(currentGymDayKey()).then((r) => setStreak(r.streak)),
  ]), []);

  const fetchDate = useCallback((d) => api.forearm.byDate(d).then((log) => {
    if (!log) { setExercises(emptyExercises()); return; }
    setExercises(EXERCISES.map((name) => {
      const found = log.exercises.find((e) => e.name === name);
      const sets = found?.sets.map((s) => newSet(String(s.reps), String(s.weight))) || [];
      return { name, sets: sets.length ? sets : [newSet()] };
    }));
  }), []);

  useEffect(() => { refreshLogs().catch(console.error); }, [refreshLogs]);

  const refreshAll = useCallback(() =>
    Promise.all([refreshLogs(), fetchDate(date)]),
  [refreshLogs, fetchDate, date]);
  usePullToRefresh(refreshAll);

  useEffect(() => {
    setLoading(true);
    setSaved(false);
    setCardStatus({});
    fetchDate(date)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  // Editing a card invalidates its "Saved ✓" badge
  const markDirty = (name) => setCardStatus((s) => {
    if (!(name in s)) return s;
    const next = { ...s };
    delete next[name];
    return next;
  });

  const addSet    = (name) => { markDirty(name); setExercises((p) => p.map((e) => e.name === name ? { ...e, sets: [...e.sets, cloneLastSet(e.sets)] } : e)); };
  const removeSet = (name, i) => { markDirty(name); setExercises((p) => p.map((e) => {
    if (e.name !== name) return e;
    const sets = e.sets.filter((_, j) => j !== i);
    return { ...e, sets: sets.length ? sets : [newSet()] };
  })); };
  const updSet = (name, i, f, v) => { markDirty(name); setExercises((p) => p.map((e) =>
    e.name !== name ? e : { ...e, sets: e.sets.map((set, j) => j === i ? { ...set, [f]: v } : set) }
  )); };

  // Saves the given exercises (or all of them) into the same day log — the
  // server merges per exercise name, so saving one card at a time still keeps
  // the whole day as a single log.
  const saveExercises = useCallback(async (names) => {
    document.activeElement?.blur?.();
    setError('');
    const targets = names || EXERCISES;
    if (names) setCardStatus((s) => ({ ...s, ...Object.fromEntries(names.map((n) => [n, 'saving'])) }));
    else { setSaving(true); setSaved(false); }
    try {
      await api.forearm.save({
        dateKey: date,
        exercises: exercises
          .filter((e) => targets.includes(e.name))
          .map((e) => ({ name: e.name, sets: toPayload(e.sets) })),
      });
      setCardStatus((s) => ({ ...s, ...Object.fromEntries(targets.map((n) => [n, 'saved'])) }));
      if (!names) setSaved(true);
      refreshLogs();
    } catch (err) {
      setError(err.message);
      if (names) setCardStatus((s) => { const next = { ...s }; names.forEach((n) => delete next[n]); return next; });
    } finally { if (!names) setSaving(false); }
  }, [date, exercises, refreshLogs]);

  const save = useCallback(() => saveExercises(null), [saveExercises]);

  const totalSets = exercises.reduce((n, e) => n + toPayload(e.sets).length, 0);

  function editLog(log) {
    setDate(format(new Date(log.date), 'yyyy-MM-dd'));
    setSelectedLog(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteLog(id) {
    setDeleting(id);
    try {
      await api.forearm.remove(id);
      setSelectedLog(null);
      refreshLogs();
      if (selectedLog && isSameDay(new Date(selectedLog.date), new Date(date))) {
        setExercises(emptyExercises());
        setCardStatus({});
      }
    } finally { setDeleting(null); setConfirmDel(false); }
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
                <div className="px-4 pt-3.5 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="font-bold text-white" style={{ fontSize: 15 }}>{ex.name}</span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => saveExercises([ex.name])}
                    disabled={cardStatus[ex.name] === 'saving'}
                    className="btn btn-ghost px-3.5 py-2"
                    style={{
                      fontSize: 10,
                      ...(cardStatus[ex.name] === 'saved'
                        ? { color: 'rgba(120,255,150,0.7)', borderColor: 'rgba(120,255,150,0.22)' }
                        : {}),
                    }}
                  >
                    {cardStatus[ex.name] === 'saving' ? '...' : cardStatus[ex.name] === 'saved' ? 'Saved ✓' : 'Save'}
                  </motion.button>
                </div>

                <div className="px-4 pt-3 pb-4">
                  <SetEditor
                    sets={ex.sets}
                    onAdd={() => addSet(ex.name)}
                    onRemove={(i) => removeSet(ex.name, i)}
                    onUpdate={(i, f, v) => updSet(ex.name, i, f, v)}
                  />
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
            {saving ? 'Saving...' : totalSets ? `Save Day · ${totalSets} ${totalSets === 1 ? 'Set' : 'Sets'}` : 'Save Day'}
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
        onClose={() => { setSelectedLog(null); setConfirmDel(false); }}
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

            <div className="flex gap-2.5 mt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => editLog(selectedLog)}
                className="btn btn-primary flex-1 py-4"
              >
                Edit Day
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setConfirmDel(true)}
                disabled={deleting === selectedLog._id}
                className="btn btn-danger flex-1 py-4"
                style={{ opacity: deleting === selectedLog._id ? 0.4 : 1 }}
              >
                {deleting === selectedLog._id ? 'Deleting...' : 'Delete Day'}
              </motion.button>
            </div>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmDel}
        title="Delete Day"
        message="This day's forearm log will be permanently removed."
        loading={deleting === selectedLog?._id}
        onConfirm={() => deleteLog(selectedLog._id)}
        onCancel={() => setConfirmDel(false)}
      />
    </PageTransition>
  );
}
