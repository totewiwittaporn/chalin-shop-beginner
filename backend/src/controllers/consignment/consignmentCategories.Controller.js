import prisma from "#app/lib/prisma.js";

/**
 * ตารางที่อ้างอิง (ให้ปรับชื่อให้ตรง schema จริงของคุณ):
 * - ConsignmentPartner
 * - ConsignmentCategory { id, partnerId, code, name, ... }
 * - ConsignmentCategoryProduct { categoryId, productId }
 */

export async function listCategoriesOfPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    const { q = "", page = 1, pageSize = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

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

    const [total, itemsRaw, counts] = await Promise.all([
      prisma.consignmentCategory.count({ where }),
      prisma.consignmentCategory.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip,
        take,
      }),
      prisma.consignmentCategoryProduct.groupBy({
        by: ["categoryId"],
        _count: { categoryId: true },
        where: { category: { partnerId } },
      }),
    ]);

    const countMap = new Map(counts.map(c => [c.categoryId, c._count.categoryId]));
    const items = itemsRaw.map((c) => ({
      ...c,
      itemCount: countMap.get(c.id) ?? 0,
    }));

    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
}

export async function createCategoryForPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    const { code, name } = req.body ?? {};
    const created = await prisma.consignmentCategory.create({
      data: { code, name, partnerId },
    });
    res.json(created);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryOfPartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    const categoryId = Number(req.params.categoryId);
    const { code, name } = req.body ?? {};

    const cat = await prisma.consignmentCategory.findUnique({ where: { id: categoryId } });
    if (!cat || cat.partnerId !== partnerId) {
      return res.status(404).json({ error: "Category not found for this partner" });
    }

    const updated = await prisma.consignmentCategory.update({
      where: { id: categoryId },
      data: { code, name },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
