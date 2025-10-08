export default function Select({ options = [], value, onChange }) {
  return (
    <select
      className="w-full rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
