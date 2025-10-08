// Extended mock store with dates, reorder levels, quotes & settlements
import { create } from 'zustand';
import dayjs from 'dayjs';

const productTypes = [
  { id: 1, name: 'Hair Clips' },
  { id: 2, name: 'Accessories' },
];

const products = [
  { id: 1, sku: 'GB-CLIP-RED', name: 'กิ๊บสีแดง', basePrice: 25, typeId: 1, reorderLevel: 15 },
  { id: 2, sku: 'GB-CLIP-SEA', name: 'กิ๊บทะเล', basePrice: 25, typeId: 1, reorderLevel: 20 },
  { id: 3, sku: 'AC-BAND-01', name: 'ที่คาดผม', basePrice: 40, typeId: 2, reorderLevel: 10 },
];

const branches = [
  { id: 1, code: 'MAIN', name: 'สาขาหลัก', type: 'MAIN' },
  { id: 2, code: 'B1', name: 'สาขา 1', type: 'BRANCH' },
];

const consignmentShops = [
  { id: 1, name: 'ร้านฝาก A', owner: 'คุณเอ' },
  { id: 2, name: 'ร้านฝาก B', owner: 'คุณบี' },
];

const inventory = [
  { id: 1, productId: 1, locationType: 'MAIN', locationId: 1, qty: 120 },
  { id: 2, productId: 2, locationType: 'BRANCH', locationId: 2, qty: 9 }, // low
  { id: 3, productId: 3, locationType: 'CONSIGNMENT', locationId: 1, qty: 8 }, // low
];

const purchases = [
  {
    id: 1001,
    docNo: 'PO-MAIN-202510-0001',
    docDate: dayjs().subtract(2, 'day').format('YYYY-MM-DD'),
    branchId: 1,
    supplier: 'Supplier X',
    status: 'DRAFT',
    lines: [{ productId: 1, qty: 50, price: 20 }],
  },
  {
    id: 1002,
    docNo: 'PO-B1-202510-0001',
    docDate: dayjs().format('YYYY-MM-DD'),
    branchId: 2,
    supplier: 'Supplier Y',
    status: 'CONFIRMED',
    lines: [{ productId: 2, qty: 30, price: 18 }],
  },
];

const transfers = [
  {
    id: 2001,
    docNo: 'TR-MAIN-B1-0001',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    fromBranchId: 1,
    toBranchId: 2,
    status: 'SHIPPED',
    lines: [{ productId: 1, qty: 20 }],
  },
];

const sales = [
  {
    id: 3001,
    docNo: 'INV-B1-202510-0001',
    docDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
    branchId: 2,
    status: 'PAID',
    lines: [{ productId: 2, qty: 2, price: 30 }],
  },
  {
    id: 3002,
    docNo: 'INV-B1-202510-0002',
    docDate: dayjs().format('YYYY-MM-DD'),
    branchId: 2,
    status: 'PAID',
    lines: [{ productId: 1, qty: 1, price: 35 }],
  },
];

const quotes = [
  {
    id: 4001,
    docNo: 'Q-202510-0001',
    docDate: dayjs().subtract(3, 'day').format('YYYY-MM-DD'),
    customer: 'Customer A',
    status: 'SENT',
  },
  {
    id: 4002,
    docNo: 'Q-202510-0002',
    docDate: dayjs().format('YYYY-MM-DD'),
    customer: 'Customer B',
    status: 'DRAFT',
  },
];

// Settlements for consignment
const consignmentSettlements = [
  {
    id: 5001,
    shopId: 1,
    period: '2025-10',
    dueDate: dayjs().add(5, 'day').format('YYYY-MM-DD'),
    amount: 2150,
    status: 'PENDING',
  },
  {
    id: 5002,
    shopId: 2,
    period: '2025-10',
    dueDate: dayjs().add(12, 'day').format('YYYY-MM-DD'),
    amount: 980,
    status: 'PENDING',
  },
];

export const useDataStore = create((set, get) => ({
  productTypes: [...productTypes],
  products: [...products],
  branches: [...branches],
  consignmentShops: [...consignmentShops],
  inventory: [...inventory],
  purchases: [...purchases],
  transfers: [...transfers],
  sales: [...sales],
  quotes: [...quotes],
  consignmentSettlements: [...consignmentSettlements],

  addProduct: (p) =>
    set((s) => ({ products: [...s.products, { id: Date.now(), reorderLevel: 10, ...p }] })),
  updateProduct: (id, patch) =>
    set((s) => ({ products: s.products.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
  removeProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
}));
