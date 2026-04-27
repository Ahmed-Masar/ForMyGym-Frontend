'use client';
import { motion } from 'framer-motion';

export default function WeekComparison({ thisWeek, lastWeek }) {
  const diff = thisWeek.volume - lastWeek.volume;
  const pct  = lastWeek.volume > 0 ? Math.abs(Math.round((diff / lastWeek.volume) * 100)) : null;
  const up   = diff >= 0;
  const max  = Math.max(thisWeek.volume, lastWeek.volume, 1);

  const rows = [
    { label: 'This Week', ...thisWeek, opacity: 1,    barColor: '#ffffff' },
    { label: 'Last Week', ...lastWeek, opacity: 0.45, barColor: 'rgba(255,255,255,0.4)' },
  ];

  return (
    <div className="card p-5 flex flex-col gap-4" style={{ borderRadius: '18px' }}>
      <div className="flex items-center justify-between">
        <p className="label">Week Comparison</p>
        {pct !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 400, damping: 28 }}
            className="num font-bold"
            style={{ fontSize: '13px', color: up ? '#fff' : 'rgba(255,255,255,0.35)' }}
          >
            {up ? '↑' : '↓'} {pct}%
          </motion.span>
        )}
      </div>

      {rows.map((row, ri) => (
        <div key={row.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <span className="label" style={{ color: `rgba(255,255,255,${row.opacity * 0.28 + 0.1})` }}>{row.label}</span>
            <motion.span
              className="num font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 + ri * 0.08, duration: 0.4 }}
              style={{ fontSize: '14px', color: `rgba(255,255,255,${row.opacity})` }}
            >
              {row.volume.toLocaleString()}
              <span style={{ fontSize: '10px', fontWeight: 400, marginLeft: '2px', color: 'rgba(255,255,255,0.3)' }}>kg</span>
            </motion.span>
          </div>

          <div className="rounded-full overflow-hidden" style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(row.volume / max) * 100}%` }}
              transition={{ duration: 0.9, delay: 0.15 + ri * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: row.barColor }}
            />
          </div>

          <span className="label" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>
            {row.sessions} session{row.sessions !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
