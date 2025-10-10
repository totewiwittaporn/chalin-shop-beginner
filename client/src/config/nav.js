// client/src/config/nav.js
export const NAV_BY_ROLE = {
  ADMIN: [
    { section: 'ทั่วไป', items: [
      { label: 'Dashboard', to: '/app', icon: 'Dashboard' },
    ] },
    { section: 'Products', items: [
      { label: 'Products', to: '/app/products', icon: 'Package' },
      { label: 'Consignment Categories', to: '/app/consignment/categories', icon: 'Tags' },
    ]},
    { section: 'Shops', items: [
      { label: 'Branches', to: '/app/branches', icon: 'Building' },
      { label: 'Consignment Shops', to: '/app/consignment-shops', icon: 'Store' },
      { label: 'Inventory', to: '/app/inventory', icon: 'Boxes' },
      { label: 'Count Inventory', to: '/app/inventory/count', icon: 'Boxes' },
    ]},
    { section: 'Transactions', items: [
      { label: 'Purchases', to: '/app/purchases', icon: 'Cart' },
      { label: 'Delivery Branches', to: '/app/branches/delivery', icon: 'Swap' },
      { label: 'Delivery Consignments', to: '/app/consignment/delivery', icon: 'Swap' },
      { label: 'POS Branches', to: '/app/branches/sales', icon: 'Receipt' },
      { label: 'POS Consignments', to: '/app/consignment/sales', icon: 'Receipt' },
      { label: 'Quotes', to: '/app/quotes', icon: 'FileText' },
    ]},
    { section: 'Reports', items: [
      { label: 'Deliveries', to: '/app/docs/deliveries', icon: 'FileText' },
      { label: 'Consignment Sales', to: '/app/docs/consales', icon: 'FileText' },
      { label: 'Invoices', to: '/app/docs/invoices', icon: 'FileText' },
      { label: 'Receipts', to: '/app/docs/receipts', icon: 'FileText' },
      { label: 'Quotes', to: '/app/docs/quotes', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Main Settings', to: '/app/settings', icon: 'Settings' },
      { label: 'Template Settings', to: '/app/settings/templates', icon: 'Settings' },
      { label: 'Users', to: '/app/users', icon: 'Users' },
      { label: 'Profile', to: '/app/profile', icon: 'Users' },
    ]},
  ],

  STAFF: [
    { section: 'ทั่วไป', items: [{ label: '/appDashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Shops', items: [
      { label: 'Inventory', to: '/app/inventory', icon: 'Boxes' },
      { label: 'Count Inventory', to: '/app/inventory/count', icon: 'Boxes' },
    ]},
    { section: 'Transactions', items: [
      { label: 'POS Branches', to: '/app/branches/sales', icon: 'Receipt' },
    ]},
    { section: 'Reports', items: [
      { label: 'Branch Sales', to: '/app/docs/branches-sales', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/app/profile', icon: 'Users' },
    ]},
  ],

  CONSIGNMENT: [
    { section: 'ทั่วไป', items: [{ label: '/appDashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Transactions', items: [
      { label: 'Delivery', to: '/app/consignment/delivery', icon: 'Swap' },
      { label: 'Sales (POS)', to: '/app/consignment/sales', icon: 'Receipt' },
    ]},
    { section: 'Reports', items: [
      { label: 'Consignment Sales', to: '/app/docs/consales', icon: 'FileText' },
      { label: 'Deliveries', to: '/app/docs/deliveries', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/app/profile', icon: 'Users' },
    ]},
  ],

  QUOTE_VIEWER: [
    { section: 'ทั่วไป', items: [{ label: '/appDashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Products', items: [
      { label: 'Products', to: '/app/products', icon: 'Package' },
    ]},
    { section: 'Reports', items: [
      { label: 'Quotes', to: '/app/docs/quotes', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/app/profile', icon: 'Users' },
    ]},
  ],
};
