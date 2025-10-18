import { prisma } from "#app/lib/prisma.js";

function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }
function todayISO() { return new Date().toISOString().slice(0, 10); }

export async function createOrPaySaleBranch(req, res) {
  try {
    const p = req.body || {};
    const header = p.header || {};
    const lines  = Array.isArray(p.lines) ? p.lines : [];
    const totals = p.totals || {};
    const pay    = p.payment || null;

    const branchId = Number(header.branchId ?? req.branchId);
    if (!branchId) return res.status(400).json({ message: "branchId is required" });
    if (!lines.length) return res.status(400).json({ message: "lines is required" });

    const subTotal   = num(totals.subTotal);
    const discount   = num(totals.discountBill);
    const grandTotal = num(totals.grandTotal);

    const normLines = lines.map((ln, idx) => ({
      lineNo: num(ln.no, idx + 1),
      productId: ln.productId ?? null,
      sku: ln.sku || null,
      name: ln.name || "",
      qty: num(ln.qty),
      price: num(ln.price),
      discount: num(ln.discount),
      amount: num(ln.amount),
    }));

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          branchId,
          docDate: new Date(header.docDate || todayISO()),
          note: header.note || null,
          status: pay ? "PAID" : "DRAFT",
          subtotal: subTotal,
          discount: discount,
          total: grandTotal,
          items: {
            create: normLines.map((ln) => ({
              productId: ln.productId,
              sku: ln.sku,
              name: ln.name,
              qty: ln.qty,
              unitPrice: ln.price,
              lineTotal: ln.amount,
            })),
          },
        },
        include: { items: true },
      });

      if (!pay) return created;

      await tx.payment.createMany({
        data: [{
          saleId: created.id,
          method: String(pay.method || "").toUpperCase(),
          amount: num(pay.receive) - num(pay.change),
          evidenceUrl: pay.evidenceUrl || null,
          ref: pay.ref || null,
        }],
      });

      for (const it of created.items) {
        const qty = Math.abs(num(it.qty));
        if (!qty) continue;
        await tx.inventory.upsert({
          where: { branchId_productId: { branchId: created.branchId, productId: it.productId } },
          create: { branchId: created.branchId, productId: it.productId, qty: -qty, reserved: 0 },
          update: { qty: { decrement: qty } },
        });
      }
      if (created.items.length) {
        await tx.stockLedger.createMany({
          data: created.items.map((it) => ({
            productId: it.productId,
            branchId: created.branchId,
            qty: -Math.abs(num(it.qty)),
            type: "SALE",
            refTable: "Sale",
            refId: created.id,
            unitCost: null,
          })),
        });
      }

      const finalSale = await tx.sale.update({
        where: { id: created.id },
        data: { status: "PAID" },
        include: { items: true, payments: true },
      });
      return finalSale;
    });

    res.status(pay ? 201 : 200).json({ id: sale.id, docNo: sale.code || sale.docNo || sale.id, sale });
  } catch (e) {
    console.error("createOrPaySaleBranch error:", e);
    res.status(500).json({ message: "Failed to create/pay sale (branch)", detail: String(e?.message || e) });
  }
}

export async function listSalesBranch(req, res) {
  try {
    const { q, page = 1, pageSize = 20, branchId } = req.query || {};
    const take = Math.min(100, Number(pageSize) || 20);
    const skip = Math.max(0, (Number(page) || 1) - 1) * take;

    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (q) {
      where.OR = [
        { code: { contains: q, mode: "insensitive" } },
        { docNo: { contains: q, mode: "insensitive" } },
        { note: { contains: q, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { id: "desc" },
        skip, take,
        select: {
          id: true, code: true, docNo: true, docDate: true,
          total: true, status: true, branchId: true,
          paymentMethod: true, customerName: true,
        },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ rows, total, page: Number(page), pageSize: take });
  } catch (e) {
    console.error("listSalesBranch error:", e);
    res.status(500).json({ message: "Failed to list sales (branch)" });
  }
}

export async function printSaleBranch(req, res) {
  try {
    const id = Number(req.params.id);
    const size = String(req.query.size || "a4").toLowerCase();
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: { orderBy: { id: "asc" } } },
    });
    if (!sale) return res.status(404).send("NOT_FOUND");

    const css = `
      body{font-family: ui-sans-serif, system-ui; padding:16px;}
      table{border-collapse: collapse; width: 100%;}
      th,td{border:1px solid #e5e7eb; padding:6px 8px; font-size:12px;}
      thead{background:#f8fafc;}
      .right{text-align:right}
      h1{font-size:18px;margin-bottom:8px;}
    `;
    const rows = (sale.items || [])
      .map((it, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${it.name || ""}</td>
          <td class="right">${num(it.qty).toLocaleString()}</td>
          <td class="right">${num(it.unitPrice).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
          <td class="right">${num(it.lineTotal).toLocaleString(undefined,{minimumFractionDigits:2})}</td>
        </tr>
      `).join("");

    const title = size === "58" ? "ใบเสร็จ (ย่อ 58mm)" : "ใบเสร็จ (A4)";
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(`
      <!doctype html><html><head><meta charset="utf-8"/>
      <title>${sale.code || sale.docNo || sale.id}</title>
      <style>@page{margin:${size==="58"?"6mm":"12mm"}}${css}</style>
      </head><body>
        <h1>${title}</h1>
        <div>เลขที่: ${sale.code || sale.docNo || sale.id}</div>
        <div>วันที่: ${(sale.docDate instanceof Date ? sale.docDate : new Date(sale.docDate)).toISOString().slice(0,10)}</div>
        <hr style="margin:10px 0"/>
        <table>
          <thead><tr><th>#</th><th>สินค้า</th><th class="right">Qty</th><th class="right">ราคา</th><th class="right">รวม</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:10px; text-align:right">
          <b>ยอดสุทธิ: ${num(sale.total).toLocaleString(undefined,{minimumFractionDigits:2})}</b>
        </div>
        <script>window.onload = () => window.print && window.print();</script>
      </body></html>
    `);
  } catch (e) {
    console.error("printSaleBranch error:", e);
    res.status(500).send("PRINT_FAILED");
  }
}
