import { Router } from "express";
import {
  listProductsOfCategory,
  addProductsToCategory,
  removeProductFromCategory,
} from "#app/controllers/consignment/consignmentCategoryProducts.Controller.js";

const router = Router({ mergeParams: true });

// GET /api/consignment/categories/:categoryId/products
router.get("/:categoryId/products", listProductsOfCategory);

// POST /api/consignment/categories/:categoryId/products
// body: { productIds: number[] }
router.post("/:categoryId/products", addProductsToCategory);

// DELETE /api/consignment/categories/:categoryId/products/:productId
router.delete("/:categoryId/products/:productId", removeProductFromCategory);

export default router;
