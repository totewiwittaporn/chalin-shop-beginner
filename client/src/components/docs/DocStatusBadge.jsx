export default function DocStatusBadge({ status }) {
  const s = String(status || "").toUpperCase();
  const map = {
    DRAFT: "bg-slate-100 text-slate-800",
    SENT: "bg-amber-100 text-amber-800",
    RECEIVED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-rose-100 text-rose-800",
  };
  const cls = map[s] || "bg-slate-100 text-slate-800";
  return <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${cls}`}>{s || "-"}</span>;
}
