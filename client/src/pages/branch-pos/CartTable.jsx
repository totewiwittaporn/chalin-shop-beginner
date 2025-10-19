// client/src/pages/branch-pos/CartTable.jsx
import React from "react";
import Table from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

function money(n) {
  return (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export default function CartTable({
  role,
  canEditPrice,
  cart,
  onChangeQty,
  onChangePrice,
  onChangeLineDiscount,
  onRemove,
}) {
  const hasItems = cart && cart.length > 0;

  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Head>
          <Table.Tr>
            <Table.Th className="w-10">#</Table.Th>
            <Table.Th>สินค้า</Table.Th>
            <Table.Th>SKU</Table.Th>
            <Table.Th className="w-28 text-right">ราคา/หน่วย</Table.Th>
            <Table.Th className="w-24 text-right">จำนวน</Table.Th>
            <Table.Th className="w-28 text-right">ส่วนลด/บรรทัด</Table.Th>
            <Table.Th className="w-28 text-right">รวม</Table.Th>
            <Table.Th className="w-16 text-right">ลบ</Table.Th>
          </Table.Tr>
        </Table.Head>

        <Table.Body>
          {!hasItems ? (
            <Table.Tr>
              <Table.Td colSpan={8} className="py-10 text-center text-slate-500">
                ยังไม่มีสินค้าในตะกร้า — ใช้แถบค้นหาด้านบนเพื่อเพิ่ม
              </Table.Td>
            </Table.Tr>
          ) : (
            cart.map((row, idx) => {
              const lineTotal = row.unitPrice * row.qty - (row.lineDiscount || 0);
              return (
                <Table.Tr key={row.lineId}>
                  <Table.Td>{idx + 1}</Table.Td>
                  <Table.Td className="whitespace-pre-wrap">{row.name}</Table.Td>
                  <Table.Td>{row.sku || "-"}</Table.Td>
                  <Table.Td className="text-right">
                    {canEditPrice ? (
                      <Input
                        type="number"
                        value={row.unitPrice}
                        onChange={(e) => onChangePrice(row.lineId, e.target.value)}
                        className="w-24 text-right"
                      />
                    ) : (
                      money(row.unitPrice)
                    )}
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Input
                      type="number"
                      value={row.qty}
                      onChange={(e) => onChangeQty(row.lineId, e.target.value)}
                      className="w-20 text-right"
                    />
                  </Table.Td>
                  <Table.Td className="text-right">
                    <Input
                      type="number"
                      value={row.lineDiscount || 0}
                      onChange={(e) => onChangeLineDiscount(row.lineId, e.target.value)}
                      className="w-24 text-right"
                    />
                  </Table.Td>
                  <Table.Td className="text-right">{money(lineTotal)}</Table.Td>
                  <Table.Td className="text-right">
                    <Button kind="danger" size="sm" onClick={() => onRemove(row.lineId)}>
                      ลบ
                    </Button>
                  </Table.Td>
                </Table.Tr>
              );
            })
          )}
        </Table.Body>
      </Table>
    </div>
  );
}
