import { Router } from "express";
import {
  listCategoriesOfPartner,
  createCategoryForPartner,
  updateCategoryOfPartner,
} from "#app/controllers/consignment/consignmentCategories.Controller.js";

const router = Router({ mergeParams: true });

// GET /api/consignment/partners/:partnerId/categories
router.get("/:partnerId/categories", listCategoriesOfPartner);

// POST /api/consignment/partners/:partnerId/categories
router.post("/:partnerId/categories", createCategoryForPartner);

// PUT /api/consignment/partners/:partnerId/categories/:categoryId
router.put("/:partnerId/categories/:categoryId", updateCategoryOfPartner);

export default router;
