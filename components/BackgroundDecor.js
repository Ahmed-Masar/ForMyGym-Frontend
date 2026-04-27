export default function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        overflow: 'hidden', pointerEvents: 'none', userSelect: 'none',
      }}
    >
      {/* ── Radial glow top ───────────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '140%', height: '55%',
        background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.034) 0%, transparent 70%)',
      }} />

      {/* ── Second glow bottom-left ──────────── */}
      <div style={{
        position: 'absolute', bottom: '10%', left: '-20%',
        width: '80%', height: '50%',
        background: 'radial-gradient(ellipse 60% 50% at 30% 80%, rgba(255,255,255,0.016) 0%, transparent 70%)',
      }} />

      {/* ── MASAR word ghost ─────────────────── */}
      <span style={{
        position: 'absolute',
        bottom: '18%', left: '-8%',
        fontSize: '48vw',
        fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255,255,255,0.038)',
        letterSpacing: '-0.04em',
        lineHeight: 1,
        transform: 'rotate(-12deg)',
        transformOrigin: 'center',
        fontFamily: "'SF Pro', -apple-system, sans-serif",
        whiteSpace: 'nowrap',
      }}>
        MASAR
      </span>

      {/* ── Large decorative number top-right ── */}
      <span style={{
        position: 'absolute',
        top: '-8%', right: '-4%',
        fontSize: '72vw',
        fontWeight: 900,
        color: 'transparent',
        WebkitTextStroke: '1px rgba(255,255,255,0.022)',
        lineHeight: 1,
        fontFamily: "'SF Pro', -apple-system, sans-serif",
        fontVariantNumeric: 'tabular-nums',
      }}>
        1
      </span>

      {/* ── Diagonal line — top-left ─────────── */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '8%',
        width: '1px', height: '75vh',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.03) 70%, transparent 100%)',
        transform: 'rotate(18deg)',
        transformOrigin: 'top center',
      }} />

      {/* ── Diagonal line — bottom-right ─────── */}
      <div style={{
        position: 'absolute',
        bottom: '5%', right: '12%',
        width: '1px', height: '55vh',
        background: 'linear-gradient(to top, transparent 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
        transform: 'rotate(-22deg)',
        transformOrigin: 'bottom center',
      }} />

      {/* ── Thin vertical left edge ──────────── */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, left: '5%',
        width: '1px',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.045) 30%, rgba(255,255,255,0.045) 70%, transparent 100%)',
      }} />

      {/* ── Thin horizontal mid-line ─────────── */}
      <div style={{
        position: 'absolute',
        top: '42%', left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.032) 30%, rgba(255,255,255,0.032) 70%, transparent 100%)',
      }} />

      {/* ── Thin horizontal lower-line ───────── */}
      <div style={{
        position: 'absolute',
        top: '78%', left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.022) 20%, rgba(255,255,255,0.022) 80%, transparent 100%)',
      }} />

      {/* ── Corner accent top-left ────────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '40%', height: '1px',
        background: 'linear-gradient(to right, rgba(255,255,255,0.09) 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: '1px', height: '20%',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.09) 0%, transparent 100%)',
      }} />

      {/* ── Corner accent bottom-right ────────── */}
      <div style={{
        position: 'absolute', bottom: '72px', right: 0,
        width: '30%', height: '1px',
        background: 'linear-gradient(to left, rgba(255,255,255,0.07) 0%, transparent 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '72px', right: 0,
        width: '1px', height: '15%',
        background: 'linear-gradient(to top, rgba(255,255,255,0.07) 0%, transparent 100%)',
      }} />
    </div>
  );
}
