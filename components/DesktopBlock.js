export default function DesktopBlock() {
  return (
    <div
      className="hidden sm:flex fixed inset-0 z-[9999] flex-col items-center justify-center"
      style={{ background: '#050505' }}
    >
      <p className="font-black text-white tracking-[0.3em] text-2xl mb-2">
        MASAR
      </p>
      <p className="text-[10px] tracking-[0.2em] uppercase mb-1"
        style={{ color: 'rgba(255,255,255,0.18)' }}>
        Your path. Your records.
      </p>
      <p className="text-[10px] tracking-[0.22em] uppercase"
        style={{ color: 'rgba(255,255,255,0.22)' }}>
        Open on mobile
      </p>
    </div>
  );
}
