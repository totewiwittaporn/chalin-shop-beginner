import { BrowserRouter, Routes, Route } from "react-router-dom";

// หน้าไม่ต้องมี Navbar/Sidebar
import PreAuthLanding from "./pages/auth/PreAuthLanding";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

// เลย์เอาต์หลัก (มี Navbar + Sidebar)
import AppShell from "./components/layout/AppShell";

// ตัวจัดเส้นทางไปหน้า dashboard ตาม role
import DashboardRouter from "./pages/DashboardRouter";

// หน้าหลังล็อกอิน
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import StaffDashboard from "./pages/dashboard/StaffDashboard";
import ConsignmentDashboard from "./pages/dashboard/ConsignmentDashboard";
import QuoteViewerWelcome from "./pages/viewer/QuoteViewerWelcome";

// เอกสาร
import DocsHome from "./pages/docs/DocsHome";
import DeliveryDocs from "./pages/docs/DeliveryDocs";
import ConsaleDocs from "./pages/docs/ConsaleDocs";
import InvoiceDocs from "./pages/docs/InvoiceDocs";
import ReceiptDocs from "./pages/docs/ReceiptDocs";
import QuoteDocs from "./pages/docs/QuoteDocs";
import DocPreview from "./pages/docs/DocPreview";

export default function App() {
  return (
    <BrowserRouter /* ถ้าโฮสต์บน sub-path (เช่น GitHub Pages) ใส่ basename ให้ตรง */>
      <Routes>
        {/* ไม่ครอบเลย์เอาต์ */}
        <Route path="/" element={<PreAuthLanding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* ครอบด้วย AppShell → Navbar + Sidebar */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/dashboard/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/staff" element={<StaffDashboard />} />
          <Route path="/dashboard/consignment" element={<ConsignmentDashboard />} />

          <Route path="/viewer/welcome" element={<QuoteViewerWelcome />} />

          <Route path="/docs" element={<DocsHome />}>
            <Route path="deliveries" element={<DeliveryDocs />} />
            <Route path="consales" element={<ConsaleDocs />} />
            <Route path="invoices" element={<InvoiceDocs />} />
            <Route path="receipts" element={<ReceiptDocs />} />
            <Route path="quotes" element={<QuoteDocs />} />
          </Route>
          <Route path="/docs/:kind/:id" element={<DocPreview />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">ไม่พบหน้าที่ต้องการ</div>} />
      </Routes>
    </BrowserRouter>
  );
}
