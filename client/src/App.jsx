import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import RootLayout from './routes/RootLayout.jsx';
import DashboardPage from './routes/DashbardPage.jsx';
import ProductsPage from './routes/ProductsPage.jsx';
import ProductTypesPage from './routes/ProductTypesPage.jsx';
import BranchesPage from './routes/BranchesPage.jsx';
import ConsignmentShopsPage from './routes/ConsignmentShopsPage.jsx';
import InventoryPage from './routes/InventoryPage.jsx';
import PurchasesPage from './routes/PurchasesPage.jsx';
import TransfersPage from './routes/TransfersPage.jsx';
import SalesPage from './routes/SalesPage.jsx';
import SettingsPage from './routes/SettingsPage.jsx';
import NotFoundPage from './routes/NotFoundPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'product-types', element: <ProductTypesPage /> },
      { path: 'branches', element: <BranchesPage /> },
      { path: 'consignment-shops', element: <ConsignmentShopsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'purchases', element: <PurchasesPage /> },
      { path: 'transfers', element: <TransfersPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
    errorElement: <NotFoundPage />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
