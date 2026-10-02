import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider, useAdmin } from './contexts/AdminContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import Home from './pages/Home.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';
import NexusVPage from './pages/NexusVPage.jsx';
import MaintenanceScreen from './components/MaintenanceScreen.jsx';

function ProtectedAdminRoute() {
  const { isAuthenticated } = useAdmin();
  return isAuthenticated ? <AdminDashboardPage /> : <AdminLoginPage />;
}

function PublicHome() {
  const { sites, isAdmin } = useAdmin();
  const [bypassed, setBypassed] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('admin_bypass') || params.get('azim_admin_bypass') || params.get('bypass');
      const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];
      if (token && validKeys.includes(token.toLowerCase().trim())) {
        localStorage.setItem('azim_maintenance_bypass', 'true');
        document.cookie = 'azim_maintenance_bypass=true; path=/; max-age=2592000; SameSite=Lax';
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        return true;
      }
      return localStorage.getItem('azim_maintenance_bypass') === 'true';
    }
    return false;
  });

  const azimConfig = sites?.azim404 || {};
  const inMaintenance = azimConfig.inMaintenance;

  // Verification du ciblage de pages
  const isTargetedPage = () => {
    if (!inMaintenance) return false;
    if (azimConfig.scope === 'SPECIFIC' && azimConfig.targetPages) {
      const currentPath = (window.location.pathname || '/').toLowerCase();
      const paths = azimConfig.targetPages
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
      return paths.some((p) => currentPath.startsWith(p));
    }
    return true; // 'ALL' par défaut
  };

  const isDevAllowed = isAdmin || bypassed;

  // If in maintenance and user is not admin and not bypassed, show maintenance template
  if (isTargetedPage() && !isDevAllowed) {
    return (
      <MaintenanceScreen
        siteName="Azim.404"
        title={azimConfig.title || 'Portail en cours de maintenance'}
        message={azimConfig.message || "Je prépare de nouvelles passerelles et des outils d'infrastructure sur Azim404. On se retrouve très vite !"}
        onBypass={() => setBypassed(true)}
      />
    );
  }

  return (
    <MainLayout>
      {/* Badge indicateur discret lorsque Sofiane est en mode developpeur sur son propre portail */}
      {isDevAllowed && inMaintenance && (
        <div className="fixed bottom-4 left-4 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 select-none animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Mode Développeur Actif (Portail en travaux)</span>
          <button
            onClick={() => {
              localStorage.removeItem('azim_maintenance_bypass');
              setBypassed(false);
            }}
            className="ml-1 text-[11px] underline text-gray-400 hover:text-white"
            title="Revenir en vue visiteur maintenance"
          >
            Quitter
          </button>
        </div>
      )}
      <Home />
    </MainLayout>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/nexus-v" element={<NexusVPage />} />
      <Route path="/nexus-v/*" element={<NexusVPage />} />
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
