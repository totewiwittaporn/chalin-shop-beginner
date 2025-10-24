// #app/services/docs/docNo.service.js
import prisma from "#app/lib/prisma.js";

/**
 * Generate running doc number like DN-YYYYMM-0001
 * Scope: by docType (e.g., DELIVERY_BRANCH, DELIVERY_CONSIGNMENT) and by YYYYMM
 */
export async function generateDocNo({ docType }) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const ym = `${y}${m}`;

  // We keep counters in Document table by querying highest of current month/type
  const prefix = `DN-${ym}-`;

  const last = await prisma.document.findFirst({
    where: { docType, docNo: { startsWith: prefix } },
    orderBy: { docNo: "desc" },
    select: { docNo: true },
  });

  let nextNum = 1;
  if (last?.docNo) {
    const seg = last.docNo.split("-").pop();
    const lastNum = Number(seg);
    if (!Number.isNaN(lastNum)) nextNum = lastNum + 1;
  }
  const docNo = `${prefix}${String(nextNum).padStart(4, "0")}`;
  return docNo;
}
