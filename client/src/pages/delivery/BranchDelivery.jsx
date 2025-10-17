import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import * as Table from '@/components/ui/Table.jsx';
import GradientPanel from '@/components/theme/GradientPanel';
import { useAuthStore } from '@/store/authStore';

// ✅ ใช้โมดัลที่แยกไฟล์ออกมา
import ReceiveDeliveryModal from '@/components/delivery/ReceiveDeliveryModal';

export default function BranchDeliveryPage() {
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [branches, setBranches] = useState([]);
  const [issuer, setIssuer] = useState(''); // ADMIN เท่านั้น
  const [recipient, setRecipient] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lines, setLines] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  // ตารางเอกสาร
  const [tab, setTab] = useState('recipient'); // "issuer" | "recipient"
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  // ป๊อปอัพรับสินค้า
  const [showReceive, setShowReceive] = useState(false);
  const [receiveDoc, setReceiveDoc] = useState(null);
  const [receiveLines, setReceiveLines] = useState([]);

  const fmt = (n) =>
    n == null
      ? '-'
      : (typeof n === 'string' ? Number(n) : n).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  const findBranchName = (id) => {
    const b = branches.find((x) => String(x.id) === String(id));
    return b ? `${b.code} — ${b.name}` : `#${id}`;
  };

  // โหลดสาขา
  useEffect(() => {
    (async () => {
      const r = await api.get('/api/branches/options').catch(() => ({ data: [] }));
      setBranches(Array.isArray(r.data) ? r.data : []);
    })();
  }, []);

  // ค้นหาสินค้า (auto-suggest)
  useEffect(() => {
    let on = true;
    (async () => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }
      const r = await api
        .get('/api/products', { params: { q: query, limit: 10 } })
        .catch(() => ({ data: [] }));
      const arr = Array.isArray(r.data) ? r.data : Array.isArray(r.data?.items) ? r.data.items : [];
      if (on) setSearchResults(arr.slice(0, 10));
    })();
    return () => {
      on = false;
    };
  }, [query]);

  const addProduct = (p) => {
    setLines((prev) => {
      const exists = prev.find((x) => x.productId === p.id);
      if (exists)
        return prev.map((x) => (x.productId === p.id ? { ...x, qty: (x.qty || 0) + 1 } : x));
      return [...prev, { productId: p.id, name: p.name, barcode: p.barcode, qty: 1 }];
    });
    setQuery('');
    setSearchResults([]);
  };
  const updateQty = (id, qty) =>
    setLines((prev) =>
      prev.map((l) => (l.productId === id ? { ...l, qty: Math.max(0, Number(qty || 0)) } : l))
    );
  const removeLine = (id) => setLines((prev) => prev.filter((l) => l.productId !== id));

  const canSubmit = useMemo(() => {
    if (!lines.some((l) => Number(l.qty) > 0)) return false;
    if (isAdmin) return issuer && recipient && issuer !== recipient;
    return !!recipient && recipient !== String(user?.branchId || '');
  }, [issuer, recipient, lines, isAdmin, user]);

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const payload = {
        note: note || undefined, // schema ไม่มี note — ส่งมาก็ถูกเพิกเฉย
        items: lines
          .filter((l) => Number(l.qty) > 0)
          .map((l) => ({ productId: l.productId, qty: Number(l.qty) })),
        ...(isAdmin
          ? { issuerBranchId: Number(issuer), recipientBranchId: Number(recipient) }
          : { recipientBranchId: Number(recipient) }),
      };
      const r = await api.post('/api/deliveries', payload);
      nav(`/delivery/${r.data?.id}`);
    } finally {
      setLoading(false);
    }
  };

  // โหลดเอกสารสำหรับตาราง
  const loadDocs = async (mode) => {
    setDocsLoading(true);
    try {
      const r = await api.get('/api/deliveries', { params: { limit: 50, mine: mode } });
      setDocs(Array.isArray(r.data) ? r.data : []);
    } finally {
      setDocsLoading(false);
    }
  };
  useEffect(() => {
    loadDocs(tab);
  }, [tab]);

  // เปิดป๊อปอัพรับสินค้า
  const openReceiveModal = async (id) => {
    const r = await api.get(`/api/deliveries/${id}`);
    const d = r.data;
    setReceiveDoc(d);
    setReceiveLines(
      (d.items || []).map((it) => ({
        id: it.id,
        productId: it.productId,
        name: it.product?.name || `#${it.productId}`,
        barcode: it.product?.barcode || '-',
        qtyDoc: Number(it.qty || 0),
        qtyReceived: Number(it.qty || 0),
      }))
    );
    setShowReceive(true);
  };

  const onChangeReceiveQty = (lineId, qty) => {
    setReceiveLines((prev) => prev.map((x) => (x.id === lineId ? { ...x, qtyReceived: qty } : x)));
  };

  const doReceive = async () => {
    const someDiff = receiveLines.some((l) => Number(l.qtyReceived) !== Number(l.qtyDoc));
    if (someDiff) {
      const ok = confirm('จำนวนรับจริงไม่ตรงกับเอกสาร ต้องการดำเนินการต่อหรือไม่?');
      if (!ok) return;
    }
    await api.patch(`/api/deliveries/${receiveDoc.id}/receive`, {
      items: receiveLines.map((l) => ({ id: l.id, qtyReceived: Number(l.qtyReceived) })),
    });
    setShowReceive(false);
    setReceiveDoc(null);
    setReceiveLines([]);
    await loadDocs(tab);
  };

  /* ------------------------- ดู / พิมพ์ใบส่งสินค้า ------------------------- */
  /**
   * แก้แนวทาง:
   * - ดึง HTML/PDF ด้วย axios (มี Authorization header ครบ)
   * - จากนั้นเปิดหน้าต่างใหม่แล้ว inject ข้อมูลเข้าไปเอง
   * → แก้ปัญหาที่ window.open() ไม่ส่ง header และกัน 404 ที่มาจาก fallback SPA
   */

  // ดู (HTML)
  // ดู (HTML) — ถ้าป๊อปอัพเปิดได้จะเปิดแท็บใหม่, ถ้าถูกบล็อกจะเปิดในแท็บปัจจุบันแทน
  const viewBill = async (docId) => {
    // พยายามเปิดแท็บใหม่ก่อน
    window.open(`/delivery/${docId}/print`, '_blank', 'noopener,noreferrer');

    try {
      const res = await api.get(`/api/print/delivery/${docId}`, {
        params: { size: 'a4' },
        responseType: 'text',
        transformResponse: [(d) => d],
        validateStatus: (s) => s >= 200 && s < 600,
      });
      const html = String(res.data || '');
      const isLikelyJson = html.trim().startsWith('{') && html.trim().endsWith('}');
      const content = isLikelyJson
        ? `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${html}</pre>`
        : html;

      if (popup) {
        // ✅ เปิดแท็บใหม่สำเร็จ → เขียนเนื้อหาใส่แท็บนั้น
        popup.document.open();
        popup.document.write(content);
        popup.document.close();
      } else {
        // ❌ ป๊อปอัพถูกบล็อก → เปิดในแท็บปัจจุบันแทน
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.location.assign(url);
      }
    } catch (err) {
      if (popup) {
        popup.document.open();
        popup.document.write(
          `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">โหลดใบส่งสินค้าไม่สำเร็จ\n\n${String(err)}</pre>`
        );
        popup.document.close();
      } else {
        // same-tab fallback
        const msg = `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">โหลดใบส่งสินค้าไม่สำเร็จ\n\n${String(err)}</pre>`;
        const blob = new Blob([msg], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.location.assign(url);
      }
    }
  };

  // พิมพ์ (PDF) — ถ้าป๊อปอัพถูกบล็อก ให้เปิด/ดาวน์โหลดในแท็บปัจจุบัน
  const printBillPDF = async (docId) => {
    window.open(`/delivery/${docId}/print?auto=1`, '_blank', 'noopener,noreferrer');

    try {
      const res = await api.get(`/api/print/delivery/${docId}`, {
        params: { size: 'a4', format: 'pdf' },
        responseType: 'arraybuffer',
        validateStatus: (s) => s >= 200 && s < 600,
      });

      const ctype = String(res.headers?.['content-type'] || '').toLowerCase();

      if (ctype.includes('application/pdf')) {
        // ✅ ได้ PDF จริง
        const pdfBlob = new Blob([res.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);

        if (popup) {
          // แสดงในแท็บใหม่ด้วย iframe เพื่อความเสถียร
          popup.document.open();
          popup.document.write(`
          <html><head><meta charset="utf-8"/></head>
          <body style="margin:0">
            <iframe src="${url}" style="border:0;width:100vw;height:100vh"></iframe>
          </body></html>
        `);
          popup.document.close();
        } else {
          // ❌ ป๊อปอัพถูกบล็อก → เปิดในแท็บปัจจุบัน
          window.location.assign(url);
        }
        return;
      }

      // ❌ ไม่ใช่ PDF → แสดงข้อความ/HTML error
      const text = new TextDecoder('utf-8').decode(new Uint8Array(res.data || []));
      const isHtml = /<\/?(html|body|head)/i.test(text);
      const content = isHtml
        ? text
        : `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${text}</pre>`;

      if (popup) {
        popup.document.open();
        popup.document.write(content);
        popup.document.close();
      } else {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.location.assign(url);
      }
    } catch (err) {
      const content = `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">พิมพ์ใบส่งสินค้าไม่สำเร็จ\n\n${String(err)}</pre>`;
      if (popup) {
        popup.document.open();
        popup.document.write(content);
        popup.document.close();
      } else {
        const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.location.assign(url);
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full">
      <div className="w-full rounded-2xl p-4 sm:p-6 md:p-8" style={{ background: '#f4f7ff' }}>
        <div className="grid gap-6">
          <GradientPanel
            title="ส่งสินค้า (Branch → Branch)"
            subtitle={
              isAdmin ? 'เลือกต้นทางและปลายทาง' : 'สาขาของคุณสามารถส่งคืนสินค้ากลับ Main เท่านั้น'
            }
            actions={
              <Button className="btn-white" onClick={() => nav(-1)}>
                ย้อนกลับ
              </Button>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {isAdmin && (
                <div>
                  <label className="block text-sm text-slate-600 mb-1">สาขาต้นทาง</label>
                  <select
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 bg-white"
                  >
                    <option value="">-- เลือกสาขา --</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className={isAdmin ? 'col-span-2' : 'col-span-3'}>
                <label className="block text-sm text-slate-600 mb-1">สาขาปลายทาง</label>
                <select
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 bg-white"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.code} — {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm text-slate-600 mb-1">หมายเหตุ</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="ใส่หมายเหตุ (ถ้ามี)"
                />
              </div>
            </div>
          </GradientPanel>

          <GradientPanel title="ค้นหาสินค้า" innerClassName="!overflow-visible">
            <div className="relative">
              <Input
                className="input-glass"
                placeholder="พิมพ์ชื่อสินค้า/บาร์โค้ด (อย่างน้อย 2 ตัวอักษร)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {!!searchResults.length && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl border shadow">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="flex w-full items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left"
                      type="button"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="ml-auto font-mono text-sm">{p.barcode || '-'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </GradientPanel>

          <GradientPanel title="รายการสินค้า (จะส่ง)">
            <Table.Root>
              <Table.Head>
                <Table.Tr>
                  <Table.Th>สินค้า</Table.Th>
                  <Table.Th>บาร์โค้ด</Table.Th>
                  <Table.Th className="text-right w-[140px]">จำนวน</Table.Th>
                  <Table.Th className="text-right w-[80px]">ลบ</Table.Th>
                </Table.Tr>
              </Table.Head>
              <Table.Body>
                {lines.map((l) => (
                  <Table.Tr key={l.productId}>
                    <Table.Td>{l.name}</Table.Td>
                    <Table.Td className="font-mono">{l.barcode || '-'}</Table.Td>
                    <Table.Td className="text-right">
                      <Input
                        type="number"
                        min="0"
                        value={l.qty}
                        onChange={(e) => updateQty(l.productId, e.target.value)}
                        className="w-24 text-right"
                      />
                    </Table.Td>
                    <Table.Td className="text-right">
                      <Button onClick={() => removeLine(l.productId)} kind="danger" size="sm">
                        ลบ
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                ))}
                {!lines.length && (
                  <Table.Tr>
                    <Table.Td colSpan={4} className="text-center text-muted py-10">
                      ยังไม่มีสินค้าในรายการ
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Body>
            </Table.Root>

            <div className="mt-4 flex justify-end">
              <Button disabled={!canSubmit || loading} onClick={submit}>
                {loading ? 'กำลังบันทึก...' : 'บันทึกเอกสารส่งของ'}
              </Button>
            </div>
          </GradientPanel>

          {/* ตารางเอกสาร */}
          <GradientPanel
            title="รายการใบส่งสินค้า"
            subtitle="ดูและพิมพ์ใบส่งสินค้าเป็น PDF (A4) ได้จากตารางนี้"
            actions={
              <div className="flex gap-2">
                <Button
                  kind={tab === 'recipient' ? 'primary' : 'white'}
                  onClick={() => setTab('recipient')}
                >
                  ที่ฉันต้องรับ
                </Button>
                <Button
                  kind={tab === 'issuer' ? 'primary' : 'white'}
                  onClick={() => setTab('issuer')}
                >
                  ที่ฉันส่ง
                </Button>
                <Button kind="white" onClick={() => loadDocs(tab)}>
                  รีโหลด
                </Button>
              </div>
            }
          >
            {docsLoading ? (
              <div className="py-8 text-center">กำลังโหลด...</div>
            ) : (
              <Table.Root>
                <Table.Head>
                  <Table.Tr>
                    <Table.Th className="w-24">เลขที่</Table.Th>
                    <Table.Th className="w-40">วันที่</Table.Th>
                    <Table.Th>จาก</Table.Th>
                    <Table.Th>ไป</Table.Th>
                    <Table.Th className="text-right w-28">จำนวนรายการ</Table.Th>
                    <Table.Th className="text-right w-36">ยอดรวม</Table.Th>
                    <Table.Th className="w-40 text-center">สถานะ</Table.Th>
                    <Table.Th className="w-[340px] text-right">เครื่องมือ</Table.Th>
                  </Table.Tr>
                </Table.Head>
                <Table.Body>
                  {docs.map((d) => {
                    const itemsCount = (d.items || []).reduce(
                      (sum, it) => sum + Number(it.qty || 0),
                      0
                    );
                    return (
                      <Table.Tr key={d.id}>
                        <Table.Td className="font-mono">{d.docNo || `#${d.id}`}</Table.Td>
                        <Table.Td>
                          {d.docDate ? new Date(d.docDate).toLocaleString() : '-'}
                        </Table.Td>
                        <Table.Td>{findBranchName(d.issuerId)}</Table.Td>
                        <Table.Td>{findBranchName(d.recipientId)}</Table.Td>
                        <Table.Td className="text-right">{itemsCount}</Table.Td>
                        <Table.Td className="text-right">{fmt(d.total)}</Table.Td>
                        <Table.Td className="text-center">{d.status}</Table.Td>
                        <Table.Td className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {/* ดูใบส่งสินค้า (HTML) */}
                            <Button kind="white" size="sm" onClick={() => viewBill(d.id)}>
                              ดูใบส่งสินค้า
                            </Button>

                            {/* รับสินค้า (เฉพาะปลายทาง & ยังไม่รับ) */}
                            {tab === 'recipient' && d.status === 'ISSUED' && (
                              <Button
                                kind="success"
                                size="sm"
                                onClick={() => openReceiveModal(d.id)}
                              >
                                ยืนยันรับสินค้า
                              </Button>
                            )}
                          </div>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                  {!docs.length && (
                    <Table.Tr>
                      <Table.Td colSpan={8} className="py-8 text-center text-muted">
                        ไม่พบเอกสาร
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Body>
              </Table.Root>
            )}
          </GradientPanel>
        </div>
      </div>

      {/* ✅ โมดัลรับสินค้า (แยกไฟล์) */}
      <ReceiveDeliveryModal
        open={showReceive}
        onClose={() => setShowReceive(false)}
        doc={receiveDoc}
        lines={receiveLines}
        onChangeLineQty={onChangeReceiveQty}
        onConfirm={doReceive}
      />
    </div>
  );
}
