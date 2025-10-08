import dayjs from 'dayjs';

export default function ActivityList({ items = [] }) {
  return (
    <div className="card p-5">
      <div className="h-title mb-3">Recent Activity</div>
      <ul className="grid gap-2">
        {items.length === 0 && <li className="text-sm text-muted">No activity</li>}
        {items.map((it, i) => (
          <li key={i} className="flex items-start justify-between">
            <div>
              <div className="text-sm">{it.title}</div>
              <div className="text-xs text-muted">{dayjs(it.date).format('YYYY-MM-DD')} • {it.type}</div>
            </div>
            <div className="text-xs text-muted">{it.status || ''}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
