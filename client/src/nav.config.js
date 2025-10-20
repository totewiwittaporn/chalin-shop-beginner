// client/src/nav.config.js
export const MOBILE_GROUPS = (role = 'admin') => {
  const r = String(role || '').toLowerCase();
  const isAdmin = r === 'admin';

  const groupsAdmin = [
    {
      id: 'branches',
      label: 'Branches',
      items: [
        { to: '/branches', label: 'Branches' },
      ],
    },
    {
      id: 'consignment',
      label: 'Consignment',
      items: [
        { to: '/consignment', label: 'Shops' },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      items: [
        { to: '/products', label: 'Products' },
        { to: '/inventory', label: 'Warehouses' },
      ],
    },
    {
      id: 'delivery',
      label: 'Delivery',
      items: [
        { to: '/delivery/branch', label: 'To Branch' },
        { to: '/delivery/consignment', label: 'To Consignment' },
      ],
    },
    {
      id: 'sales',
      label: 'Sales',
      items: [
        { to: '/pos/branch', label: 'POS — Branch' },
        { to: '/pos/consignment', label: 'POS — Consignment' },
      ],
    },
    {
      id: 'purchasing',
      label: 'Purchasing',
      items: [
        { to: '/purchases', label: 'Purchases' },
        { to: '/suppliers', label: 'Suppliers' },
      ],
    },

    {
      id: 'settings',
      label: 'Settings',
      items: [
        { to: '/settings', label: 'Settings' },
      ],
    },
  ];

  if (isAdmin) return groupsAdmin;

  if (r === 'staff') {
    return [
      {
        id: 'sales',
        label: 'Sales',
        items: [
          { to: '/pos/branch', label: 'POS — Branch' },
          { to: '/docs/receipts', label: 'Receipts' },
        ],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        items: [
          { to: '/delivery/branch', label: 'To Branch' },
        ],
      },
      {
        id: 'inventory',
        label: 'Inventory',
        items: [
          { to: '/inventory', label: 'Warehouses' },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        items: [{ to: '/profile', label: 'Profile' }],
      },
    ];
  }

  if (r === 'consignment') {
    return [
      {
        id: 'sales',
        label: 'Sales',
        items: [
          { to: '/pos/consignment', label: 'POS — Consignment' },
          { to: '/docs/consales', label: 'Consignment Bills' },
          { to: '/docs/receipts', label: 'Receipts' },
        ],
      },
      {
        id: 'delivery',
        label: 'Delivery',
        items: [
          { to: '/delivery/consignment', label: 'To Consignment' },
          { to: '/docs/deliveries', label: 'Delivery Docs' },
        ],
      },
      {
        id: 'consignment',
        label: 'Consignment',
        items: [
          { to: '/consignment', label: 'Shops' },
        ],
      },
      {
        id: 'settings',
        label: 'Settings',
        items: [{ to: '/profile', label: 'Profile' }],
      },
    ];
  }

  if (r === 'quote-viewer') {
    return [
      {
        id: 'products',
        label: 'Products',
        items: [{ to: '/products', label: 'Products' }],
      },
      {
        id: 'reports',
        label: 'Reports',
        items: [{ to: '/docs/quotes', label: 'Quotes' }],
      },
      {
        id: 'settings',
        label: 'Settings',
        items: [{ to: '/profile', label: 'Profile' }],
      },
    ];
  }

  return groupsAdmin;
};
