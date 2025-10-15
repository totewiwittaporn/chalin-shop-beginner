import prisma from "#app/lib/prisma.js";

// utils
const atStartOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };
function parseRange(range) {
  const now = new Date();
  if (!range) return { from: undefined, to: now };
  const m = String(range).match(/^(\d+)d$/i);
  if (!m) return { from: undefined, to: now };
  const days = parseInt(m[1], 10);
  const from = new Date(now);
  from.setDate(from.getDate() - days);
  return { from, to: now };
}

// GET /api/consignment/me/summary?range=30d&lt=10
export async function getMySummary(req, res, next) {
  try {
    const partnerId = req.user?.partnerId; // ต้องเป็นผู้ใช้ role CONSIGNMENT
    if (!partnerId) return res.status(400).json({ message: "No partnerId on user" });

    const { from, to } = parseRange(req.query.range);
    // รวมยอดจากเอกสารขายฝาก (DocKind.CONSALE) ของร้านนี้
    const whereBase = {
      kind: "CONSALE",
      docDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) },
      // ร้านฝากขายสามารถเป็นผู้ออกเอกสารหรือผู้รับเอกสารได้ ขึ้นกับ flow ของคุณ
      OR: [
        { issuerKind: "CONSIGNMENT", issuerId: partnerId },
        { recipientKind: "CONSIGNMENT", recipientId: partnerId },
      ],
      status: { not: "CANCELLED" },
    };

    // ช่วงเทียบย้อนหลังเท่ากัน
    const days = from ? Math.ceil((to - from) / (1000*60*60*24)) : 30;
    const prevTo = from || atStartOfDay();
    const prevFrom = addDays(prevTo, -days);

    const [currAgg, prevAgg, lowCount] = await Promise.all([
      prisma.document.aggregate({ _sum: { total: true }, where: whereBase }),
      prisma.document.aggregate({
        _sum: { total: true },
        where: {
          ...whereBase,
          docDate: { gte: prevFrom, lte: prevTo },
        },
      }),
      prisma.consignmentInventory.count({
        where: { partnerId, qtyOnHand: { lt: req.query.lt ? Number(req.query.lt) : 10 } },
      }),
    ]);

    const total = Number(currAgg._sum.total ?? 0);
    const prev = Number(prevAgg._sum.total ?? 0);
    const pct = prev > 0 ? ((total - prev) / prev) * 100 : (total > 0 ? 100 : 0);

    res.json({ total, pct, lowItems: lowCount });
  } catch (e) { next(e); }
}

// GET /api/consignment/me/documents?limit=5
export async function getMyDocuments(req, res, next) {
  try {
    const partnerId = req.user?.partnerId;
    if (!partnerId) return res.status(400).json({ message: "No partnerId on user" });
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 50);

    const docs = await prisma.document.findMany({
      where: {
        OR: [
          { issuerKind: "CONSIGNMENT", issuerId: partnerId },
          { recipientKind: "CONSIGNMENT", recipientId: partnerId },
        ],
        status: { not: "CANCELLED" },
      },
      include: { items: { select: { id: true } } },
      orderBy: { docDate: "desc" },
      take: limit,
    });
    res.json(docs);
  } catch (e) { next(e); }
}

// GET /api/consignment/me/returns?limit=5
export async function getMyReturns(req, res, next) {
  try {
    const partnerId = req.user?.partnerId;
    if (!partnerId) return res.status(400).json({ message: "No partnerId on user" });
    const limit = Math.min(parseInt(req.query.limit || "5", 10), 50);

    // นิยาม "ส่งคืน" ให้ใช้ DocType.DELIVERY_CONSIGNMENT (คุณตั้งไว้ใน enums)
    const rets = await prisma.document.findMany({
      where: {
        kind: "DELIVERY",
        OR: [
          { issuerKind: "CONSIGNMENT", issuerId: partnerId },
          { recipientKind: "CONSIGNMENT", recipientId: partnerId },
        ],
        status: { not: "CANCELLED" },
      },
      include: { items: { select: { qty: true } } },
      orderBy: { docDate: "desc" },
      take: limit,
    });

    // สร้างฟิลด์ total = ผลรวม qty ของแต่ละใบ (FE ต้องการเป็นจำนวน ไม่ใช่บาท)
    const mapped = rets.map(r => ({
      id: r.id,
      code: r.docNo,
      createdAt: r.docDate,
      total: (r.items || []).reduce((s, it) => s + Number(it.qty || 0), 0),
    }));

    res.json(mapped);
  } catch (e) { next(e); }
}
