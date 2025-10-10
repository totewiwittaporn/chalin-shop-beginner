import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout หลัก (มี Sidebar + Navbar)
import RootLayout from './pages/RootLayout.jsx';

// หน้าใช้งานหลัก
import DashboardPage from './pages/DashboardPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ConsignmentCategoriesPage from './pages/ConsignmentCategoriesPage.jsx';
import BranchesPage from './pages/BranchesPage.jsx';
import ConsignmentShopsPage from './pages/ConsignmentShopsPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import CountInventoryPage from './pages/CountInventoryPage.jsx';
import PurchasesPage from './pages/PurchasesPage.jsx';
import QuotesPage from './pages/QuotesPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import UsersPage from './pages/UsersPage.jsx';
import TemplatesSettingsPage from './pages/TemplatesSettingsPage.jsx';
import BranchDeliveryPage from './pages/BranchDeliveryPage.jsx';
import BranchSalesPage from './pages/BranchSalesPage.jsx';
import ConsignmentDeliveryPage from './pages/ConsignmentDeliveryPage.jsx';
import ConsignmentSalesPage from './pages/ConsignmentSalesPage.jsx';
import DevSeeder from './pages/DevSeeder.jsx';
import DocsHome from './pages/docs/DocsHome.jsx';
import DeliveryDocs from './pages/docs/DeliveryDocs.jsx';
import InvoiceDocs from './pages/docs/InvoiceDocs.jsx';
import ConsaleDocs from './pages/docs/ConsaleDocs.jsx';
import ReceiptDocs from './pages/docs/ReceiptDocs.jsx';
import QuoteDocs from './pages/docs/QuoteDocs.jsx';
import DocPreview from './pages/docs/DocPreview.jsx';

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
        { path: 'consales', element: <ConsaleDocs /> },
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
