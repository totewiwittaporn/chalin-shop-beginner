// backend/src/controllers/products/update.js
import { updateProduct } from "#app/services/products/product.service.js";

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

    const updated = await updateProduct(id, req.body || {});
    res.json(updated);
  } catch (e) {
    if (e?.code === "P2002") return res.status(409).json({ error: "มีบาร์โค้ดนี้อยู่แล้ว" });
    if (e?.code === "P2025") return res.status(404).json({ error: "ไม่พบสินค้า" });
    next(e);
  }
}
