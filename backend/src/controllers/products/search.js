// backend/src/controllers/products/search.js
import { searchProducts, searchProductsWithStock } from "#app/services/products/product.service.js";

/**
 * GET /api/products/search?q=&branchId=&take=
 * - ถ้ามี branchId → จะรวม stockQty ของสาขานั้นมาด้วย (เหมาะกับ POS)
 * - ถ้าไม่ส่ง branchId → คืนเฉพาะข้อมูลสินค้า (autocomplete ทั่วไป)
 */
export async function search(req, res) {
  try {
    const q = String(req.query.q || "");
    const branchId = req.query.branchId ? Number(req.query.branchId) : null;
    const take = req.query.take ? Number(req.query.take) : 20;

    const items = branchId
      ? await searchProductsWithStock(q, branchId, { take })
      : await searchProducts(q, { take });

    // รูปแบบตอบกลับสอดคล้องกับไฟล์เดิมของคุณ
    res.json({ items });
  } catch (e) {
    console.error("[products.search]", e);
    res.status(500).json({ message: "server error" });
  }
}
