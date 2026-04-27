'use client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useCounter } from '@/hooks/useCounter';

export default function PRCard({ name, weight, date }) {
  const count = useCounter(weight);

  return (
    <motion.div
      whileTap={{ scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="card shrink-0 p-4 flex flex-col justify-between"
      style={{ width: '136px', minHeight: '118px', borderRadius: '18px' }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="label leading-tight" style={{ fontSize: '9px' }}>{name}</span>
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 500, damping: 28 }}
          className="pr-badge shrink-0"
        >
          PR
        </motion.span>
      </div>
      <div className="flex items-end gap-1 mt-2">
        <span className="num font-black text-white" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
          {count}
        </span>
        <span className="font-medium mb-0.5 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>kg</span>
      </div>
      {date && (
        <span className="label mt-1.5" style={{ fontSize: '9px', color: 'rgba(255,255,255,0.18)' }}>
          {format(new Date(date), 'MMM d')}
        </span>
      )}
    </motion.div>
  );
}
