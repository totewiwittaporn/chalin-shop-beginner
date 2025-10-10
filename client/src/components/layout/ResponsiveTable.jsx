// client/src/components/ResponsiveTable.jsx
export default function ResponsiveTable({ columns, rows, renderActions }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background/80 backdrop-blur border-b border-white/10">
            <tr className="text-left opacity-80">
              {columns.map((c) => (
                <th key={c.key}
                    className={[
                      'px-4 py-2 whitespace-nowrap',
                      c.priority >= 3 ? 'hidden md:table-cell' : '',
                      c.priority >= 2 ? 'hidden sm:table-cell' : '',
                      c.className || ''
                    ].join(' ')}
                >
                  {c.header}
                </th>
              ))}
              {renderActions && <th className="px-4 py-2 text-right">เครื่องมือ</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id || i} className="border-t border-white/10">
                {columns.map((c) => (
                  <td key={c.key}
                      className={[
                        'px-4 py-2 align-top',
                        c.priority >= 3 ? 'hidden md:table-cell' : '',
                        c.priority >= 2 ? 'hidden sm:table-cell' : '',
                        c.className || ''
                      ].join(' ')}
                  >
                    {c.render ? c.render(r[c.key], r) : r[c.key]}
                  </td>
                ))}
                {renderActions && (
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    {renderActions(r)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden text-xs opacity-60 mt-1">เลื่อนไปทางซ้าย/ขวาเพื่อดูคอลัมน์เพิ่มเติม</div>
    </div>
  );
}
