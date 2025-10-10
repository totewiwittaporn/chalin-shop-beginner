// src/routes/RootLayout.jsx
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden grid md:grid-cols-[72px_1fr] lg:grid-cols-[16rem_1fr]">
      <Sidebar />
      <div className="min-w-0">
        <Navbar />
        <main className="py-6">
          <div className="mx-auto w-full max-w-[1200px] px-3 md:px-4 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
