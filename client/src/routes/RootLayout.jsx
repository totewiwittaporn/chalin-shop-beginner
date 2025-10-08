import Navbar from '../components/layout/Navbar.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import AppShell from '../components/layout/AppShell.jsx';
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <>
      <Navbar />
      <AppShell sidebar={<Sidebar />}>
        <Outlet />
      </AppShell>
    </>
  );
}
