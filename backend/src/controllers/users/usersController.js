// backend/src/controllers/users/usersController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/users
 * - ADMIN เท่านั้น (ควรถูกคั่นด้วย requireRole("ADMIN") ที่ชั้น routes)
 * - รองรับ ?excludeRole=ADMIN เพื่อซ่อนผู้ใช้ role ที่ระบุ (ค่าเริ่มต้น = ADMIN)
 * - คืนข้อมูล: id, name, email, role, branchId, partnerId, createdAt
 *   (ฝั่ง FE ไปแม็พชื่อสาขา/ฝากขายจาก API อื่นเพื่อลด coupling)
 */
export async function listUsers(req, res, next) {
  try {
    const excludeRole = String(req.query.excludeRole || "ADMIN").toUpperCase();

    const items = await prisma.user.findMany({
      where: excludeRole
        ? { role: { not: excludeRole } }
        : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        partnerId: true,
        createdAt: true,
      },
    });

    res.json({ items, total: items.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/:id
 * body: { name?, email?, role?, branchId?, partnerId? }
 * - อนุญาต ADMIN เท่านั้น
 * - กติกา: branchId และ partnerId ให้เลือกอย่างใดอย่างหนึ่ง (หรือทั้งคู่เป็น null ก็ได้)
 * - หมายเหตุ: ถ้าจะบังคับ logic ตาม role (เช่น STAFF ต้องมี branchId, CONSIGNMENT ต้องมี partnerId)
 *   สามารถเปิดตรวจสอบส่วน "role-aware" ที่คอมเมนต์ไว้ด้านล่าง
 */
export async function updateUser(req, res, next) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const { name, email, role, branchId, partnerId } = req.body || {};

    // สร้าง data ที่จะอัปเดตแบบยืดหยุ่น
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (email !== undefined) data.email = String(email).trim();
    if (role !== undefined) data.role = String(role).toUpperCase();

    // บังคับเลือกปลายทางอย่างใดอย่างหนึ่ง
    let bId = branchId === undefined ? undefined : (branchId === null ? null : Number(branchId));
    let pId = partnerId === undefined ? undefined : (partnerId === null ? null : Number(partnerId));

    if (bId !== undefined && isNaN(bId)) {
      return res.status(400).json({ error: "branchId ต้องเป็นตัวเลขหรือ null" });
    }
    if (pId !== undefined && isNaN(pId)) {
      return res.status(400).json({ error: "partnerId ต้องเป็นตัวเลขหรือ null" });
    }

    // ถ้าทั้งสองถูกส่งมาเป็นตัวเลขพร้อมกัน ให้ปฏิเสธ
    if (typeof bId === "number" && typeof pId === "number") {
      return res.status(400).json({ error: "กำหนดได้เพียงอย่างใดอย่างหนึ่ง: branchId หรือ partnerId" });
    }

    // ถ้าส่งมาอย่างใดอย่างหนึ่งชัดเจน ให้รีเซตอีกอันเป็น null
    if (typeof bId === "number") {
      data.branchId = bId;
      data.partnerId = null;
    } else if (typeof pId === "number") {
      data.partnerId = pId;
      data.branchId = null;
    } else {
      // กรณีตั้งใจเคลียร์ทั้งคู่
      if (bId === null) data.branchId = null;
      if (pId === null) data.partnerId = null;
    }

    // (ตัวเลือก) ตรวจตามบทบาท
    // if (data.role === "STAFF" && (data.branchId == null && bId === undefined)) {
    //   return res.status(400).json({ error: "STAFF ต้องเลือกสาขา (branchId)" });
    // }
    // if (data.role === "CONSIGNMENT" && (data.partnerId == null && pId === undefined)) {
    //   return res.status(400).json({ error: "CONSIGNMENT ต้องเลือกร้านฝากขาย (partnerId)" });
    // }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
        partnerId: true,
        createdAt: true,
      },
    });

    res.json(updated);
  } catch (err) {
    if (err?.code === "P2002") {
      // unique constraint เช่น email ซ้ำ
      return res.status(409).json({ error: "ข้อมูลซ้ำ (unique violation)", code: "P2002" });
    }
    next(err);
  }
}
