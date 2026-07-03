'use client';
import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let uid = 0;
export const newSet = (reps = '', weight = '') => ({ id: ++uid, reps, weight });

// Most sets repeat the previous one — prefill so a straight-sets workout
// is one tap per set instead of retyping reps × weight every time.
export const cloneLastSet = (sets) => {
  const last = sets[sets.length - 1];
  return newSet(last?.reps ?? '', last?.weight ?? '');
};

export const fromLogged = (sets) => sets.map((s) => newSet(String(s.reps), String(s.weight)));

// A set counts as long as reps is filled — empty weight means bodyweight (0),
// so the last set is never silently dropped just because KG was left blank.
export const toPayload = (sets) =>
  sets
    .filter((s) => +s.reps > 0)
    .map((s) => ({ reps: +s.reps, weight: +s.weight || 0 }));

// type="text" + inputMode keeps the numeric keypad but avoids iOS type="number"
// quirks: Safari silently clears the field on blur when the value is "invalid"
// (comma decimals, Arabic-Indic digits), which is how typed sets used to vanish.
const normalize = (v, decimal) => {
  let s = String(v)
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[,٫]/g, '.');
  s = s.replace(decimal ? /[^\d.]/g : /\D/g, '');
  if (decimal) {
    const [head, ...rest] = s.split('.');
    if (rest.length) s = `${head}.${rest.join('')}`;
  }
  return s;
};

// Tapping a row button must not blur the focused input: the blur closes the
// keyboard mid-tap, the viewport resizes, and the whole page jumps.
const keepFocus = (e) => e.preventDefault();

export default function SetEditor({ sets, onAdd, onRemove, onUpdate, weightPlaceholder = '0' }) {
  const rowsRef = useRef(null);

  const handleAdd = () => {
    onAdd();
    requestAnimationFrame(() => {
      const inputs = rowsRef.current?.querySelectorAll('input[data-reps]');
      const last = inputs?.[inputs.length - 1];
      if (!last) return;
      last.focus({ preventScroll: true });
      last.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  };

  return (
    <div ref={rowsRef} className="flex flex-col gap-2.5">
      <div className="grid grid-cols-11 gap-2">
        <span className="col-span-1" />
        <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>REPS</span>
        <span className="col-span-1" />
        <span className="col-span-4 label text-center" style={{ fontSize: 9 }}>KG</span>
        <span className="col-span-1" />
      </div>

      <AnimatePresence initial={false}>
        {sets.map((set, i) => (
          <motion.div
            key={set.id}
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
              data-reps
              type="text" inputMode="numeric" placeholder="10" enterKeyHint="next"
              value={set.reps}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(i, 'reps', normalize(e.target.value, false))}
              className="col-span-4 inp text-center num"
              style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
            />
            <span className="col-span-1 text-center" style={{ color: 'rgba(255,255,255,0.15)', fontSize: 14 }}>×</span>
            <input
              type="text" inputMode="decimal" placeholder={weightPlaceholder} enterKeyHint="done"
              value={set.weight}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate(i, 'weight', normalize(e.target.value, true))}
              className="col-span-4 inp text-center num"
              style={{ padding: '12px 8px', fontSize: 16, borderRadius: 12 }}
            />
            <button
              type="button"
              onMouseDown={keepFocus}
              onClick={() => onRemove(i)}
              className="col-span-1 text-center"
              style={{ color: 'rgba(255,255,255,0.18)', fontSize: 20, lineHeight: 1 }}
            >×</button>
          </motion.div>
        ))}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onMouseDown={keepFocus}
        onClick={handleAdd}
        className="btn btn-ghost w-full py-3 mt-1"
      >
        + Add Set
      </motion.button>
    </div>
  );
}
