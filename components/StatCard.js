export default function StatCard({ value, label }) {
  return (
    <div className="card p-4 flex flex-col gap-1.5">
      <p className="label">{label}</p>
      <p className="num font-black text-white" style={{ fontSize: '2.2rem', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}
