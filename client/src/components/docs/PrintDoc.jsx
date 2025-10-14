import { getDocTemplate } from '@/config/docTemplates';

function BlockAddress({ party }) {
  return (
    <div>
      <div className="font-semibold">{party?.name}</div>
      {party?.addressLine1 && <div className="text-sm">{party.addressLine1}</div>}
      {party?.addressLine2 && <div className="text-sm">{party.addressLine2}</div>}
      {party?.addressLine3 && <div className="text-sm">{party.addressLine3}</div>}
      {party?.displayIdentity && <div className="text-sm mt-1">{party.displayIdentity}</div>}
    </div>
  );
}

export default function PrintDoc({ doc, templateOverrides }) {
  const tpl = getDocTemplate(doc.header.docType, doc.partnerCode, templateOverrides);
  const cols =
    doc.lineMode === 'SUMMARY' && tpl.table.summaryColumns
      ? tpl.table.summaryColumns
      : tpl.table.columns;

  return (
    <div className="print-doc text-slate-800">
      {/* Header banner */}
      <div className="flex items-start justify-between rounded-xl bg-amber-50 p-4">
        <div>
          <h1 className="text-2xl font-semibold">{doc.header.title || tpl.title}</h1>
          <div className="text-sm">Date: {doc.header.docDate}</div>
          <div className="text-sm">No: {doc.header.docNo}</div>
        </div>
        <div className="text-right">
          {doc.issuer?.logoUrl && (
            <img src={doc.issuer.logoUrl} alt="logo" className="inline-block h-10 mb-1" />
          )}
          <BlockAddress party={doc.issuer} />
        </div>
      </div>

      {/* Bill to / To */}
      <div className="grid grid-cols-2 gap-4 my-3">
        <div className="rounded-lg bg-white border p-3">
          <div className="font-medium mb-1">Bill to</div>
          <BlockAddress party={doc.recipient} />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="px-3 py-2 text-left">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.lines?.map((ln, idx) => (
              <tr key={idx} className="border-t">
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2">
                    {c.key === 'no' ? idx + 1 : (ln[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Payment */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="font-medium mb-2">Payment Info</div>
          {doc.payment?.cash && <div>• Cash</div>}
          {doc.payment?.transfer && (
            <div>
              • Transfer — {doc.payment.bank?.bankName} {doc.payment.bank?.accountNo}{' '}
              {doc.payment.bank?.accountName ? `(${doc.payment.bank.accountName})` : ''}
            </div>
          )}
          {doc.payment?.card && <div>• Card — {doc.payment.card?.note || 'credit/debit'}</div>}
        </div>
        <div className="rounded-xl bg-slate-50 p-3 ml-auto w-full max-w-sm">
          {doc.money?.subTotal != null && (
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{Number(doc.money.subTotal).toLocaleString()}</span>
            </div>
          )}
          {doc.money?.vat != null && (
            <div className="flex justify-between">
              <span>VAT</span>
              <span>{Number(doc.money.vat).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg mt-1">
            <span>Total</span>
            <span>{Number(doc.money.grandTotal).toLocaleString()}</span>
          </div>
          {doc.money?.amountInWords && (
            <div className="text-xs text-slate-500 mt-1">({doc.money.amountInWords})</div>
          )}
        </div>
      </div>

      {/* Footer signatures */}
      <div className="grid grid-cols-2 gap-8 mt-10">
        <div className="text-center">
          <div className="h-12" />
          <div className="border-t pt-1">{tpl.footer?.signLeft || 'Signature'}</div>
        </div>
        <div className="text-center">
          <div className="h-12" />
          <div className="border-t pt-1">{tpl.footer?.signRight || 'Signature'}</div>
        </div>
      </div>
    </div>
  );
}
