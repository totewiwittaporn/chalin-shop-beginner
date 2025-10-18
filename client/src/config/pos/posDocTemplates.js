export const POS_TEMPLATES = {
  POS_RECEIPT_A4: {
    key: "POS_RECEIPT_A4",
    paper: "A4",
    title: "ใบเสร็จรับเงิน (POS)",
    table: {
      columns: [
        { key: "no", label: "#", width: "8%" },
        { key: "name", label: "สินค้า", width: "44%" },
        { key: "qty", label: "จำนวน", align: "right", width: "12%" },
        { key: "price", label: "ราคา/หน่วย", align: "right", width: "18%" },
        { key: "amount", label: "รวม", align: "right", width: "18%" },
      ],
    },
    footer: { signLeft: "ผู้รับเงิน", signRight: "ผู้จ่ายเงิน" },
  },
  POS_RECEIPT_58: {
    key: "POS_RECEIPT_58",
    paper: "58mm",
    title: "ใบเสร็จ (POS 58mm)",
    table: {
      columns: [
        { key: "name", label: "สินค้า" },
        { key: "qty", label: "Qty", align: "right" },
        { key: "price", label: "ราคา", align: "right" },
        { key: "amount", label: "รวม", align: "right" },
      ],
    },
    footer: { signLeft: "Signature", signRight: "Signature" },
  },
};

export function getPosTemplate(docType) {
  return POS_TEMPLATES[docType];
}
