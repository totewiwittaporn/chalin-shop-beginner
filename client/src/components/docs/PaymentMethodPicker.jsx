export function PaymentMethodPicker({ value, onChange }) {
  // value = { methods: ['CASH','TRANSFER','CARD'], transfer: { scope:'branch'|'partner', accountId }, card: { brand,last4, note } }
  // UI:
  //  - checkbox methods: เงินสด / โอน / บัตร
  //  - ถ้าเลือก "โอน" → แสดง BankAccountSelector (เลือกจากบัญชีของ "ผู้รับเงิน")
  //  - ถ้าเลือก "บัตร" → ช่อง brand/last4/note (อย่างย่อ)
}
