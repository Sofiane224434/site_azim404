import { useState, useEffect } from 'react';

export default function MaintenanceScreen({
  siteName = 'Sofiane Kherarfa',
  title = 'Atelier en cours de rénovation',
  message = "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants.",
  onBypass = null,
}) {
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassKey, setBypassKey] = useState('');
  const [bypassError, setBypassError] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-detect magic bypass parameter in URL (?admin_bypass=azim404 ou ?azim_admin_bypass=azim404)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bypassParam = params.get('admin_bypass') || params.get('azim_admin_bypass') || params.get('bypass');
    const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];

    if (bypassParam && validKeys.includes(bypassParam.toLowerCase().trim())) {
      localStorage.setItem('azim_maintenance_bypass', 'true');
      document.cookie = 'azim_maintenance_bypass=true; path=/; max-age=2592000; SameSite=Lax';

      // Nettoie l'URL sans recharger
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);

      if (onBypass) {
        onBypass();
      } else {
        window.location.reload();
      }
    }
  }, [onBypass]);

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
      document.cookie = 'azim_maintenance_bypass=true; path=/; max-age=2592000; SameSite=Lax';
      if (onBypass) {
        onBypass();
      } else {
        window.location.reload();
      }
    } else {
      setBypassError('Clé administrateur incorrecte');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-amber-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 w-full px-6 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <img
              src="/images/logo_transparent.png"
              alt="Logo"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white block">
              {siteName}
            </span>
            <span className="text-[11px] font-mono text-gray-400">
              Espace Créatif & Développement
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.2)]">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>PAUSE TECHNIQUE</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center my-auto">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Animated Personal Badge */}
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border border-cyan-500/40 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.25)]">
                <span className="text-3xl select-none">⚡</span>
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
              </span>
            </div>

            <div className="px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-cyan-300">
              Sofiane Kherarfa • Développeur Full Stack
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {title}
            </h1>
            <p className="text-gray-300 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              {message}
            </p>
          </div>

          {/* Warm Personal Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-white/10 backdrop-blur-2xl max-w-xl mx-auto text-left space-y-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-gray-400 border-b border-white/5 pb-3 font-mono">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>En direct de l'établi</span>
              </span>
              <span className="text-cyan-400">Azim404 Lab</span>
            </div>

            <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
              <p className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold">▹</span>
                <span>
                  Je retravaille l'expérience, le design et les fonctionnalités de cette page.
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <span className="text-cyan-400 font-bold">▹</span>
                <span>
                  Un projet à concevoir ou besoin d'échanger ? Vous pouvez m'écrire directement :
                </span>
              </p>
            </div>

            {/* Direct Contact Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:sb.kherarfa@gmail.com"
                className="flex-1 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)]"
              >
                <span>✉️ Écrire à Sofiane</span>
              </a>

              <button
                type="button"
                onClick={handleCopyEmail}
                className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 transition-colors"
                title="Copier mon email pro"
              >
                <span>sb.kherarfa@gmail.com</span>
                <span className="text-cyan-400">{copied ? '✓ Copié' : '⧉'}</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-gray-500">
              <span>Projets open-source disponibles sur GitHub :</span>
              <a
                href="https://github.com/Sofiane224434"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline font-mono"
              >
                github.com/Sofiane224434 ↗
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer & Discreet Bypass Button */}
      <footer className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 border-t border-white/5 gap-2">
        <div>
          © {new Date().getFullYear()} Sofiane Kherarfa • Azim404. Fait avec passion.
        </div>

        <button
          onClick={() => setShowBypassModal(true)}
          className="text-gray-600 hover:text-gray-400 font-mono text-[11px] flex items-center gap-1.5 transition-colors p-1"
          title="Dérogation Administrateur"
        >
          <span>Accès développeur</span>
          <span>🔒</span>
        </button>
      </footer>

      {/* Bypass Modal Dialog */}
      {showBypassModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-950 border border-slate-700 rounded-3xl p-6 sm:p-7 shadow-2xl relative space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🔑 Accès Développeur</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Entrez votre clé administrateur pour lever la maintenance et accéder au site normalement.
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
                autoFocus
              />

              {bypassError && (
                <div className="text-xs text-rose-400 font-mono">{bypassError}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBypassModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-gray-300 text-xs font-medium hover:bg-slate-800 border border-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Débloquer l'accès
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
