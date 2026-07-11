'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { PROGRAM, getUpNext, getLastLog } from '@/lib/program';
import { progressStatus, targetFor } from '@/lib/progression';
import { currentGymDayKey, isLateNightGymDay, parseDayKey } from '@/lib/gymDay';
import DatePicker from '@/components/DatePicker';
import PageTransition from '@/components/PageTransition';
import PRCelebration from '@/components/PRCelebration';
import SetEditor, { newSet, toPayload, fromLogged, cloneLastSet } from '@/components/SetEditor';
import LoggedTodayBar from '@/components/LoggedTodayBar';
import { usePullToRefresh } from '@/components/PullToRefresh';

const EASE = [0.16, 1, 0.3, 1];
const CATEGORY_ORDER = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Cardio', 'Other'];

const norm = (s) => s.toLowerCase().trim();
const dateKeyOf = (s) => s.dateKey ?? new Date(s.date).toISOString().slice(0, 10);


function orderForDay(exercises, day) {
  const planNames = day.exercises.map(norm);
  const rank = (ex) => {
    const n = norm(ex.name);
    const i = planNames.findIndex((pn) => pn === n || pn.includes(n) || n.includes(pn));
    return i === -1 ? 999 : i;
  };
  return exercises
    .filter((ex) => day.categories.includes(ex.category))
    .sort((a, b) =>
      rank(a) - rank(b) ||
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      a.name.localeCompare(b.name));
}

