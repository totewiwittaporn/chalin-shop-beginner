// client/src/utils/docBuilders.js
export function calcNetUnitPrice({ product, category, shop, categoryOverride }) {
  if (category?.netUnitPrice != null && category.netUnitPrice !== '') return Number(category.netUnitPrice);
  const pct = categoryOverride?.commissionPct ?? shop?.commissionPct ?? 0;
  const base = Number(product.salePrice || product.basePrice || 0);
  return Math.max(0, base * (1 - pct/100));
}

export function buildDeliveryRows({ lines, format, maps, categories, shop, overrides, products }) {
  const byId = new Map(products.map(p=>[p.id,p]));
  if (format === 'F1') {
    return lines.map((l, idx) => {
      const p = byId.get(l.productId) || {};
      const map = maps.find(m => m.productId===l.productId && m.shopId===shop.id);
      const cat = categories.find(c=>c.id===map?.categoryId);
      const ov = overrides.find(o=> o.shopId===shop.id && o.categoryId===map?.categoryId);
      const net = calcNetUnitPrice({ product: p, category: cat, shop, categoryOverride: ov });
      return { no: idx+1, code: p.sku, name: p.name, qty: Number(l.qty)||0, unitPrice: net, amount: (Number(l.qty)||0)*net };
    });
  }
  const bucket = new Map();
  for (const l of lines) {
    const p = byId.get(l.productId) || {};
    const map = maps.find(m => m.productId===l.productId && m.shopId===shop.id);
    if (!map?.categoryId) continue;
    const cat = categories.find(c=>c.id===map.categoryId);
    const ov = overrides.find(o=> o.shopId===shop.id && o.categoryId===map.categoryId);
    const net = calcNetUnitPrice({ product: p, category: cat, shop, categoryOverride: ov });
    const key = String(map.categoryId);
    const cur = bucket.get(key) || { qty: 0, name: cat?.name || 'Uncategorized', code: cat?.code || '', unitPrice: net };
    cur.qty += Number(l.qty)||0;
    bucket.set(key, cur);
  }
  return [...bucket.values()].map((r, i) => ({ no: i+1, code: r.code, name: r.name, qty: r.qty, unitPrice: r.unitPrice, amount: r.qty * r.unitPrice }));
}

export function buildBillingRows({ format, monthLabel, totalAmount, lines, ...ctx }) {
  if (format === 'B1') return [{ no: 1, desc: `ค่าขายสินค้า (${monthLabel})`, qty: 1, unitPrice: totalAmount, amount: totalAmount }];
  if (format === 'B2') return [{ no: 1, desc: `Consignment / (${monthLabel})`, qty: 1, unitPrice: totalAmount, amount: totalAmount }];
  const arr = buildDeliveryRows({ format: 'F2', lines, ...ctx }).map(r => ({ no: r.no, code: r.code, desc: r.name, qty: r.qty, unitPrice: r.unitPrice, amount: r.amount }));
  return arr;
}
