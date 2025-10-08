import { Link, NavLink } from 'react-router-dom';

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `px-3 py-2 rounded-xl text-sm ${isActive ? 'bg-accent text-text' : 'text-muted hover:text-text'}`
    }
  >
    {children}
  </NavLink>
);

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="container-app flex h-14 items-center justify-between">
        <Link className="font-semibold" to="/">
          Chalin Shop
        </Link>
        <nav className="flex gap-1">
          <NavItem to="/">Dashboard</NavItem>
          <NavItem to="/products">Products</NavItem>
          <NavItem to="/product-types">Types</NavItem>
          <NavItem to="/branches">Branches</NavItem>
          <NavItem to="/consignment-shops">Consign</NavItem>
          <NavItem to="/inventory">Inventory</NavItem>
          <NavItem to="/purchases">Purchases</NavItem>
          <NavItem to="/transfers">Transfers</NavItem>
          <NavItem to="/sales">Sales</NavItem>
          <NavItem to="/settings">Settings</NavItem>
        </nav>
      </div>
    </header>
  );
}
