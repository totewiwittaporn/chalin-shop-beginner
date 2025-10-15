import prisma from "#app/lib/prisma.js";
import { getMainBranchId } from "#app/lib/mainBranch.js";

/**
 * GET /api/branches/options
 * ADMIN: คืนทุกสาขา
 * STAFF: คืนเฉพาะ [สาขาของฉัน, สาขา Main] (กันซ้ำ)
 */
export async function branchOptions(req, res, next) {
  try {
    const { role, branchId } = req.user || {};
    if (role === "ADMIN") {
      const rows = await prisma.branch.findMany({
        select: { id: true, code: true, name: true },
        orderBy: [{ code: "asc" }],
      });
      return res.json(rows);
    }

    // STAFF
    const mainId = await getMainBranchId();
    const ids = Array.from(new Set([Number(branchId), Number(mainId)].filter(Boolean)));
    const rows = await prisma.branch.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true },
      orderBy: [{ code: "asc" }],
    });
    return res.json(rows);
  } catch (e) { next(e); }
}
