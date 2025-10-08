import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';

export default function SalesPage() {
  const { sales, branches } = useDataStore();
  const nameByBranch = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const rows = sales.map((s) => ({
    id: s.id,
    docNo: s.docNo,
    branch: nameByBranch[s.branchId] || '-',
    status: s.status,
  }));

  return (
    <Card>
      <Table
        columns={[
          { key: 'docNo', header: 'เลขที่เอกสาร' },
          { key: 'branch', header: 'สาขา' },
          { key: 'status', header: 'สถานะ' },
        ]}
        data={rows}
      />
    </Card>
  );
}
