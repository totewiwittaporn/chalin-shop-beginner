import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";

const prisma = new PrismaClient();
const router = Router();

// GET /api/branches (ล็อกอินใครก็ได้)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await prisma.branch.findMany({ orderBy: { id: "asc" } });
    res.json(rows);
  } catch (e) { next(e); }
});

// POST /api/branches (ADMIN เท่านั้น)
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { code, name, address, commissionPercent } = req.body;
    const created = await prisma.branch.create({
      data: { code, name, address, commissionPercent },
    });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

export default router;
