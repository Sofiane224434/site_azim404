import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext.jsx';
import MaintenanceScreen from '../components/MaintenanceScreen.jsx';

export default function NexusVPage() {
  const { sites, isAdmin } = useAdmin();
  const [bypassed, setBypassed] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('admin_bypass') || params.get('azim_admin_bypass') || params.get('bypass');
      const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];
      if (token && validKeys.includes(token.toLowerCase().trim())) {
        return true;
      }
      return localStorage.getItem('azim_maintenance_bypass') === 'true';
    }
    return false;
  });

  const nexusConfig = sites?.['nexus-v'] || {
    name: 'Nexus-V',
    domain: 'azim404.com/nexus-v',
    inMaintenance: false,
    title: 'Nexus-V en cours de mise à jour',
    message: 'La passerelle Nexus-V sous azim404.com est temporairement en maintenance.',
  };

  const inMaintenance = Boolean(nexusConfig.inMaintenance);
  const isDevAllowed = isAdmin || bypassed;

  if (inMaintenance && !isDevAllowed) {
    return (
      <MaintenanceScreen
        siteName="Nexus-V"
        title={nexusConfig.title || 'Nexus-V en cours de mise à jour'}
        message={nexusConfig.message || 'La passerelle Nexus-V sous azim404.com est temporairement en maintenance.'}
        onBypass={() => setBypassed(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition">
            &larr; azim404.com
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-sm font-bold text-white tracking-wide">Nexus-V</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
            Site secondaire
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            En ligne
          </span>
          <Link
            to="/admin"
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            Administration
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full space-y-8">
        <div className="space-y-3">
          <div className="inline-block text-xs font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded">
            Environnement applicatif secondaire
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Nexus-V — Passerelle de Services
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Plateforme secondaire déployée sous le sous-chemin officiel <code className="text-xs font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">azim404.com/nexus-v</code>. Ce service centralise les micro-outils, passerelles de test et fonctionnalités spécialisées sans nécessiter de configuration DNS séparée.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-500">TYPE D'HÉBERGEMENT</div>
            <div className="text-sm font-semibold text-white">Sous-chemin relatif</div>
            <div className="text-xs font-mono text-purple-400">azim404.com/nexus-v</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-500">CONTRÔLE ADMINISTRATEUR</div>
            <div className="text-sm font-semibold text-white">Gestion Dédiée</div>
            <div className="text-xs font-mono text-cyan-400">Mode Travaux ciblé</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="text-xs font-mono text-slate-500">CERTIFICAT & SÉCURITÉ</div>
            <div className="text-sm font-semibold text-white">Hérité du domaine racine</div>
            <div className="text-xs font-mono text-emerald-400">TLS 1.3 / HSTS</div>
          </div>
        </div>

        {/* Modules Section */}
        <div className="p-6 rounded-xl bg-slate-900/30 border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Modules & Passerelles Disponibles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-slate-200 font-semibold">Passerelle de supervision API</div>
              <div className="text-slate-400">Statut des endpoints internes et latence réseau.</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-slate-200 font-semibold">Console de synchronisation</div>
              <div className="text-slate-400">Gestion des bundles de contexte et métadonnées.</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        Azim404 Infrastructure — Nexus-V • azim404.com/nexus-v
      </footer>
    </div>
  );
}
