import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar.jsx';
import Navbar from '../components/layout/Navbar.jsx';

export default function RootLayout() {
  return (
    <div className="grid md:grid-cols-[16rem_1fr]">
      <Sidebar />
      <div>
        <Navbar />
        <main className="container-app py-6 grid gap-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
