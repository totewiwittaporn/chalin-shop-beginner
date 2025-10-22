// client/src/nav.config.js
import {
  Home, Building2, Store, Boxes, Truck, ShoppingCart,
  WalletCards, Users, ClipboardList, Settings, Package, ReceiptText
} from "lucide-react";

// === เดิมของคุณ (เอาไว้ใช้กับมือถือ) ===
export const MOBILE_GROUPS = (role = "admin") => {
  const r = String(role || "").toLowerCase();
  const admin = [
    { id: "branches", label: "Branches", items: [{ to: "/branches", label: "Branches" }] },
    { id: "consignment", label: "Consignment", items: [{ to: "/consignment", label: "Shops" }] },
    { id: "inventory", label: "Inventory", items: [
      { to: "/products", label: "Products" }, { to: "/inventory", label: "Warehouses" }
    ]},
    { id: "delivery", label: "Delivery", items: [
      { to: "/delivery/branch", label: "To Branch" },
      { to: "/delivery/consignment", label: "To Consignment" }
    ]},
    { id: "sales", label: "Sales", items: [
      { to: "/pos/branch", label: "POS — Branch" },
      { to: "/pos/consignment", label: "POS — Consignment" }
    ]},
    { id: "purchasing", label: "Purchasing", items: [
      { to: "/purchases", label: "Purchases" }, { to: "/suppliers", label: "Suppliers" }
    ]},
    { id: "settings", label: "Settings", items: [{ to: "/settings", label: "Settings" }] },
  ];
  if (r === "admin") return admin;
  if (r === "staff") return [
    { id: "sales", label: "Sales", items: [
      { to: "/pos/branch", label: "POS — Branch" }, { to: "/docs/receipts", label: "Receipts" }
    ]},
    { id: "delivery", label: "Delivery", items: [{ to: "/delivery/branch", label: "To Branch" }] },
    { id: "inventory", label: "Inventory", items: [{ to: "/inventory", label: "Warehouses" }] },
    { id: "settings", label: "Settings", items: [{ to: "/profile", label: "Profile" }] },
  ];
  if (r === "consignment") return [
    { id: "sales", label: "Sales", items: [
      { to: "/pos/consignment", label: "POS — Consignment" },
      { to: "/docs/consales", label: "Consignment Bills" },
      { to: "/docs/receipts", label: "Receipts" }
    ]},
    { id: "delivery", label: "Delivery", items: [
      { to: "/delivery/consignment", label: "To Consignment" },
      { to: "/docs/deliveries", label: "Delivery Docs" }
    ]},
    { id: "consignment", label: "Consignment", items: [{ to: "/consignment", label: "Shops" }] },
    { id: "settings", label: "Settings", items: [{ to: "/profile", label: "Profile" }] },
  ];
  if (r === "quote-viewer") return [
    { id: "products", label: "Products", items: [{ to: "/products", label: "Products" }] },
    { id: "reports", label: "Reports", items: [{ to: "/docs/quotes", label: "Quotes" }] },
    { id: "settings", label: "Settings", items: [{ to: "/profile", label: "Profile" }] },
  ];
  return admin;
};

// === ใหม่: ใช้กับรางไอคอน (Desktop/Tablet) ===
export const SIDEBAR_GROUPS = (role = "admin") => {
  const r = String(role || "").toLowerCase();
  const admin = [
    { id: "home",       label: "Dashboards",  icon: Home,        items: [{ to: "/dashboard", label: "Dashboard" }] },
    { id: "branches",   label: "Branches",    icon: Building2,   items: [{ to: "/branches", label: "Branches" }] },
    { id: "consignment",label: "Consignment", icon: Store,       items: [{ to: "/consignment", label: "Shops" }] },
    { id: "inventory",  label: "Inventory",   icon: Boxes,       items: [
      { to: "/products", label: "Products" }, { to: "/inventory", label: "Warehouses" }
    ]},
    { id: "delivery",   label: "Delivery",    icon: Truck,       items: [
      { to: "/delivery/branch", label: "To Branch" },
      { to: "/delivery/consignment", label: "To Consignment" }
    ]},
    { id: "sales",      label: "Sales",       icon: ShoppingCart,items: [
      { to: "/pos/branch", label: "POS — Branch" },
      { to: "/pos/consignment", label: "POS — Consignment" }
    ]},
    { id: "purchasing", label: "Purchasing",  icon: WalletCards, items: [
      { to: "/purchases", label: "Purchases" }, { to: "/suppliers", label: "Suppliers" }
    ]},
    { id: "people",     label: "People",      icon: Users,       items: [
      { to: "/staff", label: "Staff" }, { to: "/customers", label: "Customers" }
    ]},
    { id: "reports",    label: "Reports",     icon: ClipboardList, items: [
      { to: "/docs/quotes", label: "Quotes" }, { to: "/docs/receipts", label: "Receipts" }
    ]},
    { id: "settings",   label: "Settings",    icon: Settings,    items: [{ to: "/settings", label: "Settings" }] },
  ];
  if (r === "admin") return admin;
  if (r === "staff") return [
    { id: "sales",    label: "Sales",    icon: ShoppingCart, items: [{ to: "/pos/branch", label: "POS — Branch" }] },
    { id: "delivery", label: "Delivery", icon: Truck,        items: [{ to: "/delivery/branch", label: "To Branch" }] },
    { id: "inventory",label: "Inventory",icon: Boxes,        items: [{ to: "/inventory", label: "Warehouses" }] },
    { id: "settings", label: "Settings", icon: Settings,     items: [{ to: "/profile", label: "Profile" }] },
  ];
  if (r === "consignment") return [
    { id: "sales",     label: "Sales",     icon: ShoppingCart, items: [
      { to: "/pos/consignment", label: "POS — Consignment" },
      { to: "/docs/consales", label: "Consignment Bills" }
    ]},
    { id: "delivery",  label: "Delivery",  icon: Truck, items: [{ to: "/delivery/consignment", label: "To Consignment" }] },
    { id: "consignment",label:"Consignment",icon: Store, items: [{ to: "/consignment", label: "Shops" }] },
    { id: "settings",  label: "Settings",  icon: Settings, items: [{ to: "/profile", label: "Profile" }] },
  ];
  if (r === "quote-viewer") return [
    { id: "products", label: "Products", icon: Package, items: [{ to: "/products", label: "Products" }] },
    { id: "reports",  label: "Reports",  icon: ReceiptText, items: [{ to: "/docs/quotes", label: "Quotes" }] },
    { id: "settings", label: "Settings", icon: Settings, items: [{ to: "/profile", label: "Profile" }] },
  ];
  return admin;
};
