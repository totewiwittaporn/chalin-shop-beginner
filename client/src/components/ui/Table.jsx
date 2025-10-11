// client/src/components/ui/Table.jsx
export function Root({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function Head({ children }) {
  return (
    <thead className="bg-[rgba(15,23,42,.04)] text-left text-[13px] text-[#0b1220]/80">
      {children}
    </thead>
  );
}

export function Body({ children, loading = false }) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={999} className="text-center py-10 text-muted">กำลังโหลดข้อมูล…</td>
        </tr>
      </tbody>
    );
  }
  return <tbody>{children}</tbody>;
}

export function Tr({ children }) {
  return <tr className="border-b border-[rgba(15,23,42,.08)] last:border-0">{children}</tr>;
}

export function Th({ children, className = "" }) {
  return (
    <th className={`px-4 py-2 font-medium border-b border-[rgba(15,23,42,.08)] ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "", colSpan }) {
  return (
    <td className={`px-4 py-2 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

// 🔽 default export สำหรับใช้แบบ `import Table from ".../Table"`
const Table = { Root, Head, Body, Tr, Th, Td };
export default Table;
