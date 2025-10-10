import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';

export default function TransfersPage() {
  const { transfers, branches } = useDataStore();
  const nameByBranch = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const rows = transfers.map((t) => ({
    id: t.id,
    docNo: t.docNo,
    from: nameByBranch[t.fromBranchId] || '-',
    to: nameByBranch[t.toBranchId] || '-',
    status: t.status,
  }));

  return (
    <Card>
      <Table
        columns={[
          { key: 'docNo', header: 'เลขที่เอกสาร' },
          { key: 'from', header: 'จาก' },
          { key: 'to', header: 'ไปยัง' },
          { key: 'status', header: 'สถานะ' },
        ]}
        data={rows}
      />
    </Card>
  );
}
