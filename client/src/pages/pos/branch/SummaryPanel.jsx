import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

/**
 * SummaryPanel
 * - แสดง Subtotal/Discount/Total
 * - จัดการส่วนลดทั้งบิล (บาท/%) พร้อม clamp ตามเพดาน STAFF (UI level)
 * - หมายเหตุ + ปุ่ม ชำระเงิน / พักบิล / ยกเลิกบิล
 */
export default function SummaryPanel({
  role = 'STAFF',
  subtotal = 0,
  discountBill = { type: 'amount', value: 0 },
  discountCaps = null, // null (ADMIN ไม่จำกัด) | { pctMax, amountMax }
  note = '',
  onChangeBillDiscount, // (type, value)
  onChangeNote, // (text)
  onOpenPayment, // () => void
  onSaveDraft, // () => void
  onClear, // () => void
  cartEmpty = false,
}) {
  function money(n) {
    return (Number(n) || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // clamp UI ตามเพดานเมื่อเป็น STAFF
  const clampedValue = (() => {
    const v = Number(discountBill?.value || 0);
    if (!discountCaps) return v; // ADMIN
    if (discountBill.type === 'percent') return Math.min(v, Number(discountCaps.pctMax || 0));
    return Math.min(v, Number(discountCaps.amountMax || 0));
  })();

  const billDiscountAmount = (() => {
    if (discountBill.type === 'percent') {
      const pct = Math.min(100, Math.max(0, clampedValue));
      return (pct / 100) * Number(subtotal || 0);
    }
    return Math.max(0, clampedValue);
  })();

  const total = Math.max(0, Number(subtotal || 0) - billDiscountAmount);

  const limitHint =
    discountCaps && role !== 'ADMIN'
      ? discountBill.type === 'percent'
        ? `เพดาน ${discountCaps.pctMax}%`
        : `เพดาน ${money(discountCaps.amountMax)} บาท`
      : null;

  return (
    <Card>
      <Card.Header>
        <div className="font-medium">สรุปยอด</div>
      </Card.Header>
      <Card.Body className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span>Subtotal</span>
          <b>{money(subtotal)}</b>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span>ส่วนลดทั้งบิล</span>
            <select
              className="rounded-lg border px-2 py-1 text-sm"
              value={discountBill.type}
              onChange={(e) => onChangeBillDiscount?.(e.target.value, discountBill.value)}
            >
              <option value="amount">บาท</option>
              <option value="percent">%</option>
            </select>
          </div>
          <input
            className="w-28 rounded-lg border px-2 py-1 text-right text-sm"
            value={discountBill.value}
            onChange={(e) => {
              const raw = e.target.value;
              const num = Number(raw);
              if (Number.isNaN(num)) return onChangeBillDiscount?.(discountBill.type, raw);
              // clamp เฉพาะ UI
              const v = (() => {
                if (!discountCaps) return num; // ADMIN
                if (discountBill.type === 'percent')
                  return Math.min(num, Number(discountCaps.pctMax || 0));
                return Math.min(num, Number(discountCaps.amountMax || 0));
              })();
              onChangeBillDiscount?.(discountBill.type, v);
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            ส่วนลด (คิดเป็นบาท)
            {limitHint ? <em className="ml-2 not-italic opacity-80">{limitHint}</em> : null}
          </span>
          <b>-{money(billDiscountAmount)}</b>
        </div>

        <div className="flex items-center justify-between text-base">
          <span>รวมทั้งสิ้น</span>
          <b>{money(total)}</b>
        </div>

        <div className="pt-2">
          <label className="text-sm text-slate-600">หมายเหตุ</label>
          <Input
            value={note}
            onChange={(e) => onChangeNote?.(e.target.value)}
            placeholder="พิมพ์หมายเหตุบิล"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button kind="success" onClick={onOpenPayment} disabled={cartEmpty}>
            ชำระเงิน
          </Button>
          <Button kind="editor" onClick={onSaveDraft} disabled={cartEmpty}>
            พักบิล
          </Button>
          <Button kind="danger" onClick={onClear} disabled={cartEmpty}>
            ยกเลิกบิล
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
