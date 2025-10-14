// backend/src/controllers/consignment/consignmentPartnersController.js
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// GET /api/consignment/partners?q=&status=&page=1&pageSize=500
export async function listConsignmentPartners(req, res) {
  try {
    const { q = "", status = "ACTIVE", page = 1, pageSize = 500 } = req.query;
    const where = {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ] }
        : {}),
    };
    const skip = (parseInt(page, 10) - 1) * parseInt(pageSize, 10);
    const take = parseInt(pageSize, 10);

    const [items, total] = await prisma.$transaction([
      prisma.consignmentPartner.findMany({
        where,
        orderBy: { id: "asc" },
        skip, take,
        select: { id: true, code: true, name: true, status: true },
      }),
      prisma.consignmentPartner.count({ where }),
    ]);

    res.json({ items, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}
