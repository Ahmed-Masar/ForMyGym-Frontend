'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import BottomSheet from '@/components/BottomSheet';
import ConfirmDialog from '@/components/ConfirmDialog';
import DatePicker from '@/components/DatePicker';
import PageTransition from '@/components/PageTransition';
import { useCounter } from '@/hooks/useCounter';
import { usePullToRefresh } from '@/components/PullToRefresh';

const emptySet = () => ({ reps: '', weight: '' });

const CATEGORIES = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio', 'Other'];
const DAYS = [
  { id: 1, label: 'Chest & Biceps', categories: ['Chest', 'Biceps'] },
  { id: 2, label: 'Back & Triceps', categories: ['Back', 'Triceps'] },
  { id: 3, label: 'Shoulders', categories: ['Shoulders'] },
  { id: 4, label: 'Legs', categories: ['Legs'] },
];
const fade = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const list = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

export default function ExercisesPage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ name: '', category: 'Other' });
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [activeDay, setActiveDay] = useState(null);

  const [logEx, setLogEx]         = useState(null);
  const [logDate, setLogDate]     = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logSets, setLogSets]     = useState([emptySet()]);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError]   = useState('');
  const [logSaved, setLogSaved]   = useState(false);

  const load = useCallback(() => api.exercises.list().then(setExercises), []);

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  const count = useCounter(exercises.length);

  function openAdd()  { setEditing(null);  setForm({ name: '', category: 'Other' }); setSheetOpen(true); }
  function openEdit(ex) { setEditing(ex); setForm({ name: ex.name, category: ex.category }); setSheetOpen(true); }

  async function submit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const u = await api.exercises.update(editing._id, form);
        setExercises(p => p.map(e => e._id === editing._id ? u : e));
      } else {
        const c = await api.exercises.create(form);
        setExercises(p => [...p, c].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setSheetOpen(false);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function remove(id) {
    setDeleting(id);
    try { await api.exercises.remove(id); setExercises(p => p.filter(e => e._id !== id)); }
    finally { setDeleting(null); setConfirming(null); }
  }

  function openLog(ex) {
    setLogEx(ex);
    setLogDate(format(new Date(), 'yyyy-MM-dd'));
    setLogSets([emptySet()]);
    setLogError('');
    setLogSaved(false);
  }

  const addLogSet    = () => setLogSets(p => [...p, emptySet()]);
  const removeLogSet = (i) => setLogSets(p => { const n = p.filter((_, j) => j !== i); return n.length ? n : [emptySet()]; });
  const updLogSet     = (i, f, v) => setLogSets(p => p.map((s, j) => j === i ? { ...s, [f]: v } : s));

  async function saveLog() {
    const filtered = logSets.filter(s => s.reps && s.weight).map(s => ({ reps: +s.reps, weight: +s.weight }));
    if (!filtered.length) { setLogError('Add at least one set.'); return; }
    setLogError('');
    setLogSaving(true);
    try {
      await api.sessions.log({ date: new Date(logDate).toISOString(), exerciseId: logEx._id, sets: filtered });
      setLogSaved(true);
      setTimeout(() => setLogEx(null), 600);
    } catch (err) { setLogError(err.message); }
    finally { setLogSaving(false); }
  }

  const activeCategories = activeDay ? DAYS.find(d => d.id === activeDay).categories : CATEGORIES;
  const grouped = CATEGORIES.filter(cat => activeCategories.includes(cat)).reduce((acc, cat) => {
    const list = exercises.filter(e => e.category === cat);
    if (list.length) acc[cat] = list;
    return acc;
  }, {});

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
          <p className="label mb-3"><span className="num">{count}</span> exercises</p>
          <div className="flex items-end justify-between">
            <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3rem', lineHeight: 0.86 }}>
              EXERCISES
            </h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={openAdd}
              className="btn btn-primary px-5 py-3 mb-1"
            >
              + New
            </motion.button>
          </div>
          <div className="mt-4 section-line" />
        </motion.div>

        {/* Day Filter */}
        <div
          className="flex gap-2 mb-6 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}
        >
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setActiveDay(null)}
            className={`chip shrink-0 ${activeDay === null ? 'chip-active' : ''}`}
            style={{ fontSize: 11, padding: '7px 14px' }}
          >
            All
          </motion.button>
          {DAYS.map(d => (
            <motion.button
              key={d.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveDay(activeDay === d.id ? null : d.id)}
              className={`chip shrink-0 ${activeDay === d.id ? 'chip-active' : ''}`}
              style={{ fontSize: 11, padding: '7px 14px' }}
            >
              Day {d.id} · {d.label}
            </motion.button>
          ))}
        </div>

        {exercises.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <p className="label">No exercises yet</p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd} className="btn btn-ghost px-7 py-3.5">
              Add First Exercise
            </motion.button>
          </motion.div>
        ) : Object.keys(grouped).length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 gap-4"
          >
            <p className="label">No exercises for this day</p>
          </motion.div>
        ) : (
          <motion.div variants={list} initial="hidden" animate="show" className="flex flex-col gap-7">
            {Object.entries(grouped).map(([cat, list]) => (
              <motion.div
                key={cat}
                variants={fade}
                transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="label mb-2.5">{cat}</p>
                <div className="flex flex-col gap-2">
                  <AnimatePresence>
                    {list.map(ex => (
                      <motion.div
                        key={ex._id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10, scale: 0.97 }}
                        transition={{ duration: 0.3 }}
                        whileTap={{ scale: 0.98 }}
                        className="card flex items-center justify-between px-4 py-3.5"
                      >
                        <Link href={`/exercises/${ex._id}`}
                          className="font-semibold text-white flex-1" style={{ fontSize: 15 }}>
                          {ex.name}
                        </Link>
                        <div className="flex gap-2 shrink-0">
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => openLog(ex)}
                            className="btn btn-primary px-3.5 py-2" style={{ fontSize: 11 }}>Log</motion.button>
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(ex)}
                            className="btn btn-ghost px-3.5 py-2" style={{ fontSize: 11 }}>Edit</motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfirming(ex)}
                            disabled={deleting === ex._id}
                            className="btn btn-danger px-3.5 py-2"
                            style={{ fontSize: 11, opacity: deleting === ex._id ? 0.5 : 1 }}
                          >
                            {deleting === ex._id ? '…' : '×'}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="h-6" />
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Edit Exercise' : 'New Exercise'}
      >
        <form onSubmit={submit} className="px-5 pt-5 pb-2 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Exercise name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="inp"
            autoFocus
            required
          />
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="inp"
            style={{ colorScheme: 'dark' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={saving}
            className="btn btn-primary w-full py-4 mt-1"
            style={{ opacity: saving ? 0.4 : 1 }}
          >
            {saving ? '...' : editing ? 'Save Changes' : 'Add Exercise'}
          </motion.button>
        </form>
      </BottomSheet>

      <ConfirmDialog
        open={!!confirming}
        title="Delete Exercise"
        message={confirming ? `Delete "${confirming.name}"? This cannot be undone.` : ''}
        loading={deleting === confirming?._id}
        onConfirm={() => remove(confirming._id)}
        onCancel={() => setConfirming(null)}
      />

      {/* Quick Log Sheet — log sets for an exercise without leaving this page */}
      <BottomSheet
        open={!!logEx}
        onClose={() => setLogEx(null)}
        title={logEx ? `Log · ${logEx.name}` : ''}
      >
        {logEx && (
          <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
            <DatePicker value={logDate} onChange={setLogDate} />

            <div className="grid grid-cols-11 gap-2 mt-1">
              <span className="col-span-1" />
              <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>REPS</span>
              <span className="col-span-1" />
              <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>KG</span>
              <span className="col-span-1" />
            </div>

            <AnimatePresence>
              {logSets.map((set, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-11 gap-2 items-center"
                >
                  <span className="col-span-1 num text-center" style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                    {i + 1}
                  </span>
                  <input
                    type="number" inputMode="numeric" placeholder="10"
                    value={set.reps}
                    onChange={e => updLogSet(i, 'reps', e.target.value)}
                    className="col-span-4 inp text-center num"
                    style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                  />
                  <span className="col-span-1 text-center" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>×</span>
                  <input
                    type="number" inputMode="decimal" placeholder="60"
                    value={set.weight}
                    onChange={e => updLogSet(i, 'weight', e.target.value)}
                    step="0.5"
                    className="col-span-4 inp text-center num"
                    style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                  />
                  <button
                    onClick={() => removeLogSet(i)}
                    className="col-span-1 text-center"
                    style={{ color: 'rgba(255,255,255,0.18)', fontSize: 20, lineHeight: 1 }}
                  >×</button>
                </motion.div>
              ))}
            </AnimatePresence>

            <motion.button whileTap={{ scale: 0.96 }} onClick={addLogSet} className="btn btn-ghost w-full py-3 mt-1">
              + Add Set
            </motion.button>

            {logError && (
              <p style={{ fontSize: 12, color: 'rgba(255,80,80,0.75)' }}>{logError}</p>
            )}
            {logSaved && !logSaving && (
              <p className="label" style={{ fontSize: 12, color: 'rgba(120,255,150,0.7)' }}>Saved ✓</p>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={saveLog}
              disabled={logSaving}
              className="btn btn-primary w-full py-4 mt-1"
              style={{ fontSize: 14, opacity: logSaving ? 0.32 : 1 }}
            >
              {logSaving ? 'Saving...' : 'Save'}
            </motion.button>

            <div className="h-2" />
          </div>
        )}
      </BottomSheet>
    </PageTransition>
  );
}

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-12 w-48 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      ))}
    </div>
  );
}
