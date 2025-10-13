// client/src/pages/transfers/TransfersPage.jsx
import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card.jsx";
import Table from "@/components/ui/Table.jsx";
import Button from "@/components/ui/Button.jsx";
import {
  listTransfers,
  createTransfer,
  updateTransfer,
  sendTransfer,
  receiveTransfer,
} from "@/services/transfers.api.js";
import TransferForm from "@/components/transfers/TransferForm.jsx";
import { useAuthStore } from "@/store/authStore.js";

const canAccess = (role) => {
  if (!role) return false;
  if (role === "QUOTE_VIEWER") return false;
  return true;
};

const canDoAll = (role) => role === "ADMIN" || role === "STAFF" || role === "CONSIGNMENT";

export default function TransfersPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role || "GUEST";

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [openForm, setOpenForm] = useState(false);

  const allowed = useMemo(() => canAccess(role), [role]);

  async function fetchData() {
    setLoading(true);
    try {
      const data = await listTransfers({ q, status, page, pageSize });
      setRows(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (allowed) fetchData();
  }, [q, status, page, pageSize, allowed]);

  async function handleCreate(doc) {
    await createTransfer(doc);
    setOpenForm(false);
    fetchData();
  }

  async function handleSend(id) {
    await sendTransfer(id);
    fetchData();
  }

  async function handleReceive(id) {
    await receiveTransfer(id);
    fetchData();
  }

  if (!allowed) {
    return (
      <div className="p-4">
        <Card>
          <Card.Body>
            <div className="text-red-600">คุณไม่มีสิทธิ์เข้าหน้านี้</div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* ส่วนที่ 1: ค้นหา + เพิ่มเอกสาร */}
      <Card className="__gradient_">
        <Card.Header className="flex items-center justify-between">
          <div className="text-lg font-semibold">ใบส่งสินค้า</div>
          <div className="flex gap-2">
            <input
              className="border rounded-lg px-3 py-2 text-sm min-w-[240px]"
              placeholder="ค้นหา (รหัส/หมายเหตุ)"
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
            />
            <select
              className="border rounded-lg px-2 py-2 text-sm"
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SENT">SENT</option>
              <option value="RECEIVED">RECEIVED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            {canDoAll(role) && (
              <Button onClick={() => setOpenForm(true)}>เพิ่มใบส่งสินค้า</Button>
            )}
          </div>
        </Card.Header>
      </Card>

      {/* ส่วนที่ 2: ตาราง */}
      <Card>
        <Card.Body>
          <Table>
            <Table.Head>
              <tr>
                <Table.Th className="w-[100px]">เลขที่</Table.Th>
                <Table.Th className="w-[130px]">วันที่</Table.Th>
                <Table.Th>จาก</Table.Th>
                <Table.Th>ไปยัง</Table.Th>
                <Table.Th className="w-[110px]">สถานะ</Table.Th>
                <Table.Th className="w-[240px]">เครื่องมือ</Table.Th>
              </tr>
            </Table.Head>
            <Table.Body loading={loading}>
              {rows.length === 0 && !loading && (
                <tr>
                  <Table.Td colSpan={999} className="text-center text-muted py-10">
                    ไม่พบข้อมูล
                  </Table.Td>
                </tr>
              )}
              {rows.map((it) => {
                const dest =
                  it.toBranch?.name
                    ? `สาขา: ${it.toBranch.name}`
                    : it.toConsignmentPartner?.name
                    ? `ฝากขาย: ${it.toConsignmentPartner.name}`
                    : "-";
                return (
                  <Table.Tr key={it.id}>
                    <Table.Td>{it.code || `#${it.id}`}</Table.Td>
                    <Table.Td>{new Date(it.date).toLocaleDateString()}</Table.Td>
                    <Table.Td>{it.fromBranch?.name || it.fromBranchId}</Table.Td>
                    <Table.Td>{dest}</Table.Td>
                    <Table.Td>
                      <span className="px-2 py-1 rounded-md bg-slate-100">{it.status}</span>
                    </Table.Td>
                    <Table.Td>
                      <div className="flex gap-2">
                        {it.status === "DRAFT" && canDoAll(role) && (
                          <>
                            <Button kind="white" onClick={() => setOpenForm({ edit: it })}>
                              แก้ไข
                            </Button>
                            <Button kind="primary" onClick={() => handleSend(it.id)}>
                              ส่ง
                            </Button>
                          </>
                        )}
                        {it.status === "SENT" && canDoAll(role) && (
                          <Button kind="success" onClick={() => handleReceive(it.id)}>
                            รับ
                          </Button>
                        )}
                      </div>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Body>
          </Table>
        </Card.Body>
      </Card>

      {openForm && (
        <TransferForm
          onClose={() => setOpenForm(false)}
          onSubmit={async (payload) => {
            if (openForm?.edit) {
              await updateTransfer(openForm.edit.id, payload);
              setOpenForm(false);
              fetchData();
            } else {
              await handleCreate(payload);
            }
          }}
          editDoc={openForm?.edit || null}
          currentUser={user}
        />
      )}
    </div>
  );
}
