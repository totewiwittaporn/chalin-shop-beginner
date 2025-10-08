import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';
import Badge from '../components/ui/Badge.jsx';

export default function PurchasesPage() {
  const { purchases, branches } = useDataStore();
  const nameByBranch = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const rows = purchases.map((p) => ({
    id: p.id,
    docNo: p.docNo,
    date: p.docDate,
    branch: nameByBranch[p.branchId] || '-',
    supplier: p.supplier,
    status: p.status,
  }));

  return (
    <Card>
      <Table
        columns={[
          { key: 'docNo', header: 'เลขที่เอกสาร' },
          { key: 'date', header: 'วันที่' },
          { key: 'branch', header: 'สาขา' },
          { key: 'supplier', header: 'ผู้ขาย' },
          {
            key: 'status',
            header: 'สถานะ',
            render: (v) => (
              <Badge tone={v === 'CONFIRMED' ? 'success' : 'warn'}>{v}</Badge>
            ),
          },
        ]}
        data={rows}
      />
    </Card>
  );
}
