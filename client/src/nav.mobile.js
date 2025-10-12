// client/src/nav.mobile.js
export const MOBILE_GROUPS = (role = 'admin') => {
  const isAdmin = role === 'admin';
  const groupsAdmin = [
    {
      id: 'products',
      label: 'Products',
      items: [
        { to: '/products', label: 'Products' },
        { to: '/consignment/categories', label: 'Consignment Categories' },
      ],
    },
    {
      id: 'shops',
      label: 'Shops',
      items: [
        { to: '/branches', label: 'Branches' },
        { to: '/consignment/shops', label: 'Consignment Shops' },
        { to: '/inventory', label: 'Inventory' },
        { to: '/inventory/count', label: 'Count Inventory' },
      ],
    },
    {
      id: 'transactions',
      label: 'Transactions',
      items: [
        { to: '/purchases', label: 'Purchases' },
        { to: '/branch/delivery', label: 'Branch Delivery' },
        { to: '/branch/sales', label: 'Branch Sales (POS)' },
        { to: '/consignment/delivery', label: 'Consignment Delivery' },
        { to: '/consignment/sales', label: 'Consignment Sales (POS)' },
        { to: '/quotes', label: 'Quotes' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      items: [
        { to: '/docs/deliveries', label: 'Deliveries' },
        { to: '/docs/consales', label: 'Consignment Sales' },
        { to: '/docs/invoices', label: 'Invoices' },
        { to: '/docs/receipts', label: 'Receipts' },
        { to: '/docs/quotes', label: 'Quotes' },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      items: [
        { to: '/settings', label: 'Main Settings' },
        { to: '/settings/templates', label: 'Template Settings' },
        { to: '/users', label: 'Users' },
        { to: '/profile', label: 'Profile' },
      ],
    },
  ];

  if (isAdmin) return groupsAdmin;

  if (role === 'staff') {
    return [
      { id: 'shops', label: 'Shops',
        items: [
          { to: '/inventory', label: 'Inventory' },
          { to: '/inventory/count', label: 'Count Inventory' },
        ]},
      { id: 'transactions', label: 'Transactions',
        items: [{ to: '/branch/sales', label: 'Branch Sales (POS)' }]},
      { id: 'reports', label: 'Reports',
        items: [{ to: '/docs/branch-sales', label: 'Branch Sales' }]},
      { id: 'settings', label: 'Settings',
        items: [{ to: '/profile', label: 'Profile' }]},
    ];
  }

  if (role === 'consignment') {
    return [
      { id: 'transactions', label: 'Transactions',
        items: [
          { to: '/consignment/delivery', label: 'Consignment Delivery' },
          { to: '/consignment/sales', label: 'Consignment Sales (POS)' },
        ]},
      { id: 'reports', label: 'Reports',
        items: [
          { to: '/docs/consales', label: 'Consignment Sales' },
          { to: '/docs/deliveries', label: 'Deliveries' },
        ]},
      { id: 'settings', label: 'Settings',
        items: [{ to: '/profile', label: 'Profile' }]},
    ];
  }

  if (role === 'quote-viewer') {
    return [
      { id: 'products', label: 'Products', items: [{ to: '/products', label: 'Products' }]},
      { id: 'reports', label: 'Reports', items: [{ to: '/docs/quotes', label: 'Quotes' }]},
      { id: 'settings', label: 'Settings', items: [{ to: '/profile', label: 'Profile' }]},
    ];
  }

  return groupsAdmin;
};
