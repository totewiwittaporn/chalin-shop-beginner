// client/src/store/dataStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';

/** ---------- helpers ---------- */
let _idBump = 0;
const genId = () => Date.now() + (_idBump++ % 1000);
const fmtDocNo = (prefix) => `${prefix}-${dayjs().format('YYMMDD')}-${Math.floor(Math.random()*900+100)}`;

const clone = (o) => JSON.parse(JSON.stringify(o));
const ensure = (obj, key, init = {}) => { if (!obj[key]) obj[key] = clone(init); return obj[key]; };
const getQty = (bucket, k) => Number(bucket?.[k] || 0);
const setQty = (bucket, k, v) => { bucket[k] = Math.max(0, Number(v||0)); };

/** ---------- default seed data (mock) ---------- */
const seed = () => {
  const products = [
    { id: 101, sku: 'TS-RED-M',   name: 'เสื้อยืด สีแดง M',  basePrice: 150, salePrice: 199, unit: 'ชิ้น' },
    { id: 102, sku: 'TS-BLK-L',   name: 'เสื้อยืด สีดำ L',   basePrice: 160, salePrice: 219, unit: 'ชิ้น' },
    { id: 103, sku: 'HDY-NVY-F',  name: 'ฮู้ดดี้ น้ำเงิน Free', basePrice: 320, salePrice: 399, unit: 'ชิ้น' },
    { id: 104, sku: 'CAP-CLS',    name: 'หมวก Chalin',       basePrice: 90,  salePrice: 129, unit: 'ชิ้น' },
  ];

  const branches = [
    { id: 201, code: 'PNA-KRBR-GVT', name: 'CLS-GVT (กรีนวิวทัวร์)' },
    { id: 202, code: 'PNA-TKTN-CTR', name: 'CLS-CTR (ตัวเมือง)' },
  ];

  const consignmentShops = [
    { id: 301, nameInternal: 'LITTLE', commissionPct: 30, companyTh: 'ลิตเติ้ล ช็อป', taxId: '0-0000-00000-00-0' },
    { id: 302, nameInternal: 'RO',     commissionPct: 25, companyTh: 'อาร์โอ สโตร์',   taxId: '0-0000-00000-00-0' },
  ];

  // หมวดของร้านฝากขาย + mapping สินค้า -> หมวด (ต่อร้าน)
  const consignmentCategories = [
    { id: 401, shopId: 301, code: 'L-TEE', name: 'เสื้อยืด',            netUnitPrice: null },
    { id: 402, shopId: 301, code: 'L-ACC', name: 'อุปกรณ์/หมวก',       netUnitPrice: null },
    { id: 403, shopId: 302, code: 'R-TOP', name: 'ท่อนบน',             netUnitPrice: null },
    { id: 404, shopId: 302, code: 'R-ACC', name: 'ของที่ระลึก/หมวก',   netUnitPrice: null },
  ];

  const productConsignmentMap = [
    { id: 501, productId: 101, shopId: 301, categoryId: 401 },
    { id: 502, productId: 102, shopId: 301, categoryId: 401 },
    { id: 503, productId: 104, shopId: 301, categoryId: 402 },

    { id: 504, productId: 101, shopId: 302, categoryId: 403 },
    { id: 505, productId: 103, shopId: 302, categoryId: 403 },
    { id: 506, productId: 104, shopId: 302, categoryId: 404 },
  ];

  // override คอมมิชชั่นรายหมวด (ถ้าไม่ตั้ง = ใช้คอมร้าน)
  const consignmentCategoryOverrides = [
    // ตัวอย่าง: ร้าน LITTLE ตั้งหมวดหมวก คอม 28%
    { id: 601, shopId: 301, categoryId: 402, commissionPct: 28 },
  ];

  // เทมเพลต (global): Delivery (F2 default), Invoice (B3 default), Receipt (Simple)
  const nowId = () => genId();
  const templates = {
    delivery: [
      { id: nowId(), name: 'Delivery – F2/Chalin/Chalisa (default)',
        head: { type: 'CHALIN_CLOTHES', logo: null, showTaxId: true },
        body: { type: 'F2_GROUP_BY_CATEGORY', columns: ['no','code','name','qty','unitPrice','amount','commissionPct','commissionAmount'] },
        footer: { type: 'CHALISA', showReceiverToday: true, notes: '' },
        options: { paper: 'A4', currency: 'THB' }
      },
      { id: nowId(), name: 'Delivery – F2/Sukanya',
        head: { type: 'SUKANYA_WIWITPHORN', logo: null, showTaxId: true },
        body: { type: 'F2_GROUP_BY_CATEGORY', columns: ['no','code','name','qty','unitPrice','amount'] },
        footer: { type: 'SUKANYA', showReceiverToday: true, notes: '' },
        options: { paper: 'A4', currency: 'THB' }
      }
    ],
    invoice: [
      { id: nowId(), name: 'Invoice – B3 Grouped (default)',
        head: { type: 'CHALIN_CLOTHES', showTaxId: true },
        body: { type: 'B3_GROUP_BY_CATEGORY', columns: ['no','code','desc','qty','unitPrice','amount','commissionPct','commissionAmount'] },
        footer: { type: 'CHALISA', notes: '' },
        options: { paper: 'A4' }
      },
      { id: nowId(), name: 'Invoice – B1 Monthly Summary',
        head: { type: 'CHALIN_CLOTHES', showTaxId: true },
        body: { type: 'B1_MONTHLY_DESC', columns: ['no','desc','amount'] },
        footer: { type: 'CHALISA', notes: '' },
        options: { paper: 'A4' }
      }
    ],
    receipt: [
      { id: nowId(), name: 'Receipt – Simple',
        head: { type: 'CHALIN_CLOTHES', showTaxId: true },
        body: { type: 'ITEMS_SUMMARY', columns: ['desc','amount'] },
        footer: { type: 'CHALISA', notes: 'ขอบคุณที่อุดหนุน' },
        options: { paper: 'A5' }
      }
    ],
  };

  // mapping ร้าน -> เทมเพลตเริ่มต้น
  const consignmentDocRefs = consignmentShops.map((s) => ({
    shopId: s.id,
    deliveryTemplateId: templates.delivery[0].id, // F2 default
    invoiceTemplateId: templates.invoice[0].id,   // B3 default
    receiptTemplateId: templates.receipt[0].id,
  }));

  // สต็อกเริ่มต้น
  const centralStock = { 101: 50, 102: 40, 103: 20, 104: 60 };
  const branchStock = {
    [branches[0].id]: { 101: 5, 102: 3, 104: 4 },
    [branches[1].id]: { 103: 2, 104: 3 },
  };
  const consignmentStock = {
    [consignmentShops[0].id]: { 101: 6, 104: 5 },
    [consignmentShops[1].id]: { 101: 4, 103: 2, 104: 4 },
  };

  return {
    products, branches, consignmentShops,
    consignmentCategories, productConsignmentMap, consignmentCategoryOverrides,
    consignmentDocRefs, templates,
    centralStock, branchStock, consignmentStock,
  };
};

