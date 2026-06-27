'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import DatePicker from '@/components/DatePicker';
import PageTransition from '@/components/PageTransition';
import { usePullToRefresh } from '@/components/PullToRefresh';

const emptySet = () => ({ reps: '', weight: '' });

export default function LogPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState([]);
  const [selected, setSelected]   = useState([]);
  const [date, setDate]           = useState(format(new Date(), 'yyyy-MM-dd'));
  const [category, setCategory]   = useState('All');
  const [search, setSearch]       = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const load = useCallback(() => api.exercises.list().then(setExercises), []);

  useEffect(() => { load().catch(console.error); }, [load]);
  usePullToRefresh(load);

  // Build category list from actual exercises
  const categories = ['All', ...Array.from(new Set(exercises.map(e => e.category))).sort()];

  const filtered = exercises.filter(e => {
    const matchCat  = category === 'All' || e.category === category;
    const matchText = e.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchText;
  });

  const isSel = id => selected.some(s => s.exerciseId === id);

  const toggle = ex => {
    if (isSel(ex._id)) setSelected(p => p.filter(s => s.exerciseId !== ex._id));
    else setSelected(p => [...p, { exerciseId: ex._id, name: ex.name, sets: [emptySet()] }]);
  };

  const addSet    = id => setSelected(p => p.map(s => s.exerciseId === id ? { ...s, sets: [...s.sets, emptySet()] } : s));
  const removeSet = (id, i) => setSelected(p => p.map(s => {
    if (s.exerciseId !== id) return s;
    const sets = s.sets.filter((_, j) => j !== i);
    return { ...s, sets: sets.length ? sets : [emptySet()] };
  }));
  const updSet = (id, i, f, v) => setSelected(p => p.map(s =>
    s.exerciseId !== id ? s : { ...s, sets: s.sets.map((set, j) => j === i ? { ...set, [f]: v } : set) }
  ));

  const totalVol = selected.reduce((t, ex) =>
    t + ex.sets.reduce((s, set) => s + (parseFloat(set.reps) || 0) * (parseFloat(set.weight) || 0), 0), 0);

  async function save() {
    if (!selected.length) { setError('Add at least one exercise.'); return; }
    setError('');
    setSaving(true);
    try {
      await api.sessions.create({
        date: new Date(date).toISOString(),
        exercises: selected.map(ex => ({
          exercise: ex.exerciseId,
          sets: ex.sets.filter(s => s.reps && s.weight).map(s => ({ reps: +s.reps, weight: +s.weight })),
        })).filter(ex => ex.sets.length),
      });
      router.push('/');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
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
          <p className="label mb-3">New Session</p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.6rem', lineHeight: 0.86 }}>
            LOG
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col gap-6"
        >
          {/* Date */}
          <div>
            <p className="label mb-2">Date</p>
            <DatePicker value={date} onChange={setDate} />
          </div>

          {/* Exercise picker */}
          <div>
            <p className="label mb-3">Select Exercises</p>

            {/* Category filter tabs */}
            <div
              className="flex gap-2 mb-3 overflow-x-auto"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}
            >
              {categories.map(cat => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCategory(cat)}
                  className={`chip shrink-0 ${category === cat ? 'chip-active' : ''}`}
                  style={{ fontSize: 11, padding: '7px 14px' }}
                >
                  {cat}
                </motion.button>
              ))}
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="inp mb-3"
            />

            {/* Exercise chips */}
            <AnimatePresence mode="wait">
              {filtered.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}
                >
                  No exercises.{' '}
                  <a href="/exercises" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'underline' }}>Add one →</a>
                </motion.p>
              ) : (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex flex-wrap gap-2"
                >
                  {filtered.map(ex => (
                    <motion.button
                      key={ex._id}
                      layout
                      whileTap={{ scale: 0.94 }}
                      onClick={() => toggle(ex)}
                      className={`chip ${isSel(ex._id) ? 'chip-active' : ''}`}
                    >
                      {ex.name}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sets per exercise */}
          <AnimatePresence>
            {selected.map(ex => (
              <motion.div
                key={ex.exerciseId}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="card overflow-hidden"
              >
                <div className="px-4 pt-4 pb-3 flex items-center justify-between"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="font-bold text-white" style={{ fontSize: 15 }}>{ex.name}</span>
                  <button
                    onClick={() => setSelected(p => p.filter(s => s.exerciseId !== ex.exerciseId))}
                    className="label" style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}
                  >REMOVE</button>
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
                          onChange={e => updSet(ex.exerciseId, i, 'reps', e.target.value)}
                          className="col-span-4 inp text-center num"
                          style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                        />
                        <span className="col-span-1 text-center" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>×</span>
                        <input
                          type="number" inputMode="decimal" placeholder="60"
                          value={set.weight}
                          onChange={e => updSet(ex.exerciseId, i, 'weight', e.target.value)}
                          step="0.5"
                          className="col-span-4 inp text-center num"
                          style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
                        />
                        <button
                          onClick={() => removeSet(ex.exerciseId, i)}
                          className="col-span-1 text-center"
                          style={{ color: 'rgba(255,255,255,0.18)', fontSize: 20, lineHeight: 1 }}
                        >×</button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => addSet(ex.exerciseId)}
                    className="btn btn-ghost w-full py-3 mt-1"
                  >
                    + Add Set
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Volume preview */}
          <AnimatePresence>
            {totalVol > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="card flex items-center justify-between px-5 py-4"
              >
                <span className="label">Session Volume</span>
                <span className="num font-black text-white" style={{ fontSize: '1.6rem' }}>
                  {totalVol.toLocaleString()}
                  <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ fontSize: 12, color: 'rgba(255,80,80,0.75)' }}
            >{error}</motion.p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving || !selected.length}
            className="btn btn-primary w-full py-4"
            style={{ fontSize: 14, opacity: saving || !selected.length ? 0.32 : 1 }}
          >
            {saving ? 'Saving...' : 'Save Session'}
          </motion.button>

          <div className="h-2" />
        </motion.div>
      </div>
    </PageTransition>
  );
}
