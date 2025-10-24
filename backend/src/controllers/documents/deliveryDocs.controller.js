// #app/controllers/documents/deliveryDocs.controller.js
import prisma from "#app/lib/prisma.js";
import { generateDocNo } from "#app/services/docs/docNo.service.js";
import { mapBranchDeliveryToDocument, mapConsignmentDeliveryToDocument } from "#app/services/docs/mappers/delivery.mapper.js";

/**
 * GET /api/docs/delivery/:deliveryId
 * Find existing document created from a delivery (branch or consignment)
 */
export async function getByDeliveryId(req, res) {
  try {
    const deliveryId = Number(req.params.deliveryId);
    if (!deliveryId) return res.status(400).json({ error: "Invalid deliveryId" });

    const doc = await prisma.document.findFirst({
      where: {
        OR: [
          { branchDeliveryId: deliveryId },
          { consignmentDeliveryId: deliveryId },
        ],
      },
      select: { id: true, docNo: true, status: true, docType: true, kind: true },
    });

    return res.json({ documentId: doc?.id ?? null, docNo: doc?.docNo ?? null, status: doc?.status ?? null, docType: doc?.docType ?? null });
  } catch (err) {
    console.error("getByDeliveryId error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/docs/delivery/branch/:deliveryId/create
 */
export async function createFromBranchDelivery(req, res) {
  try {
    const deliveryId = Number(req.params.deliveryId);
    if (!deliveryId) return res.status(400).json({ error: "Invalid deliveryId" });

    // Load delivery with items
    const delivery = await prisma.branchDelivery.findUnique({
      where: { id: deliveryId },
      include: { items: { include: { product: true } } },
    });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    // Check if already created
    const existed = await prisma.document.findFirst({
      where: { branchDeliveryId: deliveryId, kind: "DELIVERY" },
      select: { id: true },
    });
    if (existed) return res.json({ id: existed.id, alreadyExists: true });

    const docNo = await generateDocNo({ docType: "DELIVERY_BRANCH" });
    const mapped = mapBranchDeliveryToDocument({ delivery, docNo, docType: "DELIVERY_BRANCH" });

    const created = await prisma.document.create({
      data: {
        ...mapped.document,
        items: { create: mapped.items },
      },
      include: { items: true },
    });

    return res.json(created);
  } catch (err) {
    console.error("createFromBranchDelivery error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * POST /api/docs/delivery/consignment/:deliveryId/create
 */
export async function createFromConsignmentDelivery(req, res) {
  try {
    const deliveryId = Number(req.params.deliveryId);
    if (!deliveryId) return res.status(400).json({ error: "Invalid deliveryId" });

    const delivery = await prisma.consignDelivery.findUnique({
      where: { id: deliveryId },
      include: { items: { include: { product: true } } },
    });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });

    const existed = await prisma.document.findFirst({
      where: { consignmentDeliveryId: deliveryId, kind: "DELIVERY" },
      select: { id: true },
    });
    if (existed) return res.json({ id: existed.id, alreadyExists: true });

    const docNo = await generateDocNo({ docType: "DELIVERY_CONSIGNMENT" });
    const mapped = mapConsignmentDeliveryToDocument({ delivery, docNo, docType: "DELIVERY_CONSIGNMENT" });

    const created = await prisma.document.create({
      data: {
        ...mapped.document,
        items: { create: mapped.items },
      },
      include: { items: true },
    });

    return res.json(created);
  } catch (err) {
    console.error("createFromConsignmentDelivery error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
