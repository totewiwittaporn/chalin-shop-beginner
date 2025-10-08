import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';


export default function ConsignmentShopsPage() {
const { consignmentShops } = useDataStore();
return (
<Card>
<Table columns={[{ key: 'id', header: 'ID' }, { key: 'name', header: 'ร้านฝาก' }, { key: 'owner', header: 'เจ้าของ' }]} data={consignmentShops} />
</Card>
);
}