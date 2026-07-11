'use client';

// Double-log warning shown above the set editor. Same shape as the "LAST" bar
// but amber, not green/white — it's a "you already did this today" heads-up, not
// a suggestion to reuse. Purely informational: extra sets are sometimes on
// purpose, so this never blocks saving.
export default function LoggedTodayBar({ sets, label = 'LOGGED TODAY' }) {
  if (!sets?.length) return null;
  const amber = 'rgba(255,196,60,0.85)';
  return (
    <div
      className="flex items-center gap-2 mb-3 overflow-x-auto"
      style={{ scrollbarWidth: 'none' }}
    >
      <span className="label shrink-0" style={{ fontSize: 8, color: amber }}>
        ⚠ {label}
      </span>
      {sets.map((s, i) => (
        <span
          key={i}
          className="num shrink-0"
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 9px',
            borderRadius: 999,
            background: 'rgba(255,196,60,0.08)',
            border: '1px solid rgba(255,196,60,0.22)',
            color: amber,
          }}
        >
          {s.reps}×{s.weight}
        </span>
      ))}
    </div>
  );
}
