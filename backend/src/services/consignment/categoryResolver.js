// backend/src/services/consignment/categoryResolver.js
// หา "หมวดหลักของสินค้า" สำหรับร้านฝากขาย
// Rule ง่าย ๆ: เลือกตัวแรกที่แมปไว้ (ขยายเป็น primary flag ได้ในอนาคต)

import prisma from "#app/lib/prisma.js";

export async function resolvePartnerCategory(partnerId, productId) {
  if (!partnerId || !productId) return null;

  const map = await prisma.consignmentCategoryMap
    .findFirst({
      where: { partnerId: Number(partnerId), productId: Number(productId) },
      select: { category: { select: { id: true, code: true, name: true} } },
      orderBy: { id: "asc" },
    })
    .catch(() => null);

  if (!map?.category) return null;
  return {
    id: map.category.id,
    code: map.category.code || null,
    name: map.category.name || null,
  };
}
