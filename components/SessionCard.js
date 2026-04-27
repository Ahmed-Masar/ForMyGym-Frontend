'use client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

function sessionVol(s) {
  return s.exercises.reduce((t, ex) => t + ex.sets.reduce((a, set) => a + set.reps * set.weight, 0), 0);
}

export default function SessionCard({ session, onClick }) {
  const v = sessionVol(session);

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="card p-4 flex flex-col gap-3"
      style={{ borderRadius: '18px', cursor: 'pointer' }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="label mb-1" style={{ fontSize: '9px' }}>{format(new Date(session.date), 'EEEE')}</p>
          <p className="font-bold text-white" style={{ fontSize: '15px' }}>{format(new Date(session.date), 'MMM d, yyyy')}</p>
        </div>
        <div className="text-right">
          <p className="label mb-1" style={{ fontSize: '9px' }}>VOLUME</p>
          <p className="num font-bold text-white" style={{ fontSize: '15px' }}>
            {v.toLocaleString()}
            <span className="text-[10px] font-normal ml-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>kg</span>
          </p>
        </div>
      </div>

      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      <div className="flex flex-col gap-1.5">
        {session.exercises.map((ex, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
            className="flex justify-between items-center"
          >
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              {ex.exercise?.name ?? '—'}
            </span>
            <span className="num" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
              {ex.sets.length} sets · {Math.max(...ex.sets.map(s => s.weight))}kg
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
