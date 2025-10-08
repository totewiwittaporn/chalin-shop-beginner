import { Card } from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';
import { useDataStore } from '../store/dataStore.js';


export default function DashboardPage() {
const { products, branches, purchases, sales } = useDataStore();
return (
<div className="grid md:grid-cols-2 gap-6">
<Card>
<div className="flex items-center justify-between">
<div>
<div className="text-sm text-muted">Total Products</div>
<div className="text-2xl font-semibold">{products.length}</div>
</div>
<Badge>OK</Badge>
</div>
</Card>
<Card>
<div className="text-sm text-muted">Branches</div>
<div className="text-2xl font-semibold">{branches.length}</div>
</Card>
<Card>
<div className="text-sm text-muted">Purchases (mock)</div>
<div className="text-2xl font-semibold">{purchases.length}</div>
</Card>
<Card>
<div className="text-sm text-muted">Sales (mock)</div>
<div className="text-2xl font-semibold">{sales.length}</div>
</Card>
</div>
);
}