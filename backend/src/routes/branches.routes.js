// backend/src/routes/branches.routes.js
import { Router } from "express";
import { prisma } from "#app/lib/prisma.js";
import { requireAuth, requireRole } from "#app/middleware/auth.js";

const router = Router();

// GET /api/branches
router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        commissionRate: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// POST /api/branches (ADMIN)
router.post("/", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const { code, name, address, commissionRate } = req.body;
    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({ error: "code และ name ต้องไม่ว่าง" });
    }

    const normalizedCode = String(code).toUpperCase().replace(/\s+/g, "-");
    const rateNum = commissionRate === undefined ? null : Number(commissionRate);
    if (rateNum != null && (isNaN(rateNum) || rateNum < 0 || rateNum > 100)) {
      return res.status(400).json({ error: "commissionRate ต้องเป็นตัวเลข 0–100" });
    }

    const created = await prisma.branch.create({
      data: {
        code: normalizedCode,
        name: String(name).trim(),
        address: String(address || "").trim() || null,
        commissionRate: rateNum == null ? null : rateNum
      }
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

// PUT /api/branches/:id (ADMIN)
router.put("/:id", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

    const { code, name, address, commissionRate } = req.body;
    const data = {};
    if (code !== undefined) data.code = String(code).toUpperCase().replace(/\s+/g, "-");
    if (name !== undefined) data.name = String(name).trim();
    if (address !== undefined) data.address = String(address || "").trim() || null;
    if (commissionRate !== undefined) {
      const rateNum = Number(commissionRate);
      if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
        return res.status(400).json({ error: "commissionRate ต้องเป็นตัวเลข 0–100" });
      }
      data.commissionRate = rateNum;
    }

    const updated = await prisma.branch.update({ where: { id }, data });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

export default router;
