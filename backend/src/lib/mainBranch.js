import prisma from "#app/lib/prisma.js";

/**
 * คืน id ของสาขา Main
 * กลยุทธ์:
 * 1) มีฟิลด์ isMain ในตาราง Branch → ใช้ตัวที่ isMain = true
 * 2) ถ้าไม่มี ใช้ code ตรงกับ MAIN/HQ/CENTER ตัวใดตัวหนึ่ง
 */
export async function getMainBranchId() {
  // Plan A: isMain
  try {
    const b = await prisma.branch.findFirst({ where: { isMain: true }, select: { id: true } });
    if (b?.id) return b.id;
  } catch (_) { /* ถ้า schema ไม่มี isMain จะตกมาที่ Plan B */ }

  // Plan B: code fallback
  const b2 = await prisma.branch.findFirst({
    where: { code: { in: ["MAIN", "HQ", "CENTER"] } },
    select: { id: true },
  });
  if (!b2?.id) throw new Error("Main branch not found. Please set Branch.isMain=true or code=MAIN.");
  return b2.id;
}
