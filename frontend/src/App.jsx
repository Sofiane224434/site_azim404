import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import AdminModal from './components/AdminModal.jsx';

function AdminRouteTrigger() {
  const location = useLocation();
  const { openModal } = useAdmin();

  useEffect(() => {
    if (location.pathname === '/admin' || location.pathname === '/login') {
      openModal();
    }
  }, [location.pathname, openModal]);

  return null;
}

function AppContent() {
  return (
    <>
      <AdminRouteTrigger />
      <AdminModal />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Home />} />
          <Route path="/login" element={<Home />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
