import { Outlet, NavLink } from 'react-router-dom';

export default function DocsHome(){
  const link = "px-3 py-2 rounded-xl hover:bg-white/10";
  const active = ({isActive}) => isActive ? `${link} bg-white/10 font-semibold` : link;
  return (
    <div className="grid md:grid-cols-[220px_1fr] gap-4">
      <aside className="panel p-3 sticky top-4 h-fit">
        <div className="text-sm text-muted mb-2">หมวดเอกสาร</div>
        <nav className="grid gap-1">
          <NavLink className={active} to="deliveries">ใบส่งสินค้า</NavLink>
          <NavLink className={active} to="consales">ยอดขายฝากขาย</NavLink>
          <NavLink className={active} to="invoices">ใบวางบิล</NavLink>
          <NavLink className={active} to="receipts">ใบเสร็จรับเงิน</NavLink>
          <NavLink className={active} to="quotes">ใบเสนอราคา</NavLink>
        </nav>
      </aside>
      <main className="min-w-0">
        <div className="panel p-4">
          <Outlet/>
        </div>
      </main>
    </div>
  );
}
