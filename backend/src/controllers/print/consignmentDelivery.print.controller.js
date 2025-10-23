// backend/src/controllers/print/consignmentDelivery.print.controller.js
// เลือก renderer ตาม template ของร้าน แล้วคืน HTML สำหรับพิมพ์

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

  const doc = await prisma.consignDelivery.findUnique({
    where: { id },
    include: { partner: true, lines: true },
  });
  if (!doc) return res.status(404).send("not found");

  const template = doc?.partner?.deliveryDocTemplate || "CAT_ONLY";
  const render = TEMPLATE[template] || renderCAT_ONLY;

  const html = render(doc);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
}
