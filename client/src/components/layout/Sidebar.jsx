import { Link, useLocation } from 'react-router-dom';

const Item = ({ to, label }) => {
  const { pathname } = useLocation();
  const active = pathname === to;
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-xl ${active ? 'bg-accent' : 'hover:bg-accent'} text-sm`}
    >
      {label}
    </Link>
  );
};

export default function Sidebar() {
  return (
    <aside className="hidden md:block w-56 p-3">
      <div className="card p-3 grid gap-1">
        <Item to="/" label="Dashboard" />
        <Item to="/products" label="Products" />
        <Item to="/product-types" label="Product Types" />
        <Item to="/branches" label="Branches" />
        <Item to="/consignment-shops" label="Consignment" />
        <Item to="/inventory" label="Inventory" />
        <Item to="/purchases" label="Purchases" />
        <Item to="/transfers" label="Transfers" />
        <Item to="/sales" label="Sales" />
        <Item to="/settings" label="Settings" />
      </div>
    </aside>
  );
}
