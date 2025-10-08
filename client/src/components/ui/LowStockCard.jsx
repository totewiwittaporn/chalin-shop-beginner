export default function LowStockCard({ rows = [] }) {
  const top = rows.slice(0, 6);
  return (
    <div className="card p-5">
      <div className="h-title mb-3">Low Stock</div>
      {top.length === 0 ? (
        <div className="text-sm text-muted">All good 🎉</div>
      ) : (
        <ul className="grid gap-2">
          {top.map((r) => (
            <li key={r.id} className="flex items-center justify-between">
              <div className="text-sm">{r.name}</div>
              <div className="text-xs">
                <span className="px-2 py-0.5 rounded-xl bg-yellow-100 text-yellow-900">
                  {r.qty} / min {r.min}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
