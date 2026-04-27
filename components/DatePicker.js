'use client';
import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, isSameMonth, isSameDay, isToday, addDays,
} from 'date-fns';
import BottomSheet from './BottomSheet';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function buildGrid(month) {
  const start = startOfWeek(startOfMonth(month));
  const end   = endOfWeek(endOfMonth(month));
  const days  = [];
  let cur = start;
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1); }
  return days;
}

export default function DatePicker({ value, onChange }) {
  const selected         = value ? new Date(value) : new Date();
  const [open, setOpen]  = useState(false);
  const [month, setMonth] = useState(startOfMonth(selected));

  const grid = buildGrid(month);

  function pick(day) {
    onChange(format(day, 'yyyy-MM-dd'));
    setOpen(false);
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(255,255,255,0.04)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          padding: '13px 18px',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 500,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          width: '100%',
          textAlign: 'left',
        }}
      >
        <CalIcon />
        <span>{format(selected, 'EEEE, MMMM d · yyyy')}</span>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title="Select Date">
        <div style={{ padding: '16px 20px 8px' }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => setMonth(m => subMonths(m, 1))}
              style={navBtnStyle}
            >‹</button>

            <span style={{ fontFamily: 'inherit', fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
              {format(month, 'MMMM yyyy')}
            </span>

            <button
              type="button"
              onClick={() => setMonth(m => addMonths(m, 1))}
              style={navBtnStyle}
            >›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '8px' }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.28)', padding: '4px 0', fontFamily: 'inherit' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '3px' }}>
            {grid.map((day, i) => {
              const inMonth  = isSameMonth(day, month);
              const isSelect = isSameDay(day, selected);
              const isTod    = isToday(day);

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => inMonth && pick(day)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '15px',
                    fontWeight: isSelect ? 800 : isTod ? 700 : 500,
                    height: '40px',
                    borderRadius: '99px',
                    border: isTod && !isSelect ? '1.5px solid rgba(255,255,255,0.2)' : '1.5px solid transparent',
                    background: isSelect ? '#ffffff' : 'transparent',
                    color: isSelect ? '#050505' : inMonth ? '#ffffff' : 'rgba(255,255,255,0.18)',
                    cursor: inMonth ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                    transition: 'background 120ms ease, transform 80ms ease',
                    fontVariantNumeric: 'tabular-nums',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onTouchStart={e => { if (inMonth && !isSelect) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onTouchEnd={e => { e.currentTarget.style.background = isSelect ? '#fff' : 'transparent'; }}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => { setMonth(startOfMonth(new Date())); pick(new Date()); }}
              className="btn btn-ghost"
              style={{ padding: '8px 24px', fontSize: '12px' }}
            >
              Today
            </button>
          </div>

        </div>
      </BottomSheet>
    </>
  );
}

const navBtnStyle = {
  fontFamily: 'inherit',
  width: '36px', height: '36px',
  borderRadius: '99px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#fff', fontSize: '20px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
};

function CalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
