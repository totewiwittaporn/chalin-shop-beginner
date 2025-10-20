import Button from "@/components/ui/Button";
import PosPrintDoc from "@/components/docs/pos/PosPrintDoc";

export default function PrintPreviewDrawer({
  open,
  onClose,
  printTemplate = "POS_RECEIPT_58",
  onChangeTemplate,
  docData,
  onNewBill,
}) {
  if (!open) return null;

  const safeDoc = docData
    ? { ...docData, header: { ...(docData.header || {}), docType: printTemplate } }
    : null;

  // ดึง HTML ของแหล่งที่ต้องการพิมพ์ (เราจะวางไว้ใน <div id="pos-print-html"> ด้านล่าง)
  function handlePrint() {
    if (!safeDoc) return;

    const source = document.getElementById("pos-print-html");
    if (!source) return;

    const htmlToPrint = source.innerHTML;

    // รวม <link rel="stylesheet"> และ <style> ทั้งหมดจาก <head>
    const headStyles = Array.from(
      document.querySelectorAll('head link[rel="stylesheet"], head style')
    )
      .map((el) => el.outerHTML)
      .join("\n");

    // เปิดหน้าต่างใหม่แล้วเขียน HTML ลงไป
    const printWin = window.open("", "_blank", "noopener,noreferrer");
    if (!printWin) return;

    printWin.document.open();
    printWin.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8"/>
    ${headStyles}
    <style>
      @page { margin: 0; }
      body { margin: 0; background: #fff; }
    </style>
  </head>
  <body>
    <div id="print-root">
      ${htmlToPrint}
    </div>
  </body>
</html>`);
    printWin.document.close();

    // รอ stylesheet โหลด จากนั้นค่อยพิมพ์
    const doPrint = () => {
      try {
        printWin.focus();
        printWin.print();
      } finally {
        // ปิดหน้าต่างหลังพิมพ์ (ยกเลิกได้ถ้าอยากให้ผู้ใช้ตรวจอีกครั้ง)
        printWin.close();
      }
    };

    // ถ้าเป็นไฟล์ CSS external อาจต้องรอโหลดสั้นๆ
    setTimeout(doPrint, 150);
  }

  return (
    <div className="fixed inset-0 z-[100]">
      {/* overlay + drawer (หน้าจอปกติ) */}
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold">ตัวอย่างเอกสาร</div>
            <select
              className="rounded-lg border px-2 py-1 text-sm"
              value={printTemplate}
              onChange={(e) => onChangeTemplate?.(e.target.value)}
            >
              <option value="POS_RECEIPT_A4">A4 / ใบเสร็จ POS</option>
              <option value="POS_RECEIPT_58">58mm / ใบเสร็จ POS</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button kind="white" onClick={onClose}>ปิด</Button>
            <Button kind="primary" onClick={handlePrint} disabled={!safeDoc}>พิมพ์</Button>
            <Button kind="success" onClick={onNewBill}>เริ่มบิลใหม่</Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="border rounded-xl p-4 bg-white">
            {safeDoc ? <PosPrintDoc doc={safeDoc} /> : <div className="text-slate-500 text-sm">ยังไม่มีข้อมูลเอกสาร</div>}
          </div>
        </div>
      </div>

      {/* แหล่ง HTML สำหรับพิมพ์ (ซ่อนไว้บนหน้าจอ) */}
      <div id="pos-print-html" style={{ position: "absolute", left: "-99999px", top: 0 }}>
        {safeDoc ? <PosPrintDoc doc={safeDoc} /> : null}
      </div>
    </div>
  );
}
