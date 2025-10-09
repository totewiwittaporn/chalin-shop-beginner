import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout หลัก (มี Sidebar + Navbar)
import RootLayout from './routes/RootLayout.jsx';

// หน้าใช้งานหลัก
import DashboardPage from './routes/DashboardPage.jsx';
import ProductsPage from './routes/ProductsPage.jsx';
import ConsignmentCategoriesPage from './routes/ConsignmentCategoriesPage.jsx';
import BranchesPage from './routes/BranchesPage.jsx';
import ConsignmentShopsPage from './routes/ConsignmentShopsPage.jsx';
import InventoryPage from './routes/InventoryPage.jsx';
import CountInventoryPage from './routes/CountInventoryPage.jsx';
import PurchasesPage from './routes/PurchasesPage.jsx';
import QuotesPage from './routes/QuotesPage.jsx';
import SettingsPage from './routes/SettingsPage.jsx';
import ProfilePage from './routes/ProfilePage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';
import UsersPage from './routes/UsersPage.jsx';
import TemplatesSettingsPage from './routes/TemplatesSettingsPage.jsx';
import BranchDeliveryPage from './routes/BranchDeliveryPage.jsx';
import BranchSalesPage from './routes/BranchSalesPage.jsx';
import ConsignmentDeliveryPage from './routes/ConsignmentDeliveryPage.jsx';
import ConsignmentSalesPage from './routes/ConsignmentSalesPage.jsx';
import DevSeeder from './routes/DevSeeder.jsx';
import DocsHome from './routes/docs/DocsHome.jsx';
import DeliveryDocs from './routes/docs/DeliveryDocs.jsx';
import InvoiceDocs from './routes/docs/InvoiceDocs.jsx';
import ReceiptDocs from './routes/docs/ReceiptDocs.jsx';
import QuoteDocs from './routes/docs/QuoteDocs.jsx';
import DocPreview from './routes/docs/DocPreview.jsx';

// ----- Wrapper ทางลัดโหมด Consignment -----
// ใช้คอมโพเนนต์ InventoryPage ตัวเดิม แต่บังคับให้เริ่มที่ scope = "consignment"
function InventoryConsignmentWrapper() {
  return <InventoryPage defaultScope="consignment" />;
}

// (ออปชัน) ถ้าต้องการหน้า Sales โหมด consignment ในอนาคต
function SalesConsignmentWrapper() {
  return <SalesPage defaultScope="consignment" />;
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <RootLayout />,
      errorElement: <NotFoundPage />,
      children: [
        { index: true, element: <DashboardPage /> },
        { path: 'users', element: <UsersPage /> },

        // คลังสินค้า
        { path: 'products', element: <ProductsPage /> },
        { path: 'consignment/categories', element: <ConsignmentCategoriesPage /> },
        { path: 'branches', element: <BranchesPage /> },
        { path: 'consignment-shops', element: <ConsignmentShopsPage /> },
        { path: 'inventory', element: <InventoryPage /> },
        { path: 'inventory/count', element: <CountInventoryPage /> },

        // Alias สำหรับโหมดฝากขาย
        { path: 'consignment/inventory', element: <InventoryConsignmentWrapper /> },

        // รายการเอกสาร
        { path: 'purchases', element: <PurchasesPage /> },
        { path: 'branches/delivery', element: <BranchDeliveryPage /> },
        { path: 'branches/sales', element: <BranchSalesPage /> },
        { path: 'consignment/delivery', element: <ConsignmentDeliveryPage /> },
        { path: 'consignment/sales', element: <ConsignmentSalesPage /> },
        { path: 'quotes', element: <QuotesPage /> },

        // รายงาน

        // ระบบ
        { path: 'settings', element: <SettingsPage /> },
        { path: 'settings/templates', element: <TemplatesSettingsPage /> },
        { path: 'profile', element: <ProfilePage /> },
        { path: 'dev/seeder', element: <DevSeeder /> }, // ← ชั่วคราวเพื่อโหลด mock
      ],
    },
    {
      path: 'docs',
      element: <DocsHome />,
      children: [
        { index: true, element: <div className="p-6">เลือกประเภทเอกสารจากเมนูด้านซ้าย</div> },
        { path: 'deliveries', element: <DeliveryDocs /> },
        { path: 'invoices', element: <InvoiceDocs /> },
        { path: 'receipts', element: <ReceiptDocs /> },
        { path: 'quotes', element: <QuoteDocs /> },
        { path: ':kind/:id', element: <DocPreview /> }, // kind: delivery|invoice|receipt|quote
      ],
    },
  ],
  {
    // เปิด future flag ตามที่ React Router แจ้งเตือน
    future: {
      v7_startTransition: true,
    },
  }
);

export default function App() {
  return <RouterProvider router={router} />;
}
