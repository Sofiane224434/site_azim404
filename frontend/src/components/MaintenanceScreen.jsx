import { useState } from 'react';

export default function MaintenanceScreen({
  siteName = 'Sofiane Kherarfa',
  message = "Le site est actuellement en cours de mise à jour et d'optimisation. Nous serons de retour très prochainement.",
  onBypass = null,
}) {
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassKey, setBypassKey] = useState('');
  const [bypassError, setBypassError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('sb.kherarfa@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBypassSubmit = (e) => {
    e.preventDefault();
    const cleanKey = (bypassKey || '').trim().toLowerCase();
    const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];

    if (validKeys.includes(cleanKey)) {
      localStorage.setItem('azim_maintenance_bypass', 'true');
      if (onBypass) {
        onBypass();
      } else {
        window.location.reload();
      }
    } else {
      setBypassError('Clé de dérogation invalide');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <img
            src="/images/logo_transparent.png"
            alt="Logo"
            className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <span className="font-extrabold text-lg tracking-wider text-gray-200">
            {siteName}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium tracking-wide">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>TRAVAUX EN COURS</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center my-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Cyber Icon */}
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <svg
                className="w-12 h-12 text-amber-400 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Améliorations en cours
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          {/* Status Card */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl max-w-lg mx-auto text-left space-y-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-3 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                INFRASTRUCTURE VPS ACTIVE
              </span>
              <span>AZIM404 CLUSTER</span>
            </div>

            <div className="space-y-2 text-sm text-gray-300">
              <p className="flex items-center gap-2">
                <span className="text-amber-400">▹</span>
                Déploiement de nouvelles versions et optimisations techniques.
              </p>
              <p className="flex items-center gap-2">
                <span className="text-cyan-400">▹</span>
                Une question urgente ou un projet à discuter ? Contactez-moi directement.
              </p>
            </div>

            {/* Direct Contact Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:sb.kherarfa@gmail.com"
                className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>Écrire à Sofiane</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors"
                title="Copier l'adresse email"
              >
                <span>sb.kherarfa@gmail.com</span>
                <span>{copied ? '✓' : '⧉'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer & Secret Bypass Button */}
      <footer className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 border-t border-white/5 gap-2">
        <div>© {new Date().getFullYear()} Azim404 • Sofiane Kherarfa. Tous droits réservés.</div>

        <button
          onClick={() => setShowBypassModal(true)}
          className="text-gray-600 hover:text-gray-400 font-mono text-[11px] flex items-center gap-1 transition-colors"
          title="Accès administrateur"
        >
          <span>Accès dérogation admin</span>
          <span>🔒</span>
        </button>
      </footer>

      {/* Bypass Modal */}
      {showBypassModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <span>🔒 Dérogation de Maintenance</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Entrez la clé administrateur pour prévisualiser le site sans la page de travaux.
            </p>

            <form onSubmit={handleBypassSubmit} className="space-y-4">
              <input
                type="password"
                value={bypassKey}
                onChange={(e) => {
                  setBypassKey(e.target.value);
                  setBypassError('');
                }}
                placeholder="Clé admin (ex: azim404)"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
                autoFocus
              />

              {bypassError && (
                <div className="text-xs text-rose-400 font-mono">{bypassError}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBypassModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 text-gray-300 text-xs font-medium hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  Débloquer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
