// #app/services/docs/mappers/delivery.mapper.js
/**
 * Map BranchDelivery or ConsignmentDelivery to Document + DocumentItem inputs
 */

export function mapBranchDeliveryToDocument({ delivery, docNo, docType = "DELIVERY_BRANCH" }) {
  if (!delivery) throw new Error("delivery is required");

  const items = (delivery.items || []).map((it) => ({
    productId: it.productId ?? null,
    name: it.product?.name ?? it.name ?? "",
    sku: it.product?.sku ?? it.sku ?? null,
    qty: it.qty ?? it.quantity ?? 0,
    price: it.price ?? it.unitPrice ?? 0,
    amount: (it.qty ?? it.quantity ?? 0) * (it.price ?? it.unitPrice ?? 0),
  }));

  const total = items.reduce((s, x) => s + (x.amount || 0), 0);

  return {
    document: {
      kind: "DELIVERY",
      docType,
      docNo,
      issueDate: new Date(),
      status: "DRAFT",
      partyFromBranchId: delivery.fromBranchId ?? null,
      partyToBranchId: delivery.toBranchId ?? null,
      branchDeliveryId: delivery.id,
      subtotal: total,
      total: total,
    },
    items,
  };
}

export function mapConsignmentDeliveryToDocument({ delivery, docNo, docType = "DELIVERY_CONSIGNMENT" }) {
  if (!delivery) throw new Error("delivery is required");

  const items = (delivery.items || []).map((it) => ({
    productId: it.productId ?? null,
    name: it.product?.name ?? it.name ?? "",
    sku: it.product?.sku ?? it.sku ?? null,
    qty: it.qty ?? it.quantity ?? 0,
    price: it.price ?? it.unitPrice ?? 0,
    amount: (it.qty ?? it.quantity ?? 0) * (it.price ?? it.unitPrice ?? 0),
  }));

  const total = items.reduce((s, x) => s + (x.amount || 0), 0);

  return {
    document: {
      kind: "DELIVERY",
      docType,
      docNo,
      issueDate: new Date(),
      status: "DRAFT",
      partyFromBranchId: delivery.fromBranchId ?? null,
      partyToPartnerId: delivery.partnerId ?? null,
      consignmentDeliveryId: delivery.id,
      subtotal: total,
      total: total,
    },
    items,
  };
}
