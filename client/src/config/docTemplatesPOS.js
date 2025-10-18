// เทมเพลตสำหรับ POS สาขา (A4 และ 58mm)
// ให้รูปแบบสอดคล้องกับสิ่งที่ PrintDoc.jsx ใช้:
// - resolve ได้จาก doc.header.docType
// - มี table.columns (และ summaryColumns ถ้าต้องการโหมดสรุป)

export const POS_RECEIPT_A4 = {
  key: "POS_RECEIPT_A4",
  paper: "A4",
  title: "ใบเสร็จรับเงิน (POS)",
  margins: { top: 16, right: 16, bottom: 16, left: 16 },
  table: {
    columns: [
      { key: "no",     label: "#",           width: "8%" },
      { key: "name",   label: "สินค้า",      width: "44%" },
      { key: "qty",    label: "จำนวน",       width: "12%", align: "right" },
      { key: "price",  label: "ราคา/หน่วย",  width: "18%", align: "right" },
      { key: "amount", label: "รวม",         width: "18%", align: "right" },
    ],
    // summaryColumns: [...], // ถ้าต้องการโหมด SUMMARY
  },
  footer: {
    showSignature: false,
  },
};

export const POS_RECEIPT_58 = {
  key: "POS_RECEIPT_58",
  paper: "58mm",
  title: "ใบเสร็จ (POS 58mm)",
  margins: { top: 6, right: 6, bottom: 6, left: 6 },
  table: {
    columns: [
      { key: "name",   label: "สินค้า" },
      { key: "qty",    label: "Qty",   align: "right" },
      { key: "price",  label: "ราคา",  align: "right" },
      { key: "amount", label: "รวม",   align: "right" },
    ],
  },
  footer: {
    showSignature: false,
  },
};

export const DOC_TYPES_POS = {
  POS_RECEIPT_A4,
  POS_RECEIPT_58,
};
