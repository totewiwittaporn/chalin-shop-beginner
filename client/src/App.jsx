// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PreAuthLanding from '@/pages/auth/PreAuthLanding';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';

import AppShell from '@/components/layout/AppShell';
import RequireAuth from '@/components/auth/RequireAuth';

import DashboardRouter from '@/pages/dashboard/DashboardRouter';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import StaffDashboard from '@/pages/dashboard/StaffDashboard';
import ConsignmentDashboard from '@/pages/dashboard/ConsignmentDashboard';
import QuoteViewerWelcome from '@/pages/viewer/QuoteViewerWelcome';

import ProductsPage from '@/pages/products/ProductsPage';
import BranchesPage from '@/pages/branches/BranchesPage';
import ConsignmentManagerPage from '@/pages/consignment/ConsignmentManagerPage';
import PurchasesPage from '@/pages/purchases/PurchasesPage';
import SuppliersPage from '@/pages/suppliers/SuppliersPage';
import InventoryPage from '@/pages/inventory/InventoryPage';
import UsersPage from '@/pages/users/UsersPage.jsx';

// ==== หน้าใหม่ (POS/Delivery ที่เราใช้อยู่)
import BranchPOS from '@/pages/pos/branch/BranchPOS';
import ConsignmentPOS from '@/pages/pos/consignment/ConsignmentPOS';
import BranchDelivery from '@/pages/delivery/branch/BranchDelivery';
import ConsignmentDelivery from '@/pages/delivery/consignment/ConsignmentDelivery';

// Docs

import DeliveryNoteA4Page from '@/pages/delivery/DeliveryNoteA4Page.jsx'; // ⬅️ เพิ่มบรรทัดนี้

const BASENAME = import.meta.env.VITE_ROUTER_BASENAME || '/';

export default function App() {
  return (
    <BrowserRouter basename={BASENAME}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<PreAuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Protected root: ต้องล็อกอินก่อน ถึงจะเห็น AppShell + ทุกเพจด้านใน */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            {/* Dashboards */}
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/staff" element={<StaffDashboard />} />
            <Route path="/dashboard/consignment" element={<ConsignmentDashboard />} />

            {/* Base feature pages (เดิม) */}
            <Route path="/viewer/welcome" element={<QuoteViewerWelcome />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/branches" element={<BranchesPage />} />

            <Route path="/consignment" element={<ConsignmentManagerPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/suppliers" element={<SuppliersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/users" element={<UsersPage />} />

            {/* POS — แยกสองฝั่ง (ใช้ Outlet-pattern ครอบสิทธิ์) */}
            <Route element={<RequireAuth roles={['ADMIN', 'STAFF']} />}>
              <Route path="/pos/branch" element={<BranchPOS />} />
            </Route>
            <Route element={<RequireAuth roles={['ADMIN', 'CONSIGNMENT']} />}>
              <Route path="/pos/consignment" element={<ConsignmentPOS />} />
            </Route>

            {/* Delivery — แยกสองฝั่ง */}
            <Route element={<RequireAuth roles={['ADMIN', 'STAFF']} />}>
              <Route path="/delivery/branch" element={<BranchDelivery />} />
            </Route>
            <Route element={<RequireAuth roles={['ADMIN', 'CONSIGNMENT']} />}>
              <Route path="/delivery/consignment" element={<ConsignmentDelivery />} />
            </Route>

            {/* Docs */}
          </Route>
          <Route path="/delivery/:id/print" element={<DeliveryNoteA4Page />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">ไม่พบหน้าที่ต้องการ</div>} />
      </Routes>
    </BrowserRouter>
  );
}
