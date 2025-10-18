import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import BarcodeImage from '@/components/ui/BarcodeImage';

/**
 * CartTable (Step 1)
 * - โฟกัส: เพิ่ม/แก้ qty, ส่วนลดบรรทัด, ลบรายการ, แถวเพิ่มเร็ว
 * - ADMIN: แก้ unitPrice ได้, STAFF: แก้ไม่ได้
 */
export default function CartTable({
  role,
  canEditPrice = false,
  cart = [],
  onChangeQty,
  onChangePrice,
  onChangeLineDiscount,
  onRemove,
  onQuickAdd,
}) {
  function money(n) {
    return (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return (
    <Table>
      <Table.Head>
        <tr>
          <Table.Th className="w-10">#</Table.Th>
          <Table.Th>สินค้า</Table.Th>
          <Table.Th className="w-36">SKU</Table.Th>
          <Table.Th className="w-28 text-right">ราคา/หน่วย</Table.Th>
          <Table.Th className="w-28 text-right">จำนวน</Table.Th>
          <Table.Th className="w-32 text-right">ส่วนลด/บรรทัด</Table.Th>
          <Table.Th className="w-28 text-right">รวม</Table.Th>
          <Table.Th className="w-12"></Table.Th>
        </tr>
      </Table.Head>
      <Table.Body>
        {cart.length === 0 ? (
          <tr>
            <Table.Td colSpan={8} className="text-center text-slate-500 py-8">
              ยังไม่มีสินค้าในตะกร้า — ลองสแกนหรือค้นหาเพื่อเพิ่ม
            </Table.Td>
          </tr>
        ) : (
          cart.map((it, idx) => {
            const lineTotal = it.unitPrice * it.qty - (it.lineDiscount || 0);
            return (
              <tr key={it.lineId} className="border-b last:border-0">
                <Table.Td>{idx + 1}</Table.Td>
                <Table.Td>
                  <div>
                    <div className="font-medium leading-tight">{it.name}</div>
                    <div className="mt-1">
                      <BarcodeImage value={it.sku || '-'} height={30} width={1.4} />
                    </div>
                  </div>
                </Table.Td>
                <Table.Td className="text-sm text-slate-600">{it.sku}</Table.Td>
                <Table.Td className="text-right">
                  {canEditPrice ? (
                    <input
                      className="w-full text-right border rounded-lg px-2 py-1"
                      value={it.unitPrice}
                      onChange={(e) => onChangePrice?.(it.lineId, e.target.value)}
                    />
                  ) : (
                    <span>{money(it.unitPrice)}</span>
                  )}
                </Table.Td>
                <Table.Td className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      kind="white"
                      size="sm"
                      onClick={() => onChangeQty?.(it.lineId, Math.max(0, it.qty - 1))}
                    >
                      -
                    </Button>
                    <input
                      className="w-16 text-right border rounded-lg px-2 py-1"
                      value={it.qty}
                      onChange={(e) => onChangeQty?.(it.lineId, e.target.value)}
                    />
                    <Button
                      kind="white"
                      size="sm"
                      onClick={() => onChangeQty?.(it.lineId, it.qty + 1)}
                    >
                      +
                    </Button>
                  </div>
                </Table.Td>
                <Table.Td className="text-right">
                  <input
                    className="w-full text-right border rounded-lg px-2 py-1"
                    value={it.lineDiscount || 0}
                    onChange={(e) => onChangeLineDiscount?.(it.lineId, e.target.value)}
                  />
                </Table.Td>
                <Table.Td className="text-right font-medium">{money(lineTotal)}</Table.Td>
                <Table.Td className="text-right">
                  <Button kind="danger" size="sm" onClick={() => onRemove?.(it.lineId)}>
                    ลบ
                  </Button>
                </Table.Td>
              </tr>
            );
          })
        )}

        {/* แถวเพิ่มเร็ว */}
        <tr>
          <Table.Td colSpan={8}>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border rounded-lg px-3 py-2"
                placeholder="บรรทัดเพิ่มเร็ว: วางบาร์โค้ด / พิมพ์ SKU / ชื่อสินค้า แล้วกด Enter"
                onKeyDown={(e) => {
                  const v = e.currentTarget.value.trim();
                  if (e.key === 'Enter' && v) {
                    onQuickAdd?.(v);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <Button
                kind="primary"
                onClick={(e) => {
                  const inp = e.currentTarget.parentElement?.querySelector('input');
                  const v = inp?.value?.trim();
                  if (v) {
                    onQuickAdd?.(v);
                    inp.value = '';
                  }
                }}
              >
                เพิ่ม
              </Button>
            </div>
          </Table.Td>
        </tr>
      </Table.Body>
    </Table>
  );
}
