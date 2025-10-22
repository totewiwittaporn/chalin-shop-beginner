// backend/src/routes/consignment/index.js
import { Router } from "express";
import { requireAuth } from "#app/middleware/auth.js";

// แยกไฟล์ย่อยตามที่ทีมีอยู่แล้ว
import partnersRoutes from "#app/routes/consignment/consignment.partners.routes.js";
import categoriesRoutes from "#app/routes/consignment/consignment.categories.routes.js";
import categoryProductsRoutes from "#app/routes/consignment/consignment.categoryProducts.routes.js";

const router = Router();

// ต้องล็อกอินก่อนทุก endpoint (ถ้าต้องการแบ่ง role เพิ่มเติม ให้ไปคุมในแต่ละไฟล์ย่อยหรือ middleware ชั้นใน)
router.use(requireAuth);

// === Partners ===
// /api/consignment/partners/...
router.use("/partners", partnersRoutes);

// === Categories of a Partner ===
// หมายเหตุ: ไฟล์ categoriesRoutes ประกาศ path เป็น "/:partnerId/categories"
// พอ mount ไว้ใต้ "/partners" แล้ว path จะกลายเป็น:
//   /api/consignment/partners/:partnerId/categories
router.use("/partners", categoriesRoutes);

// === Category Products ===
// ไฟล์ categoryProductsRoutes ประกาศ path เป็น "/:categoryId/products"
// พอ mount ไว้ใต้ "/categories" แล้ว path จะกลายเป็น:
//   /api/consignment/categories/:categoryId/products
router.use("/categories", categoryProductsRoutes);

export default router;
