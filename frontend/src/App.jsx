import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import MaintenanceScreen from './components/MaintenanceScreen.jsx';

function ProtectedAdminRoute() {
  const { isAuthenticated } = useAdmin();
  return isAuthenticated ? <AdminDashboardPage /> : <AdminLoginPage />;
}

function PublicHome() {
  const { siteStatus, isAdmin } = useAdmin();
  const [bypassed, setBypassed] = useState(() => {
    return localStorage.getItem('azim_maintenance_bypass') === 'true';
  });

  const inMaintenance = siteStatus.azim404?.inMaintenance;

  // If in maintenance and user is not admin and not bypassed, show maintenance template
  if (inMaintenance && !isAdmin && !bypassed) {
    return (
      <MaintenanceScreen
        siteName="Azim.404"
        message={siteStatus.azim404?.message}
        onBypass={() => setBypassed(true)}
      />
    );
  }

  return (
    <MainLayout>
      <Home />
    </MainLayout>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/admin" element={<ProtectedAdminRoute />} />
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/auth" element={<AdminLoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}
