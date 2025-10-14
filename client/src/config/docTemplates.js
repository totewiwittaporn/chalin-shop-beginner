export const DOC_TYPES = {
  BILL_CONSIGNMENT: 'BILL_CONSIGNMENT',
  RECEIPT_STANDARD: 'RECEIPT_STANDARD',
  DELIVERY_BRANCH: 'DELIVERY_BRANCH',
  DELIVERY_CONSIGNMENT: 'DELIVERY_CONSIGNMENT',
};

export const BASE_TEMPLATES = {
  [DOC_TYPES.BILL_CONSIGNMENT]: {
    title: 'ใบวางบิล',
    headLayout: 'two-columns',
    table: {
      columns: [
        { key: 'no', label: 'No', w: 56, align: 'center' },
        { key: 'name', label: 'Description', flex: 1 },
        { key: 'unitPrice', label: 'Price', w: 110, align: 'right' },
        { key: 'qty', label: 'QTY', w: 80, align: 'right' },
        { key: 'amount', label: 'Total', w: 120, align: 'right' },
      ],
      summaryColumns: [
        { key: 'name', label: 'Description', flex: 1 },
        { key: 'amount', label: 'Total', w: 140, align: 'right' },
      ],
    },
    footer: { signLeft: 'ผู้วางบิล', signRight: 'ผู้รับเงิน' },
  },
  [DOC_TYPES.RECEIPT_STANDARD]: {
    title: 'ใบเสร็จรับเงิน',
    headLayout: 'two-columns',
    table: {
      columns: [
        { key: 'no', label: 'No', w: 56, align: 'center' },
        { key: 'name', label: 'รายการ', flex: 1 },
        { key: 'amount', label: 'จำนวนเงิน', w: 140, align: 'right' },
      ],
    },
    footer: { signLeft: 'ผู้รับเงิน', signRight: 'ผู้ตรวจสอบ' },
  },
  [DOC_TYPES.DELIVERY_BRANCH]: {
    title: 'ใบส่งสินค้า',
    headLayout: 'two-columns',
    table: {
      columns: [
        { key: 'no', label: 'No', w: 56, align: 'center' },
        { key: 'code', label: 'Code', w: 120 },
        { key: 'name', label: 'Description', flex: 1 },
        { key: 'qty', label: 'QTY', w: 90, align: 'right' },
        { key: 'unitPrice', label: 'Unit Price', w: 120, align: 'right' },
        { key: 'amount', label: 'Amount', w: 120, align: 'right' },
      ],
    },
    footer: { signLeft: 'ผู้รับสินค้า', signRight: 'ผู้ส่งสินค้า' },
  },
  [DOC_TYPES.DELIVERY_CONSIGNMENT]: {
    title: 'DELIVERY',
    headLayout: 'two-columns',
    table: {
      columns: [
        { key: 'no', label: 'No', w: 56, align: 'center' },
        { key: 'code', label: 'Code', w: 120 },
        { key: 'name', label: 'Description', flex: 1 },
        { key: 'qty', label: 'QTY', w: 90, align: 'right' },
        { key: 'unitPrice', label: 'Unit Price', w: 120, align: 'right' },
        { key: 'amount', label: 'Amount', w: 120, align: 'right' },
      ],
    },
    footer: { signLeft: 'Receiver', signRight: 'Deliverer' },
  },
};

export function deepMerge(target, source) {
  if (!source) return target;
  const out = Array.isArray(target) ? [...target] : { ...target };
  for (const [k, v] of Object.entries(source)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(target[k] || {}, v) : v;
  }
  return out;
}

export function getDocTemplate(docType, partnerCode, overrides) {
  // partnerCode reserved for future per-partner overrides
  return deepMerge(BASE_TEMPLATES[docType], overrides || {});
}
