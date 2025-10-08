export function Table({ columns = [], data = [] }) {
  return (
    <div className="overflow-x-auto glass">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-muted">
            {columns.map((c) => (
              <th
                key={c.key}
                className="sticky top-0 z-20 bg-surface border-b border-border px-3 py-2 whitespace-nowrap"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} className="border-t border-border/50">
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 align-top whitespace-nowrap">
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
