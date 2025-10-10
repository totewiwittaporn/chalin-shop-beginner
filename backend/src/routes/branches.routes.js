import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Roles } from "../utils/rbac.js";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

// GET /branches?search=...
router.get("/", async (req, res, next) => {
  try {
    const search = (req.query.search || "").toString();
    const list = await prisma.branch.findMany({
      where: search ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } }
        ]
      } : {},
      orderBy: [{ code: "asc" }]
    });
    res.json(list);
  } catch (e) { next(e); }
});

router.post("/", requireRole(Roles.ADMIN), async (req, res, next) => {
  try {
    const { code, name, address, commissionPercent } = req.body;
    const created = await prisma.branch.create({ data: { code, name, address, commissionPercent } });
    res.status(201).json(created);
  } catch (e) { next(e); }
});

router.put("/:id", requireRole(Roles.ADMIN), async (req, res, next) => {
  try {
    const { name, address, commissionPercent } = req.body;
    const updated = await prisma.branch.update({
      where: { id: Number(req.params.id) },
      data: { name, address, commissionPercent }
    });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
