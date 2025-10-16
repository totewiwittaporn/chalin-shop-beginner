import prisma from "#app/lib/prisma.js";

export async function listPartners(req, res, next) {
  try {
    const { q = "", page = 1, pageSize = 100 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, items] = await Promise.all([
      prisma.consignmentPartner.count({ where }),
      prisma.consignmentPartner.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip,
        take,
      }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    next(err);
  }
}

export async function createPartner(req, res, next) {
  try {
    const data = req.body ?? {};
    const created = await prisma.consignmentPartner.create({ data });
    res.json(created);
  } catch (err) {
    next(err);
  }
}

export async function updatePartner(req, res, next) {
  try {
    const partnerId = Number(req.params.partnerId);
    const data = req.body ?? {};
    const updated = await prisma.consignmentPartner.update({
      where: { id: partnerId },
      data,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
