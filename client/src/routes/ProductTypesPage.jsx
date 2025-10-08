import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import { Table } from '../components/ui/Table.jsx';

export default function ProductTypesPage() {
  const { productTypes } = useDataStore();
  return (
    <Card>
      <Table
        columns={[
          { key: 'id', header: 'ID' },
          { key: 'name', header: 'ประเภทสินค้า' },
        ]}
        data={productTypes}
      />
    </Card>
  );
}
