// backend/src/controllers/products/lowStock.js
import { listLowStock } from "#app/services/products/product.service.js";

export async function lowStock(req, res, next) {
  try {
    const lt   = Number(req.query.lt ?? 10);
    const take = Number(req.query.take ?? 50);
    const role = String(req.user?.role || "").toUpperCase();
    const branchId  = req.user?.branchId ?? null;
    const partnerId = req.user?.partnerId ?? null;

    const items = await listLowStock({ role, branchId, partnerId, lt, take });
    res.json(items);
  } catch (e) {
    next(e);
  }
}
