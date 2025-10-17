import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import * as Table from "@/components/ui/Table.jsx";
import GlassModal from "@/components/theme/GlassModal";
import { useMemo } from "react";

function fmt(n) {
  if (n == null) return "-";
  const num = typeof n === "string" ? Number(n) : n;
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * ReceiveDeliveryModal
 * props:
 *  - open: boolean
 *  - onClose: () => void
 *  - doc: { id, docNo, issuerId, recipientId } | null
 *  - lines: [{ id, name, barcode, qtyDoc, qtyReceived }]
 *  - onChangeLineQty: (lineId:number, qty:number) => void
 *  - onConfirm: () => void   // กด "ยืนยันรับสินค้า"
 */
export default function ReceiveDeliveryModal({
  open,
  onClose,
  doc,
  lines = [],
  onChangeLineQty,
  onConfirm,
}) {
  const allMatch = useMemo(
    () => lines.every(l => Number(l.qtyReceived) === Number(l.qtyDoc)),
    [lines]
  );
  const someDiff = useMemo(
    () => lines.some(l => Number(l.qtyReceived) !== Number(l.qtyDoc)),
    [lines]
  );

  return (
    <GlassModal
      open={open}
      onClose={onClose}
      title={doc ? `ยืนยันการรับสินค้า ${doc.docNo || `#${doc.id}`}` : "ยืนยันการรับสินค้า"}
      subtitle={doc ? `จาก: BRANCH #${doc.issuerId} → ไป: BRANCH #${doc.recipientId}` : ""}
      footer={
        <div className="flex gap-2 justify-end">
          <Button kind="white" onClick={onClose}>ยกเลิก</Button>
          <Button kind="success" onClick={onConfirm}>ยืนยันรับสินค้า</Button>
        </div>
      }
    >
      {!doc ? (
        <div className="py-8 text-center">กำลังโหลด...</div>
      ) : (
        <div className="space-y-4">
          <div className={`text-sm ${allMatch ? "text-emerald-600" : "text-amber-600"}`}>
            {allMatch
              ? "จำนวนรับจริงตรงกับเอกสารทุกบรรทัด"
              : "มีรายการที่จำนวนรับจริงไม่ตรงกับเอกสาร — โปรดยืนยันอีกครั้งก่อนดำเนินการ"}
          </div>
          <div className="max-h-[50vh] overflow-auto rounded-xl border bg-white">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th className="w-16 text-center">#</Table.Th>
                  <Table.Th>สินค้า</Table.Th>
                  <Table.Th className="hidden sm:table-cell">บาร์โค้ด</Table.Th>
                  <Table.Th className="text-right">ตามเอกสาร</Table.Th>
                  <Table.Th className="text-right">รับจริง</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body>
                {lines.map((l, idx) => {
                  const diff = Number(l.qtyReceived) !== Number(l.qtyDoc);
                  return (
                    <Table.Tr key={l.id}>
                      <Table.Td className="text-center">{idx + 1}</Table.Td>
                      <Table.Td>{l.name}</Table.Td>
                      <Table.Td className="hidden sm:table-cell">{l.barcode}</Table.Td>
                      <Table.Td className="text-right">{fmt(l.qtyDoc)}</Table.Td>
                      <Table.Td className={`text-right ${diff ? "text-amber-600 font-medium" : ""}`}>
                        <Input
                          type="number"
                          min="0"
                          value={l.qtyReceived}
                          onChange={(e) => onChangeLineQty(l.id, Number(e.target.value || 0))}
                          className="w-24 text-right"
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
