import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { routerOptions } from './routerBase.js';

import RootLayout from './pages/RootLayout.jsx';
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
import DocsHome from './pages/docs/DocsHome.jsx';
import DeliveryDocs from './pages/docs/DeliveryDocs.jsx';
import InvoiceDocs from './pages/docs/InvoiceDocs.jsx';
import ConsaleDocs from './pages/docs/ConsaleDocs.jsx';
import ReceiptDocs from './pages/docs/ReceiptDocs.jsx';
import QuoteDocs from './pages/docs/QuoteDocs.jsx';
import DocPreview from './pages/docs/DocPreview.jsx';
import PreAuthLanding from './pages/auth/PreAuthLanding.jsx';
import Login from './pages/auth/Login.jsx';
import SignUp from './pages/auth/SignUp.jsx';
import DashboardRouter from './pages/DashboardRouter.jsx';

import { useAuthStore } from './store/authStore.js';
function RequireAuth({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function InventoryConsignmentWrapper() {
  return <InventoryPage defaultScope="consignment" />;
}

const routes = [
  { path: '/', element: <PreAuthLanding />, errorElement: <NotFoundPage /> },
  { path: '/login', element: <Login /> },
  { path: '/sign-up', element: <SignUp /> },
  { path: '/dashboard', element: <DashboardRouter /> },

  {
    path: '/',
    element: <RequireAuth><RootLayout /></RequireAuth>,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'consignment/categories', element: <ConsignmentCategoriesPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'consignment-shops', element: <ConsignmentShopsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'inventory/count', element: <CountInventoryPage /> },
      { path: 'consignment/inventory', element: <InventoryConsignmentWrapper /> },
      { path: 'purchases', element: <PurchasesPage /> },
      { path: 'branches/delivery', element: <BranchDeliveryPage /> },
      { path: 'branches/sales', element: <BranchSalesPage /> },
      { path: 'consignment/delivery', element: <ConsignmentDeliveryPage /> },
      { path: 'consignment/sales', element: <ConsignmentSalesPage /> },
      { path: 'quotes', element: <QuotesPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/templates', element: <TemplatesSettingsPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: '/docs/',
    element: (
      <RequireAuth>
        <DocsHome />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <div className="p-6">เลือกประเภทเอกสารจากเมนูด้านซ้าย</div> },
      { path: 'deliveries', element: <DeliveryDocs /> },
      { path: 'consales', element: <ConsaleDocs /> },
      { path: 'invoices', element: <InvoiceDocs /> },
      { path: 'receipts', element: <ReceiptDocs /> },
      { path: 'quotes', element: <QuoteDocs /> },
      { path: ':kind/:id', element: <DocPreview /> },
    ],
  },
];

const router = createBrowserRouter(routes, routerOptions);

export default function App() {
  return <RouterProvider router={router} />;
}
