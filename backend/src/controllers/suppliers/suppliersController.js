import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function list(req, res) {
  try {
    const { q } = req.query;
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const data = await prisma.supplier.findMany({
      where,
      orderBy: { id: "desc" },
    });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

export async function create(req, res) {
  try {
    const data = await prisma.supplier.create({ data: req.body });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const data = await prisma.supplier.update({ where: { id }, data: req.body });
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

export async function toggle(req, res) {
  try {
    const id = Number(req.params.id);
    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: req.body.isActive },
    });
    res.json(supplier);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.supplier.delete({ where: { id } });
    res.json({ message: "deleted" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "server error" });
  }
}
