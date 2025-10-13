
// backend/src/controllers/stockcount/stockCountController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const toInt = (v, d=0)=> { const n = parseInt(v,10); return Number.isFinite(n)? n : d; };

export async function create(req, res){
  try{
    const { scope, branchId, consignmentPartnerId } = req.body;
    if (!scope || (scope === "BRANCH" && !branchId) || (scope === "CONSIGNMENT" && !consignmentPartnerId)) {
      return res.status(400).json({ message: "invalid payload" });
    }
    const data = {
      scope,
      branchId: scope==="BRANCH" ? toInt(branchId) : null,
      consignmentPartnerId: scope==="CONSIGNMENT" ? toInt(consignmentPartnerId) : null,
      startedAt: new Date(),
      status: "OPEN",
    };
    const row = await prisma.stockCount.create({ data });
    res.json(row);
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}

export async function upsertLines(req, res){
  try{
    const id = toInt(req.params.id);
    const { lines = [] } = req.body;
    const sc = await prisma.stockCount.findUnique({ where: { id } });
    if (!sc) return res.status(404).json({ message: "not found" });
    if (sc.status !== "OPEN") return res.status(400).json({ message: "already finalized" });

    await prisma.$transaction(async (tx)=>{
      for (const l of lines){
        const sys = Number(l.systemQty||0);
        const cnt = Number(l.countedQty||0);
        const delta = cnt - sys;
        const existing = await tx.stockCountLine.findFirst({ where: { stockCountId: id, productId: toInt(l.productId) } });
        if (existing){
          await tx.stockCountLine.update({
            where: { id: existing.id },
            data: { systemQty: sys, countedQty: cnt, delta }
          });
        }else{
          await tx.stockCountLine.create({
            data: {
              stockCountId: id,
              productId: toInt(l.productId),
              systemQty: sys,
              countedQty: cnt,
              delta,
            }
          });
        }
      }
    });

    const items = await prisma.stockCountLine.findMany({ where: { stockCountId: id }, orderBy: { id: "desc" } });
    res.json({ items });
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}

export async function finalize(req, res){
  try{
    const id = toInt(req.params.id);
    const sc = await prisma.stockCount.findUnique({ where: { id }, include: { lines: true } });
    if (!sc) return res.status(404).json({ message: "not found" });
    if (sc.status !== "OPEN") return res.json(sc);

    const updated = await prisma.stockCount.update({
      where: { id },
      data: { status: "FINALIZED", finalizedAt: new Date() },
      include: { lines: true },
    });

    res.json(updated);
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}

export async function list(req, res){
  try{
    const { scope, branchId, consignmentPartnerId, status } = req.query;
    const where = {
      scope: scope || undefined,
      status: status || undefined,
      branchId: branchId ? toInt(branchId) : undefined,
      consignmentPartnerId: consignmentPartnerId ? toInt(consignmentPartnerId) : undefined,
    };
    const items = await prisma.stockCount.findMany({
      where,
      orderBy: { id: "desc" },
      take: 100,
    });
    res.json({ items });
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}

export async function get(req, res){
  try{
    const id = toInt(req.params.id);
    const sc = await prisma.stockCount.findUnique({ where: { id }, include: { lines: true } });
    if (!sc) return res.status(404).json({ message: "not found" });
    res.json(sc);
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}

export async function systemQty(req, res){
  try{
    const { scope, productId, branchId, consignmentPartnerId } = req.query;
    if (!scope || !productId) return res.status(400).json({ message: "invalid params" });

    if (scope === "BRANCH"){
      if (!branchId) return res.status(400).json({ message: "branchId required" });
      const inv = await prisma.inventory.findUnique({
        where: { branchId_productId: { branchId: toInt(branchId), productId: toInt(productId) } },
      });
      return res.json({ qty: inv?.qty || 0 });
    } else {
      if (!consignmentPartnerId) return res.status(400).json({ message: "consignmentPartnerId required" });
      const inv = await prisma.consignmentInventory.findUnique({
        where: { consignmentPartnerId_productId: { consignmentPartnerId: toInt(consignmentPartnerId), productId: toInt(productId) } },
      });
      return res.json({ qty: inv?.qty || 0 });
    }
  }catch(e){
    console.error(e); res.status(500).json({ message: "server error" });
  }
}
