export const NAV_BY_ROLE = {
  ADMIN: [
    { section: 'ทั่วไป', items: [
      { label: 'Dashboard', to: '/' },
      { label: 'Profile', to: '/profile' },
    ] },
    { section: 'คลังสินค้า', items: [
      { label: 'Products', to: '/products', icon: 'Package' },
      { label: 'Product Consign', to: '/consignment/categories', icon: 'Tags' },
      { label: 'Branches', to: '/branches', icon: 'Building' },
      { label: 'Consignment Shops', to: '/consignment-shops', icon: 'Store' },
      { label: 'Inventory', to: '/inventory', icon: 'Boxes' },
    ]},
    { section: 'รายการ', items: [
      { label: 'Purchases', to: '/purchases', icon: 'Cart' },
      { label: 'Delivery Braches', to: '/branches/delivery', icon: 'Swap' },
      { label: 'Delivery Consignments', to: '/consignment/delivery', icon: 'Swap' },
      { label: 'POS Braches', to: '/branches/sales', icon: 'Receipt' },
      { label: 'POS Consignments', to: '/consignment/sales', icon: 'Receipt' },
      { label: 'Quotes', to: '/quotes', icon: 'FileText' },
    ]},
    { section: 'ระบบ', items: [
      { label: 'Settings', to: '/settings', icon: 'Settings' },
      { label: 'Settings', to: '/settings/templates', icon: 'Settings' },
      { label: 'Users', to: '/users', icon: 'Users' } // ตามสรุปของคุณ
    ]},
  ],

  STAFF: [
    { section: 'ทั่วไป', items: [{ label: 'Dashboard', to: '/' }] },
    { section: 'คลังสินค้า', items: [
      { label: 'Products', to: '/products', icon: 'Package' },   // read-only
      { label: 'Inventory', to: '/inventory', icon: 'Boxes' },   // กรองตาม branch
      { label: 'Purchases', to: '/purchases', icon: 'Cart' },    // รับสินค้า
    ]},
    { section: 'ขาย', items: [
      { label: 'Sales', to: '/branches/sales', icon: 'Receipt' },
    ]},
  ],

  CONSIGNMENT: [
    { section: 'ทั่วไป', items: [{ label: 'Dashboard', to: '/' }] },
    { section: 'ฝากขาย', items: [
      { label: 'Products', to: '/products', icon: 'Package' }, // read-only
      { label: 'Inventory', to: '/consignment/inventory', icon: 'Boxes' },
      { label: 'Sales', to: '/consignment/sales', icon: 'Receipt' },
    ]},
  ],

  QUOTE_VIEWER: [
    { section: 'ยินดีต้อนรับ', items: [{ label: 'Dashboard', to: '/' }] },
    { section: '', items: [
      { label: 'Quotes', to: '/quotes', icon: 'FileText' },
      { label: 'Products', to: '/products', icon: 'Package' }, // read-only
    ]},
  ],
};
