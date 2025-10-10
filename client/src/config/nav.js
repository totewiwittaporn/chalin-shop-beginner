// client/src/config/nav.js
export const NAV_BY_ROLE = {
  ADMIN: [
    { section: 'ทั่วไป', items: [
      { label: 'Dashboard', to: '/', icon: 'Dashboard' },
    ] },
    { section: 'Products', items: [
      { label: 'Products', to: '/products', icon: 'Package' },
      { label: 'Consignment Categories', to: '/consignment/categories', icon: 'Tags' },
    ]},
    { section: 'Shops', items: [
      { label: 'Branches', to: '/branches', icon: 'Building' },
      { label: 'Consignment Shops', to: '/consignment-shops', icon: 'Store' },
      { label: 'Inventory', to: '/inventory', icon: 'Boxes' },
      { label: 'Count Inventory', to: '/inventory/count', icon: 'Boxes' },
    ]},
    { section: 'Transactions', items: [
      { label: 'Purchases', to: '/purchases', icon: 'Cart' },
      { label: 'Delivery Branches', to: '/branches/delivery', icon: 'Swap' },
      { label: 'Delivery Consignments', to: '/consignment/delivery', icon: 'Swap' },
      { label: 'POS Branches', to: '/branchse/sales', icon: 'Receipt' },
      { label: 'POS Consignments', to: '/consignment/sales', icon: 'Receipt' },
      { label: 'Quotes', to: '/quotes', icon: 'FileText' },
    ]},
    { section: 'Reports', items: [
      { label: 'Deliveries', to: '/docs/deliveries', icon: 'FileText' },
      { label: 'Consignment Sales', to: '/docs/consales', icon: 'FileText' },
      { label: 'Invoices', to: '/docs/invoices', icon: 'FileText' },
      { label: 'Receipts', to: '/docs/receipts', icon: 'FileText' },
      { label: 'Quotes', to: '/docs/quotes', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Main Settings', to: '/settings', icon: 'Settings' },
      { label: 'Template Settings', to: '/settings/templates', icon: 'Settings' },
      { label: 'Users', to: '/users', icon: 'Users' },
      { label: 'Profile', to: '/profile', icon: 'Users' },
    ]},
  ],

  STAFF: [
    { section: 'ทั่วไป', items: [{ label: 'Dashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Shops', items: [
      { label: 'Inventory', to: '/inventory', icon: 'Boxes' },
      { label: 'Count Inventory', to: '/inventory/count', icon: 'Boxes' },
    ]},
    { section: 'Transactions', items: [
      { label: 'POS Branches', to: '/branch/sales', icon: 'Receipt' },
    ]},
    { section: 'Reports', items: [
      { label: 'Branch Sales', to: '/docs/branch-sales', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/profile', icon: 'Users' },
    ]},
  ],

  CONSIGNMENT: [
    { section: 'ทั่วไป', items: [{ label: 'Dashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Transactions', items: [
      { label: 'Delivery', to: '/consignment/delivery', icon: 'Swap' },
      { label: 'Sales (POS)', to: '/consignment/sales', icon: 'Receipt' },
    ]},
    { section: 'Reports', items: [
      { label: 'Consignment Sales', to: '/docs/consales', icon: 'FileText' },
      { label: 'Deliveries', to: '/docs/deliveries', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/profile', icon: 'Users' },
    ]},
  ],

  QUOTE_VIEWER: [
    { section: 'ทั่วไป', items: [{ label: 'Dashboard', to: '/', icon: 'Dashboard' }] },
    { section: 'Products', items: [
      { label: 'Products', to: '/products', icon: 'Package' },
    ]},
    { section: 'Reports', items: [
      { label: 'Quotes', to: '/docs/quotes', icon: 'FileText' },
    ]},
    { section: 'Settings', items: [
      { label: 'Profile', to: '/profile', icon: 'Users' },
    ]},
  ],
};