export default function WorkoutPage() {
  const [exercises, setExercises] = useState([]);
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [dayNum, setDayNum]       = useState(null); // null until sessions load
  const [date, setDate]           = useState(currentGymDayKey());
  const [expanded, setExpanded]   = useState(null);
  const [drafts, setDrafts]       = useState({});   // { [exerciseId]: sets[] }
  const [notes, setNotes]         = useState({});   // { [exerciseId]: string }
  const [status, setStatus]       = useState({});   // { [exerciseId]: 'saving' | 'saved' }
  const [errors, setErrors]       = useState({});   // { [exerciseId]: message }
  const [pr, setPr]               = useState(null); // { name, weight } → celebration

  const load = useCallback(() =>
    Promise.all([api.exercises.list(), api.sessions.list()])
      .then(([ex, ss]) => {
        setExercises(ex);
        setSessions(ss);
        setDayNum((d) => d ?? getUpNext(ss).next.day);
      }),
  []);

  useEffect(() => { load().catch(console.error).finally(() => setLoading(false)); }, [load]);
  usePullToRefresh(load);

  const day = PROGRAM.find((d) => d.day === dayNum) ?? PROGRAM[0];
  const dayExercises = useMemo(() => orderForDay(exercises, day), [exercises, day]);

  const todaySession = useMemo(
    () => sessions.find((s) => dateKeyOf(s) === date) ?? null,
    [sessions, date],
  );

  const loggedSets = useCallback((exId) => {
    const entry = todaySession?.exercises.find((e) => (e.exercise?._id ?? e.exercise) === exId);
    return entry && entry.sets.length ? entry.sets : null;
  }, [todaySession]);

  const doneCount = dayExercises.filter((ex) => loggedSets(ex._id)).length;
  const dayVolume = todaySession
    ? todaySession.exercises.reduce((t, e) => t + e.sets.reduce((a, s) => a + s.reps * s.weight, 0), 0)
    : 0;

  // Changing the date invalidates drafts/statuses — they belong to a day.
  useEffect(() => { setDrafts({}); setNotes({}); setStatus({}); setErrors({}); setExpanded(null); }, [date]);

  // The saved note for this exercise on the current day, if any.
  const loggedNote = useCallback((exId) => {
    const entry = todaySession?.exercises.find((e) => (e.exercise?._id ?? e.exercise) === exId);
    return entry?.note ?? '';
  }, [todaySession]);

  function toggle(ex) {
    setExpanded((cur) => (cur === ex._id ? null : ex._id));
    setDrafts((d) => {
      if (d[ex._id]) return d;
      const logged = loggedSets(ex._id);
      return { ...d, [ex._id]: logged ? fromLogged(logged) : [newSet()] };
    });
    setNotes((n) => (n[ex._id] !== undefined ? n : { ...n, [ex._id]: loggedNote(ex._id) }));
  }

  const markDirty = (exId) => {
    setStatus((s) => (s[exId] === 'saved' ? { ...s, [exId]: undefined } : s));
    setErrors((e) => (e[exId] ? { ...e, [exId]: undefined } : e));
  };

  const addSet    = (exId) => { markDirty(exId); setDrafts((d) => ({ ...d, [exId]: [...d[exId], cloneLastSet(d[exId])] })); };
  const removeSet = (exId, i) => { markDirty(exId); setDrafts((d) => {
    const sets = d[exId].filter((_, j) => j !== i);
    return { ...d, [exId]: sets.length ? sets : [newSet()] };
  }); };
  const updSet = (exId, i, f, v) => { markDirty(exId); setDrafts((d) => ({
    ...d, [exId]: d[exId].map((s, j) => (j === i ? { ...s, [f]: v } : s)),
  })); };

  const useLast = (exId, last) => { markDirty(exId); setDrafts((d) => ({ ...d, [exId]: fromLogged(last.sets) })); };
  const updNote = (exId, v) => { markDirty(exId); setNotes((n) => ({ ...n, [exId]: v })); };

  // All-time heaviest weight logged for an exercise, ignoring the day being
  // edited — the baseline a new PR must beat.
  function prevMax(exId) {
    let m = 0;
    for (const s of sessions) {
      if (dateKeyOf(s) === date) continue;
      const entry = s.exercises.find((e) => (e.exercise?._id ?? e.exercise) === exId);
      if (entry) for (const set of entry.sets) if (set.weight > m) m = set.weight;
    }
    return m;
  }

  async function saveExercise(ex) {
    document.activeElement?.blur?.();
    const payload = toPayload(drafts[ex._id] || []);
    if (!payload.length) { setErrors((e) => ({ ...e, [ex._id]: 'Add at least one set — reps is required.' })); return; }
    setErrors((e) => ({ ...e, [ex._id]: undefined }));
    setStatus((s) => ({ ...s, [ex._id]: 'saving' }));

    // A PR is a heavier top set than anything logged before (needs history —
    // the very first log isn't a "record broken").
    const before = prevMax(ex._id);
    const topSet = Math.max(...payload.map((p) => p.weight));
    const isPR = before > 0 && topSet > before;

    const note = (notes[ex._id] || '').trim();
    try {
      let updated;
      if (todaySession) {
        // Replace this exercise's sets in the existing day session, so
        // re-saving after an edit never duplicates sets. Other exercises'
        // notes are preserved.
        const list = todaySession.exercises.map((e) => ({
          exercise: e.exercise?._id ?? e.exercise, sets: e.sets, note: e.note ?? '',
        }));
        const idx = list.findIndex((e) => e.exercise === ex._id);
        if (idx >= 0) list[idx] = { exercise: ex._id, sets: payload, note };
        else list.push({ exercise: ex._id, sets: payload, note });
        updated = await api.sessions.update(todaySession._id, { exercises: list });
      } else {
        updated = await api.sessions.log({ dateKey: date, exerciseId: ex._id, sets: payload, note });
      }
      if (isPR) setPr({ name: ex.name, weight: topSet });
      setSessions((prev) => {
        const rest = prev.filter((s) => s._id !== updated._id);
        return [updated, ...rest].sort((a, b) => new Date(b.date) - new Date(a.date));
      });
      setStatus((s) => ({ ...s, [ex._id]: 'saved' }));
      // Roll to the next unlogged exercise so the whole day flows top-to-bottom.
      const after = dayExercises.slice(dayExercises.findIndex((e) => e._id === ex._id) + 1);
      const next = after.find((e) => !loggedSets(e._id));
      setTimeout(() => {
        if (next) {
          setDrafts((d) => {
            if (d[next._id]) return d;
            const logged = loggedSets(next._id);
            return { ...d, [next._id]: logged ? fromLogged(logged) : [newSet()] };
          });
          setExpanded(next._id);
        } else {
          setExpanded((cur) => (cur === ex._id ? null : cur));
        }
      }, 450);
    } catch (err) {
      setErrors((e) => ({ ...e, [ex._id]: err.message }));
      setStatus((s) => ({ ...s, [ex._id]: undefined }));
    }
  }

  if (loading) return <Skeleton />;

  return (
    <PageTransition>
      <div className="px-4 pt-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="mb-6"
        >
          <p className="label mb-3">Log Your Session</p>
          <h1 className="font-black text-white tracking-tighter" style={{ fontSize: '3.2rem', lineHeight: 0.86 }}>
            WORKOUT
          </h1>
          <div className="mt-4 section-line" />
        </motion.div>

        {/* Day chips */}
        <div
          className="flex gap-2 mb-4 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}
        >
          {PROGRAM.map((d) => (
            <motion.button
              key={d.day}
              whileTap={{ scale: 0.93 }}
              onClick={() => { setDayNum(d.day); setExpanded(null); }}
              className={`chip shrink-0 ${dayNum === d.day ? 'chip-active' : ''}`}
              style={{ fontSize: 11, padding: '7px 14px', opacity: d.manual && dayNum !== d.day ? 0.55 : 1 }}
            >
              Day {d.day} · {d.short}
              {d.manual && (
                <span style={{ fontSize: 8, marginLeft: 5, letterSpacing: '0.1em', opacity: 0.6 }}>OPT</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Date */}
        <div className="mb-4">
          <DatePicker value={date} onChange={setDate} />
          {/* After-midnight heads-up: still logging to the night you started. */}
          {isLateNightGymDay(date) && (
            <p className="label mt-2" style={{ fontSize: 9, color: 'rgba(255,196,60,0.8)', textTransform: 'none', letterSpacing: '0.02em' }}>
              🌙 Late-night session — logging to {format(parseDayKey(date), 'EEE, MMM d')}. Change the date above if this is a new day.
            </p>
          )}
        </div>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: EASE }}
          className="card p-4 mb-4"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="label">{day.label}</p>
            <p className="num font-bold text-white" style={{ fontSize: 13 }}>
              {doneCount}
              <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>/{dayExercises.length} logged</span>
            </p>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${dayExercises.length ? (doneCount / dayExercises.length) * 100 : 0}%` }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{ height: '100%', borderRadius: 99, background: '#fff' }}
            />
          </div>
          {dayVolume > 0 && (
            <p className="label mt-3" style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)' }}>
              TODAY · {Math.round(dayVolume).toLocaleString()} KG
            </p>
          )}
        </motion.div>

        {/* Exercise cards */}
        {dayExercises.length === 0 ? (
          <div className="flex flex-col items-center py-14 gap-4">
            <p className="label text-center" style={{ lineHeight: 1.8 }}>
              No exercises for {day.short} yet
            </p>
            <Link href="/exercises" className="btn btn-ghost px-7 py-3.5">Add Exercises</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {dayExercises.map((ex, i) => {
              const logged = loggedSets(ex._id);
              const last   = getLastLog(sessions, ex._id, date);
              const open   = expanded === ex._id;
              const st     = status[ex._id];
              const prog   = progressStatus(ex, sessions);
              return (
                <motion.div
                  key={ex._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 + Math.min(i, 8) * 0.04, ease: EASE }}
                  className="card overflow-hidden"
                  style={open ? { borderColor: 'rgba(255,255,255,0.18)' } : undefined}
                >
                  {/* Card header */}
                  <button
                    type="button"
                    onClick={() => toggle(ex)}
                    className="w-full text-left flex items-center gap-3 px-4 py-4"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    {/* Done / index badge */}
                    <span
                      className="shrink-0 flex items-center justify-center num font-bold"
                      style={{
                        width: 30, height: 30, borderRadius: 10, fontSize: 12,
                        background: logged ? '#fff' : 'rgba(255,255,255,0.05)',
                        border: logged ? 'none' : '1px solid rgba(255,255,255,0.09)',
                        color: logged ? '#050505' : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {logged ? (
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="#050505" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : i + 1}
                    </span>

                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-white block truncate" style={{ fontSize: 15 }}>{ex.name}</span>
                        {prog.ready && <span className="progress-badge shrink-0">🎯 Progress</span>}
                      </span>
                      <span className="num block mt-0.5" style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)' }}>
                        {logged
                          ? `${logged.length} ${logged.length === 1 ? 'set' : 'sets'} · ${Math.max(...logged.map((s) => s.weight))}kg`
                          : last
                            ? `Last · ${last.sets.length}×${Math.max(...last.sets.map((s) => s.weight))}kg · ${format(new Date(last.date), 'MMM d')}`
                            : 'Never logged'}
                        {!prog.ready && prog.weight != null && prog.streak > 0 && (
                          <span style={{ color: 'var(--accent-line)' }}> · {prog.streak}/{prog.need} @ {prog.weight}kg</span>
                        )}
                      </span>
                    </span>

                    <motion.span
                      animate={{ rotate: open ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      style={{ color: 'rgba(255,255,255,0.22)', fontSize: 18, lineHeight: 1 }}
                    >⌄</motion.span>
                  </button>

                  {/* Expanded editor */}
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="editor"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 14 }}>

                          {/* Ready-to-progress callout — suggestion only, never forced */}
                          {prog.ready && (
                            <div className="cue-pill mb-3" style={{ borderLeftColor: 'var(--accent)', color: 'var(--accent)' }}>
                              <span>🎯</span>
                              <span>
                                Hit {targetFor(ex).reps}×{targetFor(ex).sets} for {prog.need} sessions at {prog.weight}kg —
                                time to add weight when you feel ready.
                              </span>
                            </div>
                          )}

                          {/* Form cue */}
                          {ex.cue && (
                            <div className="cue-pill mb-3">
                              <span style={{ color: 'var(--accent-line)' }}>▸</span>
                              <span>{ex.cue}</span>
                            </div>
                          )}

                          {/* Last time reference */}
                          {last && (
                            <div className="flex items-center gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                              <span className="label shrink-0" style={{ fontSize: 8 }}>
                                LAST · {format(new Date(last.date), 'MMM d')}
                              </span>
                              {last.sets.map((s, si) => (
                                <span key={si} className="num shrink-0" style={{
                                  fontSize: 11, fontWeight: 600, padding: '4px 9px', borderRadius: 999,
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  color: 'rgba(255,255,255,0.45)',
                                }}>
                                  {s.reps}×{s.weight}
                                </span>
                              ))}
                              <button
                                type="button"
                                onClick={() => useLast(ex._id, last)}
                                className="chip shrink-0"
                                style={{ fontSize: 10, padding: '4px 11px', fontWeight: 700 }}
                              >
                                USE LAST
                              </button>
                            </div>
                          )}

                          {/* Already logged this day — saving updates it, but
                              flag it so a re-log is a conscious choice. */}
                          {logged && <LoggedTodayBar sets={logged} label="ALREADY LOGGED" />}

                          {drafts[ex._id] && (
                            <SetEditor
                              sets={drafts[ex._id]}
                              onAdd={() => addSet(ex._id)}
                              onRemove={(si) => removeSet(ex._id, si)}
                              onUpdate={(si, f, v) => updSet(ex._id, si, f, v)}
                              weightPlaceholder={last ? String(Math.max(...last.sets.map((s) => s.weight))) : '60'}
                            />
                          )}

                          {/* Optional quick note for the day */}
                          <input
                            type="text"
                            value={notes[ex._id] ?? ''}
                            onChange={(e) => updNote(ex._id, e.target.value)}
                            placeholder="Note (optional) — e.g. shoulder felt off"
                            className="inp mt-3"
                            style={{ fontSize: 13, padding: '11px 14px' }}
                          />

                          {errors[ex._id] && (
                            <p className="mt-3" style={{ fontSize: 12, color: 'rgba(255,80,80,0.75)' }}>{errors[ex._id]}</p>
                          )}

                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => saveExercise(ex)}
                            disabled={st === 'saving'}
                            className="btn btn-primary w-full py-3.5 mt-3"
                            style={{
                              fontSize: 13,
                              opacity: st === 'saving' ? 0.4 : 1,
                              ...(st === 'saved' ? { background: 'rgba(120,255,150,0.9)' } : {}),
                            }}
                          >
                            {st === 'saving' ? 'Saving...' : st === 'saved' ? 'Saved ✓' : logged ? 'Update Exercise' : 'Save Exercise'}
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer links */}
        <div className="flex justify-center gap-6 mt-6 mb-4">
          <Link href="/program" className="label" style={{ color: 'rgba(255,255,255,0.2)' }}>FULL PROGRAM →</Link>
          <Link href="/exercises" className="label" style={{ color: 'rgba(255,255,255,0.2)' }}>MANAGE EXERCISES →</Link>
        </div>

        <div className="h-4" />
      </div>

      <PRCelebration pr={pr} onDone={() => setPr(null)} />
    </PageTransition>
  );
}

function Skeleton() {
  return (
    <div className="px-4 pt-10 animate-pulse space-y-3">
      <div className="h-14 w-56 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="h-10 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      <div className="h-20 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
      ))}
    </div>
  );
}
