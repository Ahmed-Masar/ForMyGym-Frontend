'use client';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import BottomSheet from '@/components/BottomSheet';
import DatePicker from '@/components/DatePicker';

const EASE = [0.16, 1, 0.3, 1];

// Compact inline sparkline of the last N entries.
function Spark({ series }) {
  if (series.length < 2) return null;
  const pts = series.slice(-14);
  const ws  = pts.map((p) => p.weight);
  const min = Math.min(...ws), max = Math.max(...ws);
  const span = max - min || 1;
  const W = 100, H = 30;
  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * W;
    const y = H - ((p.weight - min) / span) * H;
    return [x, y];
  });
  const d = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="30" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={lx} cy={ly} r="2.4" fill="var(--accent)" />
    </svg>
  );
}

export default function BodyWeightCard({ delay = 0 }) {
  const [entries, setEntries] = useState([]);
  const [open, setOpen]       = useState(false);
  const [date, setDate]       = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weight, setWeight]   = useState('');
  const [saving, setSaving]   = useState(false);

  const load = useCallback(() => api.bodyweight.list().then(setEntries).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);

  const latest = entries[entries.length - 1] ?? null;
  const prev   = entries[entries.length - 2] ?? null;
  const delta  = latest && prev ? +(latest.weight - prev.weight).toFixed(1) : null;

  async function save() {
    const w = parseFloat(weight.replace(',', '.'));
    if (!(w > 0)) return;
    setSaving(true);
    try {
      await api.bodyweight.save({ date: new Date(date).toISOString(), weight: w });
      await load();
      setOpen(false);
      setWeight('');
    } finally { setSaving(false); }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: EASE }}
        className="card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="label">Body Weight</p>
          <button
            onClick={() => { setDate(format(new Date(), 'yyyy-MM-dd')); setWeight(latest ? String(latest.weight) : ''); setOpen(true); }}
            className="chip"
            style={{ fontSize: 10, padding: '5px 12px', fontWeight: 700 }}
          >
            LOG
          </button>
        </div>

        {latest ? (
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="num font-black text-white" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
                {latest.weight}
                <span className="font-normal text-sm ml-1" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
              </p>
              <p className="label mt-2" style={{ fontSize: 9 }}>
                {format(new Date(latest.date), 'MMM d')}
                {delta !== null && delta !== 0 && (
                  <span style={{ marginLeft: 8, color: delta < 0 ? 'var(--accent)' : 'rgba(255,180,120,0.7)' }}>
                    {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}kg
                  </span>
                )}
              </p>
            </div>
            <div style={{ width: 120 }}><Spark series={entries} /></div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Tap LOG to track your weight.</p>
        )}
      </motion.div>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Log Body Weight">
        <div className="px-5 pt-4 pb-2 flex flex-col gap-3">
          <DatePicker value={date} onChange={setDate} />
          <input
            type="text" inputMode="decimal" placeholder="Weight (kg)" autoFocus
            value={weight}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setWeight(e.target.value.replace(/[^\d.,]/g, ''))}
            className="inp text-center num"
            style={{ fontSize: 22, padding: '16px' }}
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={save}
            disabled={saving}
            className="btn btn-primary w-full py-4 mt-1"
            style={{ fontSize: 14, opacity: saving ? 0.4 : 1 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </motion.button>
          <div className="h-2" />
        </div>
      </BottomSheet>
    </>
  );
}
