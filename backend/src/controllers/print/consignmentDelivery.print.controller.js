// backend/src/controllers/print/consignmentDelivery.print.controller.js
import prisma from "#app/lib/prisma.js";
import { renderCAT_ONLY } from "#app/renderers/consignmentDelivery/CAT_ONLY.js";
import { renderCODE_AND_CAT } from "#app/renderers/consignmentDelivery/CODE_AND_CAT.js";

const TEMPLATE = {
  CAT_ONLY: renderCAT_ONLY,
  CODE_AND_CAT: renderCODE_AND_CAT,
};

export async function print(req, res) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).send("invalid id");

  const d = await prisma.consignmentDelivery.findUnique({
    where: { id },
    include: {
      toPartner: true,
      lines: true,
    },
  });
  if (!d) return res.status(404).send("not found");

  const doc = {
    id: d.id,
    docNo: d.code || `CDN-${d.id}`,
    docDate: d.date,
    partner: d.toPartner || null,
    lines: d.lines,
  };

  const template = d.toPartner?.deliveryDocTemplate || "CAT_ONLY";
  const render = TEMPLATE[template] || renderCAT_ONLY;

  const html = render(doc);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
}