/** ---------- Store ---------- */
export const useDataStore = create(
  persist(
    (set, get) => ({
      /** Entities & settings */
      ...seed(),

      /** UI / auth (mock) */
      currentUser: { id: 1, name: 'Admin', role: 'admin', branchId: null },

      /** Documents (mock) */
      branchDeliveries: [],       // {id, docNo, date, branchId, lines, note}
      branchSales: [],            // {id, docNo, date, branchId, payMethod, lines, amount}
      consignmentDeliveries: [],  // {id, docNo, date, shopId, lines, totals}
      consignmentSales: [],       // {id, docNo, date, shopId, lines, totals, status: 'POSTED'}

      /** ---------- Templates (global) ---------- */
      initDefaultTemplates: () => {
        const s = get();
        if ((s.templates?.delivery?.length || 0) > 0) return; // already seeded via persist
        const seeded = seed().templates;
        set({ templates: seeded });
      },
      createTemplate: (kind, tpl) => {
        const { templates } = get();
        const arr = [...(templates?.[kind] || [])];
        arr.push({ id: genId(), ...tpl });
        set({ templates: { ...templates, [kind]: arr } });
      },
      updateTemplate: (kind, id, patch) => {
        const { templates } = get();
        const arr = (templates?.[kind] || []).map(t => t.id === id ? { ...t, ...patch } : t);
        set({ templates: { ...templates, [kind]: arr } });
      },
      deleteTemplate: (kind, id) => {
        const { templates, consignmentDocRefs } = get();
        // ป้องกันลบเทมเพลตที่กำลังใช้งาน (อย่างน้อยเตือนผู้ใช้ก่อน)
        const used = (consignmentDocRefs||[]).some(r =>
          (kind === 'delivery' && r.deliveryTemplateId === id) ||
          (kind === 'invoice'  && r.invoiceTemplateId === id)  ||
          (kind === 'receipt'  && r.receiptTemplateId === id)
        );
        if (used) {
          alert('Template นี้ถูกใช้อยู่โดยร้านฝากขายอย่างน้อย 1 ร้าน — กรุณาเปลี่ยน template ของร้านก่อนลบ');
          return;
        }
        const arr = (templates?.[kind] || []).filter(t => t.id !== id);
        set({ templates: { ...templates, [kind]: arr } });
      },

      /** mapping ร้าน → template ids */
      setConsignmentDocRefs: (shopId, patch) => {
        const arr = [...(get().consignmentDocRefs || [])];
        const i = arr.findIndex(x => x.shopId === shopId);
        const base = { shopId, deliveryTemplateId: null, invoiceTemplateId: null, receiptTemplateId: null };
        if (i >= 0) arr[i] = { ...base, ...arr[i], ...patch };
        else arr.push({ ...base, ...patch });
        set({ consignmentDocRefs: arr });
      },

      /** ---------- Consignment shops CRUD ---------- */
      addConsignmentShop: (payload) => {
        const id = genId();
        set((s) => ({
          consignmentShops: [ ...(s.consignmentShops||[]), { id, ...payload } ],
          // prepare stock bucket
          consignmentStock: { ...s.consignmentStock, [id]: s.consignmentStock?.[id] || {} }
        }));
        // set default templates mapping (fallback to first of each kind)
        const { templates } = get();
        get().setConsignmentDocRefs(id, {
          deliveryTemplateId: payload.deliveryTemplateId || (templates.delivery?.[0]?.id || null),
          invoiceTemplateId:  payload.invoiceTemplateId  || (templates.invoice?.[0]?.id  || null),
          receiptTemplateId:  payload.receiptTemplateId  || (templates.receipt?.[0]?.id  || null),
        });
      },

      /** ---------- Stock mutation helpers ---------- */
      moveCentralToBranch: (branchId, lines) => {
        const s = get();
        const central = clone(s.centralStock);
        const bStock = clone(s.branchStock);
        const bucket = ensure(bStock, branchId, {});
        for (const l of lines) {
          const need = Number(l.qty)||0;
          const curCentral = getQty(central, l.productId);
          if (curCentral < need) throw new Error('สต็อกคลังกลางไม่พอสำหรับบางรายการ');
          setQty(central, l.productId, curCentral - need);
          const curB = getQty(bucket, l.productId);
          setQty(bucket, l.productId, curB + need);
        }
        set({ centralStock: central, branchStock: bStock });
      },

      reduceBranchBySale: (branchId, lines) => {
        const s = get();
        const bStock = clone(s.branchStock);
        const bucket = ensure(bStock, branchId, {});
        for (const l of lines) {
          const q = Number(l.qty)||0;
          const cur = getQty(bucket, l.productId);
          if (cur < q) throw new Error('สต็อกสาขาไม่พอสำหรับบางรายการ');
          setQty(bucket, l.productId, cur - q);
        }
        set({ branchStock: bStock });
      },

      moveCentralToConsignment: (shopId, lines) => {
        const s = get();
        const central = clone(s.centralStock);
        const cStock = clone(s.consignmentStock);
        const bucket = ensure(cStock, shopId, {});
        for (const l of lines) {
          const need = Number(l.qty)||0;
          const curCentral = getQty(central, l.productId);
          if (curCentral < need) throw new Error('สต็อกคลังกลางไม่พอสำหรับบางรายการ');
          setQty(central, l.productId, curCentral - need);
          const curC = getQty(bucket, l.productId);
          setQty(bucket, l.productId, curC + need);
        }
        set({ centralStock: central, consignmentStock: cStock });
      },

      reduceConsignmentBySale: (shopId, lines) => {
        const s = get();
        const cStock = clone(s.consignmentStock);
        const bucket = ensure(cStock, shopId, {});
        for (const l of lines) {
          const q = Number(l.qty)||0;
          const cur = getQty(bucket, l.productId);
          if (cur < q) throw new Error('สต็อกฝากขายไม่พอสำหรับบางรายการ');
          setQty(bucket, l.productId, cur - q);
        }
        set({ consignmentStock: cStock });
      },

      /** ---------- Documents (actions) ---------- */
      addBranchDelivery: ({ date, branchId, lines, note }) => {
        // stock move: central -> branch
        get().moveCentralToBranch(branchId, lines);
        const doc = {
          id: genId(),
          docNo: fmtDocNo('BD'),
          type: 'BRANCH_DELIVERY',
          date, branchId, lines: clone(lines), note: note || ''
        };
        set((s) => ({ branchDeliveries: [doc, ...s.branchDeliveries] }));
        return doc;
      },

      addBranchSale: ({ date, branchId, payMethod, lines, amount }) => {
        // stock down @ branch
        get().reduceBranchBySale(branchId, lines);
        const doc = {
          id: genId(),
          docNo: fmtDocNo('BS'),
          type: 'BRANCH_SALE',
          date, branchId, payMethod, lines: clone(lines),
          amount: Number(amount||0), status: 'PAID'
        };
        set((s) => ({ branchSales: [doc, ...s.branchSales] }));
        return doc;
      },

      addConsignmentDelivery: ({ date, shopId, lines, totals }) => {
        // stock move: central -> consignment(shop)
        get().moveCentralToConsignment(shopId, lines);
        const doc = {
          id: genId(),
          docNo: fmtDocNo('CD'),
          type: 'CONSIGNMENT_DELIVERY',
          date, shopId, lines: clone(lines), totals: clone(totals||{net:0,com:0})
        };
        set((s) => ({ consignmentDeliveries: [doc, ...s.consignmentDeliveries] }));
        return doc;
      },

      postConsignmentSales: ({ date, shopId, lines, totals }) => {
        // stock down @ consignment(shop)
        get().reduceConsignmentBySale(shopId, lines);
        const doc = {
          id: genId(),
          docNo: fmtDocNo('CS'),
          type: 'CONSIGNMENT_SALES',
          date, shopId,
          lines: clone(lines),
          totals: clone(totals||{net:0,com:0}),
          status: 'POSTED'
        };
        set((s) => ({ consignmentSales: [doc, ...s.consignmentSales] }));
        return doc;
      },

      /** ---------- Resets / utilities ---------- */
      resetAll: () => set(seed()),
    }),
    {
      name: 'csb-store',
      partialize: (state) => state, // เก็บทั้งหมด (ถ้าต้องการเลือกเฉพาะบางส่วนค่อยปรับ)
    }
  )
);
