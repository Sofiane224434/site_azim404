import { useState } from 'react';
import { useAdmin } from '../contexts/AdminContext.jsx';

export default function AdminModal() {
  const {
    user,
    isAuthenticated,
    isAdmin,
    accounts,
    isModalOpen,
    closeModal,
    login,
    logout,
    createAccount,
    deleteAccount,
  } = useAdmin();

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin tabs & new user form state
  const [activeTab, setActiveTab] = useState('services'); // 'services' | 'accounts'
  const [newAcc, setNewAcc] = useState({ name: '', identifier: '', password: '', permissions: 'Accès Global' });
  const [newAccMsg, setNewAccMsg] = useState('');

  if (!isModalOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      if (!res.success) {
        setError(res.message || 'Identifiants incorrects');
      } else {
        setIdentifier('');
        setPassword('');
      }
    } catch {
      setError('Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = (e) => {
    e.preventDefault();
    setNewAccMsg('');
    const res = createAccount(newAcc);
    if (res.success) {
      setNewAccMsg('Compte privé créé avec succès !');
      setNewAcc({ name: '', identifier: '', password: '', permissions: 'Accès Global' });
      setTimeout(() => setNewAccMsg(''), 3000);
    } else {
      setNewAccMsg(`Erreur : ${res.message}`);
    }
  };

  const privateServices = [
    {
      name: 'Portfolio & Réalisations',
      url: 'https://sofiane-kherarfa.azim404.com',
      badge: 'En ligne',
      desc: 'Vitrine complète et projets de Sofiane Kherarfa',
    },
    {
      name: 'Cars X Battle',
      url: 'https://cxb.azim404.com',
      badge: 'Accès Restreint',
      desc: 'Application de combat automobile & API',
    },
    {
      name: 'WikisGuessr',
      url: 'https://wikisguessr.azim404.com',
      badge: 'Jeu Privé',
      desc: 'Jeu interactif basé sur Wikipédia',
    },
    {
      name: 'KulturDB',
      url: 'https://kulturdb.azim404.com',
      badge: 'Base de Données',
      desc: 'Catalogue et API culturelle',
    },
    {
      name: 'GaShooter',
      url: 'https://gashooter.azim404.com',
      badge: 'Arcade Déployé',
      desc: 'Jeu de tir spatial interactif',
    },
    ...(isAdmin
      ? [
          {
            name: 'Portainer VPS',
            url: 'https://51.210.244.46:9443',
            badge: 'Admin Port :9443',
            desc: 'Gestionnaire de conteneurs Docker VPS',
          },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={closeModal} />

      <div className="relative w-full max-w-xl bg-slate-950 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.25)] p-6 sm:p-8 z-10 text-gray-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
            <h3 className="font-mono text-sm sm:text-base font-bold text-white tracking-wider uppercase">
              {!isAuthenticated
                ? 'AUTHENTIFICATION PRIVÉE'
                : isAdmin
                ? 'CONSOLE D’ADMINISTRATION & GESTION'
                : 'ESPACE PRIVÉ AZIM404'}
            </h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-slate-900 transition-colors"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {!isAuthenticated ? (
          /* Login Form with Identifier and Password */
          <form onSubmit={handleLogin} className="space-y-4">
            <p className="text-xs sm:text-sm text-gray-300">
              Espace réservé. Connectez-vous avec vos identifiants pour déverrouiller l'accès privé.
            </p>

            <div>
              <label className="block text-xs font-mono uppercase text-cyan-300 mb-1">
                Identifiant (Email ou Pseudo)
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Ex : admin ou votre email..."
                autoFocus
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-cyan-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe..."
                required
                className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono text-sm"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-mono">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500 font-mono">
                Raccourci : Ctrl + Shift + A
              </span>
              <button
                type="submit"
                disabled={loading || !identifier || !password}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                {loading ? 'Connexion...' : 'Se Connecter →'}
              </button>
            </div>
          </form>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-5">
            {/* Session status banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-xs">●</span>
                <span className="text-xs sm:text-sm font-mono text-cyan-200">
                  {user.name} ({isAdmin ? 'Administrateur' : 'Accès Privé'})
                </span>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/50 text-xs text-gray-300 hover:text-red-300 transition-colors"
              >
                Déconnexion
              </button>
            </div>

            {/* Admin Tabs */}
            {isAdmin && (
              <div className="flex border-b border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`pb-2 px-3 border-b-2 font-semibold transition-colors ${
                    activeTab === 'services'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  SERVICES & VPS
                </button>
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`pb-2 px-3 border-b-2 font-semibold transition-colors ${
                    activeTab === 'accounts'
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  GESTION DES COMPTES ({accounts.length})
                </button>
              </div>
            )}

            {/* Services List Tab */}
            {(!isAdmin || activeTab === 'services') && (
              <div>
                <div className="text-xs font-mono uppercase text-gray-400 mb-2.5 tracking-wider">
                  Accès & Services Autorisés
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {privateServices.map((service) => (
                    <a
                      key={service.name}
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all group"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          <span>{service.name}</span>
                          <span className="text-xs text-gray-500 font-mono">↗</span>
                        </div>
                        <div className="text-xs text-gray-400">{service.desc}</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-950 border border-slate-700 text-cyan-300 font-mono">
                        {service.badge}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Accounts Management Tab (Admin only) */}
            {isAdmin && activeTab === 'accounts' && (
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {/* Create Account Form */}
                <form onSubmit={handleCreateAccount} className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-mono uppercase text-cyan-300 font-semibold">
                    Créer un nouveau compte privé
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nom / Pseudo"
                      value={newAcc.name}
                      onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Identifiant de connexion"
                      value={newAcc.identifier}
                      onChange={(e) => setNewAcc({ ...newAcc, identifier: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="password"
                      required
                      placeholder="Mot de passe"
                      value={newAcc.password}
                      onChange={(e) => setNewAcc({ ...newAcc, password: e.target.value })}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                    <button
                      type="submit"
                      className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                    >
                      + Ajouter le compte
                    </button>
                  </div>
                  {newAccMsg && (
                    <div className="text-xs font-mono text-cyan-300 mt-1">{newAccMsg}</div>
                  )}
                </form>

                {/* Existing Accounts List */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">
                    Comptes Actifs ({accounts.length})
                  </div>
                  {accounts.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-gray-500 text-center font-mono">
                      Aucun compte privé créé pour le moment.
                    </div>
                  ) : (
                    accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono"
                      >
                        <div>
                          <span className="text-white font-semibold">{acc.name}</span>
                          <span className="text-gray-400 ml-2">(@{acc.identifier})</span>
                          <span className="text-gray-500 text-[10px] ml-2">Créé le {acc.createdAt}</span>
                        </div>
                        <button
                          onClick={() => deleteAccount(acc.id)}
                          className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900 text-[11px] transition"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={closeModal}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 text-xs font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
