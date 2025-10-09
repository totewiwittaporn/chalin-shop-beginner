// client/src/store/dataStore.js (Loader-capable mock)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
let _idBump = 0; const genId = () => Date.now() + (_idBump++ % 1000);
const fmtDocNo = (prefix) => `${prefix}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*900+100)}`;
const clone = (o) => JSON.parse(JSON.stringify(o));
const ensure = (obj, key, init = {}) => { if (!obj[key]) obj[key] = clone(init); return obj[key]; };
const getQty = (bucket, k) => Number(bucket?.[k] || 0);
const setQty = (bucket, k, v) => { bucket[k] = Math.max(0, Number(v||0)); };
const initial = () => ({
  products: [], branches: [], consignmentShops: [],
  consignmentCategories: [], productConsignmentMap: [], consignmentCategoryOverrides: [],
  templates: { delivery: [], invoice: [], receipt: [] }, consignmentDocRefs: [],
  centralStock: {}, branchStock: {}, consignmentStock: {},
  suppliers: [], purchases: [], branchDeliveries: [], branchSales: [],
  consignmentDeliveries: [], consignmentSales: [], prospects: [], quotes: [],
  currentUser: { id: 1, name: 'Admin', role: 'admin', branchId: null },
});
export const useDataStore = create(persist((set, get) => ({
  ...initial(),
  loadDataset: (dataset) => {
    const safe = (k, def) => dataset && dataset[k] !== undefined ? dataset[k] : def;
    set({
      products: safe('products', []), branches: safe('branches', []),
      consignmentShops: safe('consignmentShops', []),
      consignmentCategories: safe('consignmentCategories', []),
      productConsignmentMap: safe('productConsignmentMap', []),
      consignmentCategoryOverrides: safe('consignmentCategoryOverrides', []),
      templates: safe('templates', { delivery: [], invoice: [], receipt: [] }),
      consignmentDocRefs: safe('consignmentDocRefs', []),
      centralStock: safe('centralStock', {}),
      branchStock: safe('branchStock', {}),
      consignmentStock: safe('consignmentStock', {}),
      suppliers: safe('suppliers', []),
      purchases: safe('purchases', []),
      branchDeliveries: safe('branchDeliveries', []),
      branchSales: safe('branchSales', []),
      consignmentDeliveries: safe('consignmentDeliveries', []),
      consignmentSales: safe('consignmentSales', []),
      prospects: safe('prospects', []), quotes: safe('quotes', []),
      currentUser: safe('currentUser', { id: 1, name: 'Admin', role: 'admin', branchId: null }),
    });
  },
  resetAll: () => set(initial()),
  addBranchDelivery: ({ date, branchId, lines, note }) => {
    const s = get(); const central = clone(s.centralStock);
    const bStock = clone(s.branchStock); const bucket = ensure(bStock, branchId, {});
    for (const l of lines) { const need = Number(l.qty)||0; const curCentral = Number(central[l.productId]||0);
      if (curCentral < need) throw new Error('สต็อกคลังกลางไม่พอ');
      setQty(central, l.productId, curCentral - need);
      setQty(bucket, l.productId, Number(bucket[l.productId]||0) + need);
    }
    const doc = { id: genId(), docNo: fmtDocNo('BD'), type: 'BRANCH_DELIVERY', date, branchId, lines: clone(lines), note: note || '' };
    set({ centralStock: central, branchStock: bStock, branchDeliveries: [doc, ...s.branchDeliveries] });
    return doc;
  },
  addConsignmentDelivery: ({ date, shopId, lines, totals }) => {
    const s = get(); const central = clone(s.centralStock);
    const cStock = clone(s.consignmentStock); const bucket = ensure(cStock, shopId, {});
    for (const l of lines) { const need = Number(l.qty)||0; const curCentral = Number(central[l.productId]||0);
      if (curCentral < need) throw new Error('สต็อกคลังกลางไม่พอ');
      setQty(central, l.productId, curCentral - need);
      setQty(bucket, l.productId, Number(bucket[l.productId]||0) + need);
    }
    const doc = { id: genId(), docNo: fmtDocNo('CD'), type: 'CONSIGNMENT_DELIVERY', date, shopId, lines: clone(lines), totals: clone(totals||{net:0,com:0}) };
    set({ centralStock: central, consignmentStock: cStock, consignmentDeliveries: [doc, ...s.consignmentDeliveries] });
    return doc;
  },
  addPurchase: ({ date, supplierId, lines }) => {
    const total = (lines||[]).reduce((sum, l) => sum + (Number(l.qty)||0)*(Number(l.price)||0), 0);
    const doc = { id: genId(), docNo: fmtDocNo('PO'), docDate: date, supplierId, lines: clone(lines||[]), total, status: 'ORDERED' };
    set((s)=> ({ purchases: [doc, ...s.purchases] })); return doc;
  },
}), { name: 'csb-store', partialize: (s) => s }));
