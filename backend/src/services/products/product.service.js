// backend/src/services/products/product.service.js
import prisma from "#app/lib/prisma.js";

/** แปลงสินค้าเป็นรูปแบบมาตรฐานที่ฝั่ง client ใช้ */
function mapProduct(p) {
  return {
    id: p.id,
    name: p.name,
    barcode: p.barcode,
    costPrice: Number(p.costPrice ?? 0),
    price: Number(p.salePrice ?? 0),   // ใช้ salePrice เป็นราคาขาย
  };
}

/** ค้นหาสินค้า (autocomplete) ด้วย name/barcode (และ sku ถ้ามีใน schema) */
export async function searchProducts(q, { take = 20 } = {}) {
  const query = String(q || "").trim();
  if (!query) return [];

  const items = await prisma.product.findMany({
    where: {
      OR: [
        { name:    { contains: query, mode: "insensitive" } },
        { barcode: { contains: query, mode: "insensitive" } },
        // ถ้ามี sku ใน schema: { sku: { contains: query, mode: "insensitive" } }
      ],
    },
    select: { id: true, name: true, barcode: true, costPrice: true, salePrice: true },
    orderBy: [{ name: "asc" }],
    take: Math.min(100, Number(take) || 20),
  });

  return items.map(mapProduct);
}

/** ดึงรายการสินค้าเต็ม (สำหรับหน้าตารางสินค้า) */
export async function listProducts({ q = "", page = 1, pageSize = 20 } = {}) {
  const take = Math.min(100, Number(pageSize) || 20);
  const skip = Math.max(0, (Number(page) || 1) - 1) * take;

  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip,
      take,
      select: { id: true, name: true, barcode: true, costPrice: true, salePrice: true },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(mapProduct),
    total,
    page: Number(page) || 1,
    pageSize: take,
  };
}

/** ดึง stockQty ของสินค้า “หลายตัว” ภายใต้ branchId ที่กำหนด → คืน Map(productId → qty) */
export async function getStockMapByBranch(branchId, productIds) {
  if (!branchId || !Array.isArray(productIds) || productIds.length === 0) return new Map();
  const rows = await prisma.inventory.findMany({
    where: { branchId: Number(branchId), productId: { in: productIds } },
    select: { productId: true, qty: true },
  });
  return new Map(rows.map(r => [r.productId, Number(r.qty || 0)]));
}

/** ค้นหา + รวมสต็อกของ “สาขาที่เลือก” (ใช้กับ POS โดยตรง) */
export async function searchProductsWithStock(q, branchId, { take = 20 } = {}) {
  const products = await searchProducts(q, { take });
  if (!branchId || products.length === 0) return products.map(p => ({ ...p, stockQty: null }));

  const ids = products.map(p => p.id);
  const stockMap = await getStockMapByBranch(branchId, ids);

  return products.map(p => ({
    ...p,
    stockQty: Number(stockMap.get(p.id) ?? 0),
  }));
}

/** สร้างสินค้าใหม่ */
export async function createProduct(data, { actor } = {}) {
  // ตัวอย่าง policy: STAFF ใช้ branchId ของตัวเอง, ADMIN กรอกได้
  const payload = {
    barcode: String(data.barcode).trim(),
    name:    String(data.name).trim(),
    productTypeId: data.productTypeId ? Number(data.productTypeId) : null,
    costPrice: Number(data.costPrice) || 0,
    salePrice: Number(data.salePrice) || 0,
    branchId: actor?.role === "STAFF" ? actor.branchId ?? null : (data.branchId ?? null),
  };

  const created = await prisma.product.create({ data: payload });
  return {
    id: created.id,
    barcode: created.barcode,
    name: created.name,
    costPrice: Number(created.costPrice || 0),
    salePrice: Number(created.salePrice || 0),
    productTypeId: created.productTypeId,
  };
}

/** แก้ไขสินค้า */
export async function updateProduct(id, data) {
  const payload = {};
  if (data.barcode !== undefined)    payload.barcode = String(data.barcode).trim();
  if (data.name !== undefined)       payload.name    = String(data.name).trim();
  if (data.costPrice !== undefined)  payload.costPrice = Number(data.costPrice) || 0;
  if (data.salePrice !== undefined)  payload.salePrice = Number(data.salePrice) || 0;
  if (data.productTypeId !== undefined)
    payload.productTypeId = data.productTypeId ? Number(data.productTypeId) : null;

  const updated = await prisma.product.update({
    where: { id: Number(id) },
    data: payload,
    select: { id: true, barcode: true, name: true, costPrice: true, salePrice: true, productTypeId: true },
  });

  return {
    id: updated.id,
    barcode: updated.barcode,
    name: updated.name,
    costPrice: Number(updated.costPrice || 0),
    salePrice: Number(updated.salePrice || 0),
    productTypeId: updated.productTypeId,
  };
}

/** รายงานคงเหลือน้อย (ตัวอย่างจากไฟล์เดิมของคุณ) */
export async function listLowStock({ role, branchId, partnerId, lt = 10, take = 50 } = {}) {
  lt = Math.max(0, Number(lt));
  take = Math.min(Math.max(1, Number(take)), 200);

  if (role === "CONSIGNMENT" && partnerId) {
    const rows = await prisma.consignmentInventory.findMany({
      where: { consignmentPartnerId: partnerId, qty: { lte: lt } },
      include: { product: true },
      orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
      take,
    });
    return rows.map(r => ({ id: r.productId, name: r.product?.name ?? null, stockQty: Number(r.qty || 0) }));
  }

  if (role === "STAFF" && branchId) {
    const rows = await prisma.inventory.findMany({
      where: { branchId, qty: { lte: lt } },
      include: { product: true },
      orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
      take,
    });
    return rows.map(r => ({ id: r.productId, name: r.product?.name ?? null, stockQty: Number(r.qty || 0) }));
  }

  // ADMIN หรือไม่มี branch เฉพาะ → รวมทุกสาขาแล้วสรุป
  const rows = await prisma.inventory.findMany({
    where: { qty: { lte: lt } },
    include: { product: true },
    orderBy: [{ qty: "asc" }, { product: { name: "asc" } }],
    take: 1000,
  });

  const sumByProduct = new Map();
  for (const r of rows) {
    const cur = sumByProduct.get(r.productId) || { id: r.productId, name: r.product?.name ?? null, stockQty: 0 };
    cur.stockQty += Number(r.qty || 0);
    sumByProduct.set(r.productId, cur);
  }

  return Array.from(sumByProduct.values())
    .filter(it => it.stockQty <= lt)
    .sort((a, b) => a.stockQty - b.stockQty || String(a.name).localeCompare(String(b.name)))
    .slice(0, take);
}
