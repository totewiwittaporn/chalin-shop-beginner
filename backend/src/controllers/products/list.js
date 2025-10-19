// backend/src/controllers/products/list.js
import { listProducts } from "#app/services/products/product.service.js";

export async function list(req, res) {
  try {
    const { q = "", page = 1, pageSize = 20 } = req.query;
    const data = await listProducts({ q, page, pageSize });
    res.json(data); // { items, total, page, pageSize }
  } catch (e) {
    console.error("[products.list]", e);
    res.status(500).json({ message: "server error" });
  }
}
