// backend/src/controllers/suppliers/suppliersController.js
import prisma from "#app/lib/prisma.js";

export async function list(req, res) {
  try {
    const { q = "" } = req.query || {};
    const where = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const rows = await prisma.supplier.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
    res.json(rows);
  } catch (e) {
    console.error("[suppliers.list]", e);
    res.status(500).json({ message: "server error" });
  }
}

export async function create(req, res) {
  try {
    const { name, contactName, phone, email, taxId, address } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ message: "name is required" });
    const created = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        taxId: taxId || null,
        address: address || null,
        isActive: true,
      },
    });
    res.json(created);
  } catch (e) {
    console.error("[suppliers.create]", e);
    res.status(500).json({ message: "server error" });
  }
}

export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, contactName, phone, email, taxId, address, isActive } = req.body || {};
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name != null ? { name } : {}),
        ...(contactName != null ? { contactName } : {}),
        ...(phone != null ? { phone } : {}),
        ...(email != null ? { email } : {}),
        ...(taxId != null ? { taxId } : {}),
        ...(address != null ? { address } : {}),
        ...(isActive != null ? { isActive: !!isActive } : {}),
      },
    });
    res.json(updated);
  } catch (e) {
    console.error("[suppliers.update]", e);
    res.status(500).json({ message: "server error" });
  }
}

export async function toggle(req, res) {
  try {
    const id = Number(req.params.id);
    const { isActive } = req.body || {};
    const updated = await prisma.supplier.update({
      where: { id },
      data: { isActive: !!isActive },
    });
    res.json(updated);
  } catch (e) {
    console.error("[suppliers.toggle]", e);
    res.status(500).json({ message: "server error" });
  }
}

export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    await prisma.supplier.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    console.error("[suppliers.remove]", e);
    res.status(500).json({ message: "server error" });
  }
}
