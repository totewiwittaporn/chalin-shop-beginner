// backend/src/services/price/resolveConsignPrice.js
// ตัดสินราคาที่ใช้จริงสำหรับร้านฝากขาย:
// - ถ้า consignmentInventory มีราคา → ใช้ราคาอันนั้น
// - ถ้าไม่มีก็ใช้ราคาขายของสินค้า (product.salePrice)

import prisma from "#app/lib/prisma.js";

export async function resolveConsignPrice(partnerId, productId, productSalePrice) {
  const fallback = Number(productSalePrice || 0);
  if (!partnerId || !productId) return fallback;

  const inv = await prisma.consignmentInventory
    .findUnique({
      where: { partnerId_productId: { partnerId: Number(partnerId), productId: Number(productId) } },
      select: { price: true },
    })
    .catch(() => null);

  const p = Number(inv?.price ?? NaN);
  return Number.isFinite(p) ? p : fallback;
}
