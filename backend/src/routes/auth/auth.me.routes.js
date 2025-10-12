// backend/src/routes/auth.me.routes.js
import { Router } from "express";
import { prisma } from "#app/lib/prisma.js";
import { requireAuth } from "#app/middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        partnerId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) return res.status(401).json({ error: "Unauthorized" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
