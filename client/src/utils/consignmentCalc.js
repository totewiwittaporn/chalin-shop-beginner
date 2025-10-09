// client/src/utils/consignmentCalc.js
export function resolveCommissionPct({ categoryOverride, shop }) {
  if (categoryOverride?.commissionPct != null && categoryOverride.commissionPct !== '') {
    return Number(categoryOverride.commissionPct);
  }
  if (shop?.commissionPct != null && shop.commissionPct !== '') {
    return Number(shop.commissionPct);
  }
  return 0;
}

export function calcNetUnitPrice({ product, category, shop, categoryOverride }) {
  if (category?.netUnitPrice != null && category.netUnitPrice !== '')
    return Number(category.netUnitPrice);
  const pct = resolveCommissionPct({ categoryOverride, shop });
  const base = Number(product.salePrice || product.basePrice || 0);
  return Math.max(0, base * (1 - pct/100));
}
