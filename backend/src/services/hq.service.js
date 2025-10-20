// backend/src/services/hq.service.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getHeadquartersOrThrow() {
  const hq = await prisma.headquarters.findFirst({ include: { stockBranch: true } });
  if (!hq) throw new Error("Headquarters is not configured");
  if (!hq.stockBranchId) throw new Error("Headquarters.stockBranchId is not set");
  return hq;
}

export async function getHeadquartersDisplayNameForPartner(partnerId) {
  const hq = await prisma.headquarters.findFirst();
  if (!hq) return null;
  const alias = await prisma.headquartersAlias.findFirst({
    where: { headquartersId: hq.id, partnerId: Number(partnerId) }
  });
  return alias?.displayName || hq.name;
}
