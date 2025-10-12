import { BrowserRouter, Routes, Route } from 'react-router-dom';

// หน้า public
import PreAuthLanding from '@/pages/auth/PreAuthLanding';
import Login from '@/pages/auth/Login';
import SignUp from '@/pages/auth/SignUp';

// เลย์เอาต์หลัก (Navbar + Sidebar)
import AppShell from '@/components/layout/AppShell';

// ตัวจัดเส้นทางไป dashboard ตาม role (router หลักของหน้า dashboard เท่านั้น)
import DashboardRouter from '@/pages/dashboard/DashboardRouter';

// หน้าภายใน
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import StaffDashboard from '@/pages/dashboard/StaffDashboard';
import ConsignmentDashboard from '@/pages/dashboard/ConsignmentDashboard';
import QuoteViewerWelcome from '@/pages/viewer/QuoteViewerWelcome';

import ProductsPage from '@/pages/products/ProductsPage';
import { BranchesPage, BranchSalesPage, BranchDeliveryPage } from '@/pages/branches';
import ConsignmentShopsPage from '@/pages/consignment/ConsignmentShopsPage';
import ConsignmentCategoriesPage from "@/pages/consignment/ConsignmentCategoriesPage";
import ConsignmentCategoryMappingPage from "@/pages/consignment/ConsignmentCategoryMappingPage";

// เอกสาร
import DocsHome from '@/pages/docs/DocsHome';
import DeliveryDocs from '@/pages/docs/DeliveryDocs';
import ConsaleDocs from '@/pages/docs/ConsaleDocs';
import InvoiceDocs from '@/pages/docs/InvoiceDocs';
import ReceiptDocs from '@/pages/docs/ReceiptDocs';
import QuoteDocs from '@/pages/docs/QuoteDocs';
import DocPreview from '@/pages/docs/DocPreview';

import RequireAuth from '@/components/auth/RequireAuth.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Public routes (ไม่ต้องล็อกอิน) ===== */}
        <Route path="/" element={<PreAuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* ===== Protected routes (ต้องมี token) ===== */}
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardRouter />} />
            <Route path="/dashboard/admin" element={<AdminDashboard />} />
            <Route path="/dashboard/staff" element={<StaffDashboard />} />
            <Route path="/dashboard/consignment" element={<ConsignmentDashboard />} />

            <Route path="/viewer/welcome" element={<QuoteViewerWelcome />} />

            <Route path="/products" element={<ProductsPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/branches/sales" element={<BranchSalesPage />} />
            <Route path="/branches/delivery" element={<BranchDeliveryPage />} />
            <Route path="/consignment/shops" element={<ConsignmentShopsPage />} />
            <Route path="/consignment/categories/mapping" element={<ConsignmentCategoryMappingPage />} />
            <Route path="/consignment/categories" element={<ConsignmentCategoriesPage />} />

            <Route path="/docs" element={<DocsHome />}>
              <Route path="deliveries" element={<DeliveryDocs />} />
              <Route path="consales" element={<ConsaleDocs />} />
              <Route path="invoices" element={<InvoiceDocs />} />
              <Route path="receipts" element={<ReceiptDocs />} />
              <Route path="quotes" element={<QuoteDocs />} />
            </Route>
            <Route path="/docs/:kind/:id" element={<DocPreview />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">ไม่พบหน้าที่ต้องการ</div>} />
      </Routes>
    </BrowserRouter>
  );
}
