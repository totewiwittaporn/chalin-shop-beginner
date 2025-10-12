// client/src/components/ui/Table.jsx

function Root({ children, className = "" }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-separate border-spacing-0">
        {children}
      </table>
    </div>
  );
}

function Head({ children }) {
  return (
    <thead className="bg-[rgba(15,23,42,.04)] text-left text-[13px] text-[#0b1220]/80">
      {children}
    </thead>
  );
}

function Body({ children, loading = false }) {
  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={999} className="text-center py-10 text-muted">
            กำลังโหลดข้อมูล…
          </td>
        </tr>
      </tbody>
    );
  }
  return <tbody>{children}</tbody>;
}

function Tr({ children }) {
  return (
    <tr className="border-b border-[rgba(15,23,42,.08)] last:border-0">
      {children}
    </tr>
  );
}

function Th({ children, className = "" }) {
  return (
    <th
      className={`px-4 py-2 font-medium border-b border-[rgba(15,23,42,.08)] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }) {
  return (
    <td className={`px-4 py-2 align-top ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}

/** Default component + subcomponents */
function Table({ children, className = "" }) {
  return <Root className={className}>{children}</Root>;
}

Table.Root = Root;
Table.Head = Head;
Table.Body = Body;
Table.Tr = Tr;
Table.Th = Th;
Table.Td = Td;

export { Table, Root, Head, Body, Tr, Th, Td }; // <-- เพิ่ม named export ของ Table
export default Table;
