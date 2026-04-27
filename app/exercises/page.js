'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import BottomSheet from '@/components/BottomSheet';
import PageTransition from '@/components/PageTransition';
import { useCounter } from '@/hooks/useCounter';

const CATEGORIES = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Other'];
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

  useEffect(() => {
    api.exercises.list().then(setExercises).catch(console.error).finally(() => setLoading(false));
  }, []);

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
    finally { setDeleting(null); }
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
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
                          <motion.button whileTap={{ scale: 0.95 }} onClick={() => openEdit(ex)}
                            className="btn btn-ghost px-3.5 py-2" style={{ fontSize: 11 }}>Edit</motion.button>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => remove(ex._id)}
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
