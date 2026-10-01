const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../portfolio/frontend/src/App.jsx');

const code = `import { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';
import Footer from './components/Footer';
import MaintenanceScreen from './components/MaintenanceScreen';

function App() {
  const [siteConfig, setSiteConfig] = useState(null);
  const [bypassed, setBypassed] = useState(() => {
    // 1. Verification auto bypass URL (?admin_bypass=azim404 ou ?bypass=azim404)
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

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const hostname = window.location.hostname || 'sofiane-kherarfa.azim404.com';
    const queryUrl = \`https://azim404.com/api/site-status/lookup?domain=\${encodeURIComponent(hostname)}\`;

    fetch(queryUrl, {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          setSiteConfig(data);
        }
      })
      .catch(() => {
        // En cas de reseau hors ligne, autorise l'affichage normal
      })
      .finally(() => clearTimeout(timeoutId));

    return () => clearTimeout(timeoutId);
  }, []);

  // Verification du ciblage (Tout le site OU pages specifiques)
  const isTargetedPage = () => {
    if (!siteConfig || !siteConfig.inMaintenance) return false;
    if (siteConfig.scope === 'ALL') return true;

    if (siteConfig.scope === 'SPECIFIC' && siteConfig.targetPages) {
      const currentPath = (window.location.pathname || '/').toLowerCase();
      const paths = siteConfig.targetPages
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      return paths.some((p) => currentPath.startsWith(p));
    }

    return true;
  };

  const shouldShowMaintenance = isTargetedPage() && !bypassed;

  if (shouldShowMaintenance) {
    return (
      <MaintenanceScreen
        siteName={siteConfig?.name || 'Sofiane Kherarfa'}
        title={siteConfig?.title || 'Atelier en cours de rénovation'}
        message={siteConfig?.message || "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants."}
        onBypass={() => setBypassed(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 selection:bg-cyan-500 selection:text-black relative">
      {/* Badge indicateur discret lorsque Sofiane est en mode developpeur bypass */}
      {bypassed && siteConfig?.inMaintenance && (
        <div className="fixed bottom-4 left-4 z-50 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono shadow-2xl backdrop-blur-md flex items-center gap-2 select-none animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Mode Développeur Actif (Public en maintenance)</span>
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

      <Header />
      <main>
        <Hero />
        <About />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated portfolio/frontend/src/App.jsx with dynamic domain lookup, page scope targeting, and dev bypass');
