import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';


export default function BranchesPage() {
const { branches } = useDataStore();
return (
<Card>
<Table columns={[{ key: 'code', header: 'Code' }, { key: 'name', header: 'ชื่อสาขา' }, { key: 'type', header: 'ประเภท' }]} data={branches} />
</Card>
);
}