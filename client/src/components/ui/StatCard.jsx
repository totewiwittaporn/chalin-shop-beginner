export default function StatCard({ title, value, hint, right }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-muted">{title}</div>
      <div className="mt-1 flex items-center justify-between">
        <div className="text-3xl font-semibold">{value}</div>
        {right}
      </div>
      {hint ? <div className="text-xs text-muted mt-2">{hint}</div> : null}
    </div>
  );
}
