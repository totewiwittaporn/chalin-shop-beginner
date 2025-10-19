// backend/src/controllers/products/create.js
import { createProduct } from "#app/services/products/product.service.js";

export async function create(req, res, next) {
  try {
    const { barcode, name, costPrice, salePrice, productTypeId, branchId } = req.body || {};
    if (!barcode || !name) return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });

    const actor = { role: String(req.user?.role || "").toUpperCase(), branchId: req.user?.branchId ?? null };
    const created = await createProduct({ barcode, name, costPrice, salePrice, productTypeId, branchId }, { actor });
    res.status(201).json(created);
  } catch (e) {
    if (e?.code === "P2002") return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });
    next(e);
  }
}
