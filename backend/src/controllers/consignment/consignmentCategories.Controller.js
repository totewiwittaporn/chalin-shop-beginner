// backend/src/controllers/consignment/consignmentCategories.Controller.js
import prisma from "#app/lib/prisma.js";

/**
 * GET /api/consignment/partners/:partnerId/categories
 * Query: q (optional), page=1, pageSize=50
 */
export async function listCategoriesOfPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    if (!Number.isFinite(partnerId)) {
      return res.status(400).json({ error: "partnerId is required" });
    }

    const q = (req.query.q || "").toString().trim();
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(req.query.pageSize) || 50));
    const skip = (page - 1) * pageSize;

    const where = {
      partnerId,
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.consignmentCategory.findMany({
        where,
        orderBy: [{ id: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.consignmentCategory.count({ where }),
    ]);

    // เติมจำนวนสินค้าในแต่ละหมวด (ไม่ใช้ groupBy เพื่อลดความเสี่ยงเวอร์ชัน)
    const withCounts = await Promise.all(
      items.map(async (cat) => {
        let productCount = 0;
        try {
          productCount = await prisma.consignmentCategoryProduct.count({
            where: { categoryId: cat.id },
          });
        } catch {
          productCount = 0;
        }
        return { ...cat, productCount };
      })
    );

    res.json({ page, pageSize, total, items: withCounts });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/consignment/partners/:partnerId/categories
 * body: { code, name, isActive? }
 * หมายเหตุ: ป้องกันซ้ำ (partnerId, code) และ normalize code เป็น UPPERCASE
 */
export async function createCategoryForPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    let { code, name, isActive } = req.body || {};

    if (!partnerId) return res.status(400).json({ error: "partnerId is required" });
    if (!code || !name) return res.status(400).json({ error: "code and name are required" });

    // normalize
    code = String(code).trim().toUpperCase();
    name = String(name).trim();

    // pre-check ซ้ำแบบ case-insensitive
    const existed = await prisma.consignmentCategory.findFirst({
      where: {
        partnerId,
        code: { equals: code, mode: "insensitive" },
      },
      select: { id: true, code: true, name: true },
    });
    if (existed) {
      return res.status(409).json({
        error: "DUPLICATE_CODE",
        message: `รหัสหมวด "${existed.code}" ถูกใช้แล้วในร้านนี้`,
      });
    }

    try {
      const cat = await prisma.consignmentCategory.create({
        data: {
          partnerId,
          code,
          name,
          isActive: typeof isActive === "boolean" ? isActive : true,
        },
      });
      return res.status(201).json(cat);
    } catch (err) {
      // กันกรณี race condition
      if (err?.code === "P2002") {
        return res.status(409).json({
          error: "DUPLICATE_CODE",
          message: `รหัสหมวด "${code}" ถูกใช้แล้วในร้านนี้`,
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/consignment/partners/:partnerId/categories/:categoryId
 * body: { code?, name?, isActive? }
 * ป้องกันซ้ำเมื่อแก้ไข code (ภายในร้านเดียวกัน)
 */
export async function updateCategoryOfPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    const categoryId = Number(req.params.categoryId);
    let { code, name, isActive } = req.body || {};

    if (!partnerId || !categoryId) {
      return res.status(400).json({ error: "partnerId and categoryId are required" });
    }

    const found = await prisma.consignmentCategory.findFirst({
      where: { id: categoryId, partnerId },
      select: { id: true, code: true },
    });
    if (!found) {
      return res.status(404).json({ error: "Category not found for this partner" });
    }

    // ถ้าจะเปลี่ยน code → normalize แล้วเช็กซ้ำ
    let nextCode;
    if (code != null) {
      nextCode = String(code).trim().toUpperCase();
      if (nextCode !== found.code) {
        const dup = await prisma.consignmentCategory.findFirst({
          where: {
            partnerId,
            code: { equals: nextCode, mode: "insensitive" },
            NOT: { id: categoryId },
          },
          select: { id: true },
        });
        if (dup) {
          return res.status(409).json({
            error: "DUPLICATE_CODE",
            message: `รหัสหมวด "${nextCode}" ถูกใช้แล้วในร้านนี้`,
          });
        }
      }
    }

    try {
      const updated = await prisma.consignmentCategory.update({
        where: { id: categoryId },
        data: {
          ...(nextCode != null ? { code: nextCode } : {}),
          ...(name != null ? { name: String(name).trim() } : {}),
          ...(typeof isActive === "boolean" ? { isActive } : {}),
        },
      });
      return res.json(updated);
    } catch (err) {
      if (err?.code === "P2002") {
        return res.status(409).json({
          error: "DUPLICATE_CODE",
          message: `รหัสหมวด "${nextCode}" ถูกใช้แล้วในร้านนี้`,
        });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
