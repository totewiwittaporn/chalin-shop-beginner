// backend/src/controllers/stockcount/stockCountController.js
import prisma from "#app/lib/prisma.js";
import { Prisma } from "@prisma/client";

// helper
function toInt(v){ const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; }
const LEDGER_IN  = "STOCK_COUNT_ADJUST_IN";
const LEDGER_OUT = "STOCK_COUNT_ADJUST_OUT";

/**
 * POST /api/stock-counts
 * body: { scope: "BRANCH"|"CONSIGNMENT", branchId?, consignmentPartnerId? }
 */
export async function create(req, res) {
  try {
    const { scope, branchId, consignmentPartnerId } = req.body || {};
    if (!scope || !["BRANCH","CONSIGNMENT"].includes(scope)) {
      return res.status(400).json({ message: "invalid scope" });
    }
    const created = await prisma.stockCountSession.create({
      data: {
        scope,
        branchId: scope==="BRANCH" ? toInt(branchId) : null,
        consignmentPartnerId: scope==="CONSIGNMENT" ? toInt(consignmentPartnerId) : null,
        startedAt: new Date(),
        status: "OPEN",
      },
    });
    res.json(created);
  } catch (e) {
    console.error("[stock-count.create]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * POST /api/stock-counts/:id/lines
 * body: { lines: [{ productId, systemQty, countedQty }] }
 */
export async function upsertLines(req, res) {
  try {
    const id = toInt(req.params.id);
    const { lines = [] } = req.body || {};
    if (!id || !Array.isArray(lines)) return res.status(400).json({ message: "invalid payload" });

    await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const pid = toInt(l.productId); if (!pid) continue;
        const sys = Number(l.systemQty || 0);
        const cnt = Number(l.countedQty || 0);
        await tx.stockCountLine.upsert({
          where: { sessionId_productId: { sessionId: id, productId: pid } },
          create: { sessionId: id, productId: pid, systemQty: sys, countedQty: cnt },
          update: { systemQty: sys, countedQty: cnt },
        });
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error("[stock-count.upsertLines]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/stock-counts/system-qty?scope=&productId=&branchId=&consignmentPartnerId=
 * - คืนค่าจำนวนระบบสำหรับสินค้าหนึ่งในบริบทที่ระบุ
 */
export async function systemQty(req, res) {
  try {
    const { scope, productId, branchId, consignmentPartnerId } = req.query || {};
    const pid = toInt(productId);
    if (!scope || !pid) return res.status(400).json({ message: "invalid params" });

    if (scope === "BRANCH") {
      const inv = await prisma.inventory.findUnique({
        where: { branchId_productId: { branchId: toInt(branchId)||0, productId: pid } },
        select: { qty: true },
      });
      return res.json({ qty: Number(inv?.qty || 0) });
    }

    // CONSIGNMENT
    const cinv = await prisma.consignmentInventory.findUnique({
      where: { consignmentPartnerId_productId: { consignmentPartnerId: toInt(consignmentPartnerId)||0, productId: pid } },
      select: { qtyOnHand: true },
    });
    return res.json({ qty: Number(cinv?.qtyOnHand || 0) });
  } catch (e) {
    console.error("[stock-count.systemQty]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * POST /api/stock-counts/:id/finalize
 * - สรุปเซสชัน → ปรับยอดจริงเป็นยอดตั้งต้นใหม่ + บันทึก ledger แยกขาด/เกิน
 * - คืนสรุป delta สำหรับทำบัญชีต่อได้
 */
export async function finalize(req, res) {
  try {
    const id = toInt(req.params.id);
    if (!id) return res.status(400).json({ message: "invalid id" });

    const session = await prisma.stockCountSession.findUnique({
      where: { id },
    });
    if (!session) return res.status(404).json({ message: "session not found" });
    if (session.status === "CLOSED") return res.json(session);

    const lines = await prisma.stockCountLine.findMany({
      where: { sessionId: id },
      orderBy: { productId: "asc" },
    });

    // สร้าง Movement + ปรับยอดคงเหลือ
    const deltas = []; // { productId, delta, unitCost, amount }
    const movRows = [];

    await prisma.$transaction(async (tx) => {
      for (const l of lines) {
        const systemQty  = Number(l.systemQty || 0);
        const countedQty = Number(l.countedQty || 0);
        const delta = countedQty - systemQty;
        if (delta === 0) continue;

        // สำหรับมูลค่า ใช้ costPrice ล่าสุดของสินค้า (ถ้ามี)
        const p = await tx.product.findUnique({
          where: { id: l.productId },
          select: { costPrice: true },
        });
        const unitCost = Number(p?.costPrice || 0);
        const amount = unitCost * Math.abs(delta);

        deltas.push({
          productId: l.productId,
          delta,
          unitCost,
          amount,
        });

        if (session.scope === "BRANCH") {
          // ปรับ Inventory.qty → countedQty
          await tx.inventory.upsert({
            where: { branchId_productId: { branchId: session.branchId, productId: l.productId } },
            create: { branchId: session.branchId, productId: l.productId, qty: countedQty, reserved: 0 },
            update: { qty: countedQty },
          });

          // movement
          movRows.push({
            productId: l.productId,
            branchId: session.branchId,
            qty: delta, // + เพิ่ม, - ลด
            type: delta > 0 ? LEDGER_IN : LEDGER_OUT,
            refTable: "StockCountSession",
            refId: session.id,
            unitCost: new Prisma.Decimal(unitCost),
            note: "Stock count adjust (branch)",
          });
        } else {
          // CONSIGNMENT: ปรับ ConsignmentInventory.qtyOnHand
          await tx.consignmentInventory.upsert({
            where: {
              consignmentPartnerId_productId: {
                consignmentPartnerId: session.consignmentPartnerId,
                productId: l.productId,
              },
            },
            create: {
              consignmentPartnerId: session.consignmentPartnerId,
              productId: l.productId,
              qtyOnHand: countedQty,
              price: new Prisma.Decimal(unitCost || 0),
            },
            update: { qtyOnHand: countedQty },
          });

          // movement (อ้าง branchId เป็น null, หรือใช้ branch consign ถ้าคุณมี mapping)
          movRows.push({
            productId: l.productId,
            branchId: null, // ถ้ามี branch เฉพาะของ consignment ให้ใส่ตรงนี้
            qty: delta,
            type: delta > 0 ? LEDGER_IN : LEDGER_OUT,
            refTable: "StockCountSession",
            refId: session.id,
            unitCost: new Prisma.Decimal(unitCost),
            note: "Stock count adjust (consignment)",
          });
        }
      }

      if (movRows.length) {
        await tx.stockLedger.createMany({ data: movRows });
      }

      await tx.stockCountSession.update({
        where: { id: session.id },
        data: {
          finalizedAt: new Date(),
          status: "CLOSED",
          // เก็บผลสรุปไว้ที่ session (ถ้าคุณมี field summary/diffJson ใน prisma)
          // diffJson: JSON.stringify(deltas),
        },
      });
    });

    res.json({
      ...session,
      finalizedAt: new Date(),
      status: "CLOSED",
      deltas, // ส่งกลับไปให้หน้าแอปใช้ทำบัญชีต่อ
      usedLedgerTypes: { positive: LEDGER_IN, negative: LEDGER_OUT },
    });
  } catch (e) {
    console.error("[stock-count.finalize]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/stock-counts
 * (ถ้าหน้า list ต้องใช้)
 */
export async function list(req, res) {
  try {
    const rows = await prisma.stockCountSession.findMany({
      orderBy: { id: "desc" },
      take: 100,
    });
    res.json(rows);
  } catch (e) {
    console.error("[stock-count.list]", e);
    res.status(500).json({ message: "server error" });
  }
}

/**
 * GET /api/stock-counts/:id
 */
export async function get(req, res) {
  try {
    const id = toInt(req.params.id);
    const session = await prisma.stockCountSession.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!session) return res.status(404).json({ message: "not found" });
    res.json(session);
  } catch (e) {
    console.error("[stock-count.get]", e);
    res.status(500).json({ message: "server error" });
  }
}
