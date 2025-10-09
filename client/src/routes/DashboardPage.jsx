// client/src/routes/DashboardPage.jsx
import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';

const startOfToday = () => dayjs().startOf('day');
const startOfWeek = () => dayjs().startOf('week');   // ปรับเป็นจันทร์ถ้าต้องการ locale
const startOfMonth = () => dayjs().startOf('month');

function asList(x) {
  return Array.isArray(x) ? x : [];
}

// รวมยอดแบบกันล้ม รองรับทั้ง branchSales.amount และ consignmentSales.totals.net
function sumAmount(docs, predicate = () => true) {
  return asList(docs)
    .filter(predicate)
    .reduce((acc, d) => {
      const net = Number(d?.totals?.net ?? 0);
      const amt = Number(d?.amount ?? 0);
      return acc + (net > 0 ? net : amt);
    }, 0);
}

export default function DashboardPage() {
  // ดึง state โดยให้ default เป็น [] เสมอ ป้องกัน undefined
  const {
    branchSales = [],
    consignmentSales = [],
    branchDeliveries = [],
    consignmentDeliveries = [],
    centralStock = {},
    branchStock = {},
    consignmentStock = {},
  } = useDataStore();

  // แปลงวันที่เอกสาร → dayjs อย่างปลอดภัย
  const toDay = (d) => (d?.date ? dayjs(d.date) : null);

  const today = startOfToday();
  const thisWeek = startOfWeek();
  const thisMonth = startOfMonth();

  // ตัวช่วยเช็คช่วงเวลา
  const isToday = (d) => {
    const x = toDay(d);
    return x ? x.isSame(today, 'day') : false;
  };
  const isThisWeek = (d) => {
    const x = toDay(d);
    return x ? x.isAfter(thisWeek) || x.isSame(thisWeek, 'day') : false;
  };
  const isThisMonth = (d) => {
    const x = toDay(d);
    return x ? x.isSame(thisMonth, 'month') : false;
  };

  // ยอดขายรวม (branch + consignment)
  const kpis = useMemo(() => {
    const salesAll = [...asList(branchSales), ...asList(consignmentSales)];

    const salesToday = sumAmount(salesAll, isToday);
    const salesWeek = sumAmount(salesAll, isThisWeek);
    const salesMonth = sumAmount(salesAll, isThisMonth);

    // เอกสารส่งของ (ไม่เอามาคิดเงิน แต่ไว้โชว์ activity)
    const deliveriesToday =
      asList(branchDeliveries).filter(isToday).length +
      asList(consignmentDeliveries).filter(isToday).length;

    // นับสต็อกรวมคร่าวๆ
    const sumDict = (obj) =>
      Object.values(obj || {}).reduce((acc, m) => {
        if (typeof m === 'object' && m) {
          return (
            acc +
            Object.values(m).reduce((a, v) => a + Number(v || 0), 0)
          );
        }
        return acc;
      }, 0);
    const centralQty = Object.values(centralStock || {}).reduce(
      (a, v) => a + Number(v || 0),
      0
    );
    const branchQty = sumDict(branchStock);
    const consignQty = sumDict(consignmentStock);

    return {
      salesToday,
      salesWeek,
      salesMonth,
      deliveriesToday,
      stockAll: centralQty + branchQty + consignQty,
      stockCentral: centralQty,
      stockBranch: branchQty,
      stockConsign: consignQty,
    };
  }, [
    branchSales,
    consignmentSales,
    branchDeliveries,
    consignmentDeliveries,
    centralStock,
    branchStock,
    consignmentStock,
  ]);

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm opacity-70">ยอดขายวันนี้</div>
          <div className="text-2xl font-semibold">
            {kpis.salesToday.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm opacity-70">ยอดขายสัปดาห์นี้</div>
          <div className="text-2xl font-semibold">
            {kpis.salesWeek.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm opacity-70">ยอดขายเดือนนี้</div>
          <div className="text-2xl font-semibold">
            {kpis.salesMonth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm opacity-70">ใบส่งของ (วันนี้)</div>
          <div className="text-2xl font-semibold">{kpis.deliveriesToday}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm opacity-70">สต็อกรวม</div>
          <div className="text-2xl font-semibold">{kpis.stockAll}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm opacity-70">คลังกลาง</div>
          <div className="text-2xl font-semibold">{kpis.stockCentral}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm opacity-70">สต็อกฝากขาย</div>
          <div className="text-2xl font-semibold">{kpis.stockConsign}</div>
        </Card>
      </div>
    </div>
  );
}
