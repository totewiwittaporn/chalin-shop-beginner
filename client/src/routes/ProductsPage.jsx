import { useMemo, useState } from 'react';
import { useDataStore } from '../store/dataStore.js';
import { Card } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { Table } from '../components/ui/Table.jsx';

export default function ProductsPage() {
  const { products, productTypes, addProduct, removeProduct } = useDataStore();
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const typeById = Object.fromEntries(productTypes.map((t) => [t.id, t.name]));
    return products
      .filter((p) => (q ? (p.name + p.sku).toLowerCase().includes(q.toLowerCase()) : true))
      .map((p) => ({ ...p, typeName: typeById[p.typeId] || '-' }));
  }, [products, productTypes, q]);

  return (
    <div className="grid gap-4">
      <Card>
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="grow">
            <Input
              placeholder="ค้นหาชื่อ/รหัสสินค้า"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button
            onClick={() =>
              addProduct({ sku: 'NEW-001', name: 'สินค้าใหม่', basePrice: 10, typeId: 1 })
            }
          >
            เพิ่มสินค้า (mock)
          </Button>
        </div>
      </Card>

      <Card>
        <Table
          columns={[
            { key: 'sku', header: 'SKU' },
            { key: 'name', header: 'ชื่อสินค้า' },
            { key: 'typeName', header: 'ประเภท' },
            { key: 'basePrice', header: 'ราคา (฿)' },
            {
              key: 'actions',
              header: '',
              render: (_, r) => (
                <div className="flex justify-end">
                  <button className="btn btn-outline text-xs" onClick={() => removeProduct(r.id)}>
                    ลบ
                  </button>
                </div>
              ),
            },
          ]}
          data={rows}
        />
      </Card>
    </div>
  );
}
