import prisma from "#app/lib/prisma.js";

function atStartOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

export async function getStaffSummary(req, res, next) {
  try {
    // วันนี้
    const todayStart = atStartOfDay();
    const tomorrowStart = addDays(todayStart, 1);

    // สัปดาห์นี้ (7 วันย้อนหลัง ไม่รวมพรุ่งนี้)
    const weekStart = addDays(todayStart, -6);

    // สัปดาห์ก่อนหน้า (ช่วงเปรียบเทียบ)
    const prevWeekStart = addDays(weekStart, -7);
    const prevWeekEnd = addDays(weekStart, 0); // ไม่รวมปลายช่วง

    // ยอดรวมเฉพาะบิล PAID
    const [aggToday, aggWeek, aggPrevWeek] = await Promise.all([
      prisma.sale.aggregate({ _sum: { total: true }, where: { status: "PAID", date: { gte: todayStart, lt: tomorrowStart } } }),
      prisma.sale.aggregate({ _sum: { total: true }, where: { status: "PAID", date: { gte: weekStart, lt: tomorrowStart } } }),
      prisma.sale.aggregate({ _sum: { total: true }, where: { status: "PAID", date: { gte: prevWeekStart, lt: prevWeekEnd } } }),
    ]);

    const today = Number(aggToday._sum.total ?? 0);
    const week  = Number(aggWeek._sum.total ?? 0);
    const prev  = Number(aggPrevWeek._sum.total ?? 0);
    const pct   = prev > 0 ? ((week - prev) / prev) * 100 : (week > 0 ? 100 : 0);

    // นิยาม tasksToday แบบเบาๆ: จำนวนบิล DRAFT ที่สร้างวันนี้
    const tasksToday = await prisma.sale.count({
      where: { status: "DRAFT", date: { gte: todayStart, lt: tomorrowStart } },
    });

    return res.json({ week, today, pct, tasksToday });
  } catch (e) {
    next(e);
  }
}
