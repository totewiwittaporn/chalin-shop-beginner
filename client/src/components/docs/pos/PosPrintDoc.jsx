import { getPosTemplate } from "@/config/pos/posDocTemplates";

function BlockAddress({ party }) {
  if (!party) return null;
  return (
    <div>
      {party.name && <div className="font-semibold">{party.name}</div>}
      {party.branch && <div className="text-sm">สาขา: {party.branch}</div>}
      {party.addressLine1 && <div className="text-sm">{party.addressLine1}</div>}
      {party.addressLine2 && <div className="text-sm">{party.addressLine2}</div>}
      {party.displayIdentity && <div className="text-sm mt-1">{party.displayIdentity}</div>}
    </div>
  );
}

export default function PosPrintDoc({ doc }) {
  const docType = doc?.header?.docType || "POS_RECEIPT_58";
  const tpl = getPosTemplate(docType) || getPosTemplate("POS_RECEIPT_58");
  const cols = tpl?.table?.columns || [];

  return (
    <div className="pos-print-root text-slate-800">
      {/* Header */}
      <div className="flex items-start justify-between rounded-xl bg-amber-50 p-4 mb-3">
        <div>
          <h1 className="text-xl font-semibold">{doc?.header?.title || tpl?.title}</h1>
          <div className="text-sm">Date: {doc?.header?.docDate || ""}</div>
          <div className="text-sm">No: {doc?.header?.docNo || ""}</div>
        </div>
        <div className="text-right">
          <BlockAddress party={doc?.issuer} />
        </div>
      </div>

      {/* Bill to */}
      <div className="rounded-lg bg-white border p-3 mb-3">
        <div className="font-medium mb-1">Bill to</div>
        <BlockAddress party={doc?.recipient} />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={"px-3 py-2 " + (c.align === "right" ? "text-right" : "text-left")} style={{ width: c.width }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(doc?.lines || []).map((ln, idx) => (
              <tr key={idx} className="border-t">
                {cols.map((c) => (
                  <td key={c.key} className={"px-3 py-2 " + (c.align === "right" ? "text-right" : "")}>
                    {c.key === "no" ? idx + 1 : (ln?.[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-medium mb-2">Payment Info</div>
          {doc?.payment?.method && <div>• วิธีชำระ: {doc.payment.method}</div>}
          {doc?.payment?.ref && <div>• Ref: {doc.payment.ref}</div>}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ml-auto w-full max-w-sm">
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{Number(doc?.money?.grandTotal || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
          </div>
        </div>
      </div>

      {/* Footer signatures */}
      <div className="grid grid-cols-2 gap-8 mt-10">
        <div className="text-center">
          <div className="h-12" />
          <div className="border-t pt-1">{tpl?.footer?.signLeft || "Signature"}</div>
        </div>
        <div className="text-center">
          <div className="h-12" />
          <div className="border-t pt-1">{tpl?.footer?.signRight || "Signature"}</div>
        </div>
      </div>
    </div>
  );
}
