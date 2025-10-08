import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';


export default function InventoryPage() {
const { inventory, products, branches } = useDataStore();
const nameByProduct = Object.fromEntries(products.map((p) => [p.id, p.name]));
const nameByBranch = Object.fromEntries(branches.map((b) => [b.id, b.name]));
const rows = inventory.map((i) => ({
id: i.id,
product: nameByProduct[i.productId] || i.productId,
location: i.locationType === 'MAIN' ? 'สาขาหลัก' : nameByBranch[i.locationId] || '-',
qty: i.qty
}));


return (
<Card>
<Table columns={[{ key: 'product', header: 'สินค้า' }, { key: 'location', header: 'ที่เก็บ' }, { key: 'qty', header: 'จำนวน' }]} data={rows} />
</Card>
);
}