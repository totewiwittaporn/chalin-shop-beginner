import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// Layout หลัก (มี Sidebar + Navbar)
import RootLayout from './routes/RootLayout.jsx';

// หน้าใช้งานหลัก
import DashboardPage from './routes/DashboardPage.jsx';
import ProductsPage from './routes/ProductsPage.jsx';
import ProductTypesPage from './routes/ProductTypesPage.jsx';
import BranchesPage from './routes/BranchesPage.jsx';
import ConsignmentShopsPage from './routes/ConsignmentShopsPage.jsx';
import InventoryPage from './routes/InventoryPage.jsx';
import PurchasesPage from './routes/PurchasesPage.jsx';
import TransfersPage from './routes/TransfersPage.jsx';
import SalesPage from './routes/SalesPage.jsx';
import QuotesPage from './routes/QuotesPage.jsx';
import SettingsPage from './routes/SettingsPage.jsx';
import ProfilePage from './routes/ProfilePage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';
import UsersPage from './routes/UsersPage.jsx';
import CountInventoryPage from './routes/CountInventoryPage.jsx';

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
        { path: 'product-types', element: <ProductTypesPage /> },
        { path: 'products', element: <ProductsPage /> },
        { path: 'branches', element: <BranchesPage /> },
        { path: 'consignment-shops', element: <ConsignmentShopsPage /> },
        { path: 'inventory', element: <InventoryPage /> },
        { path: 'inventory/count', element: <CountInventoryPage /> },

        // Alias สำหรับโหมดฝากขาย
        { path: 'consignment/inventory', element: <InventoryConsignmentWrapper /> },
        { path: 'consignment/sales', element: <SalesConsignmentWrapper /> },

        // รายการเอกสาร
        { path: 'purchases', element: <PurchasesPage /> },
        { path: 'transfers', element: <TransfersPage /> },
        { path: 'sales', element: <SalesPage /> },
        { path: 'quotes', element: <QuotesPage /> },

        // รายงาน

        // ระบบ
        { path: 'settings', element: <SettingsPage /> },
        { path: 'profile', element: <ProfilePage /> },
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
