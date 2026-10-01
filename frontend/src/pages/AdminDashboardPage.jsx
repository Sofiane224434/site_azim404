import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext.jsx';
import MaintenanceScreen from '../components/MaintenanceScreen.jsx';

export default function AdminDashboardPage() {
  const {
    user,
    isAdmin,
    logout,
    accounts,
    createAccount,
    deleteAccount,
    siteStatus,
    toggleSiteMaintenance,
    refreshSiteStatus,
  } = useAdmin();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sites'); // 'sites', 'accounts', 'demos', 'system'

  // Maintenance messages editing state
  const [portfolioMsg, setPortfolioMsg] = useState(
    siteStatus.portfolio?.message || "Le site est actuellement en cours de mise à jour et d'optimisation. Nous serons de retour très prochainement."
  );
  const [azimMsg, setAzimMsg] = useState(
    siteStatus.azim404?.message || "Maintenance technique planifiée sur le portail Azim404."
  );

  // New account form state
  const [newId, setNewId] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newName, setNewName] = useState('');
  const [newPerm, setNewPerm] = useState('Accès Démos');
  const [accountMsg, setAccountMsg] = useState('');

  // Toast feedback
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Live preview modal for maintenance template
  const [previewSite, setPreviewSite] = useState(null); // 'portfolio' | 'azim404' | null

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleTogglePortfolio = async () => {
    const nextState = !siteStatus.portfolio?.inMaintenance;
    await toggleSiteMaintenance('portfolio', nextState, portfolioMsg);
    showToast(
      nextState
        ? '🚧 Mode Travaux activé pour sofiane-kherarfa.azim404.com !'
        : '🟢 sofiane-kherarfa.azim404.com est de nouveau EN LIGNE !'
    );
  };

  const handleToggleAzim = async () => {
    const nextState = !siteStatus.azim404?.inMaintenance;
    await toggleSiteMaintenance('azim404', nextState, azimMsg);
    showToast(
      nextState
        ? '🚧 Mode Travaux activé pour azim404.com !'
        : '🟢 azim404.com est de nouveau EN LIGNE !'
    );
  };

  const handleSavePortfolioMsg = async () => {
    await toggleSiteMaintenance('portfolio', siteStatus.portfolio?.inMaintenance, portfolioMsg);
    showToast('Message de maintenance mis à jour pour le portfolio');
  };

  const handleSaveAzimMsg = async () => {
    await toggleSiteMaintenance('azim404', siteStatus.azim404?.inMaintenance, azimMsg);
    showToast('Message de maintenance mis à jour pour Azim404');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountMsg('');
    const res = await createAccount({
      identifier: newId,
      password: newPass,
      name: newName,
      permissions: newPerm,
    });
    if (res.success) {
      showToast(`Compte privé "${newId}" créé avec succès !`);
      setNewId('');
      setNewPass('');
      setNewName('');
    } else {
      setAccountMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-sm font-medium shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center gap-3 animate-fade-in">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-white/10 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/images/logo_transparent.png"
                alt="Logo"
                className="w-7 h-7 object-contain drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              />
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                azim.404
              </span>
            </Link>

            <span className="hidden sm:inline-block text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
              CONSOLE ADMINISTRATION
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user?.name || user?.identifier}</span>
              <span className="text-gray-600">•</span>
              <span className="uppercase text-cyan-400">{user?.role || 'Membre'}</span>
            </div>

            <Link
              to="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white transition flex items-center gap-1.5"
            >
              <span>Site Public</span>
              <span>↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-200 transition font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 sm:px-6 flex gap-2 border-t border-white/5 overflow-x-auto">
          {[
            { id: 'sites', label: '⚡ Contrôle Sites & Mode Travaux', badge: null },
            { id: 'accounts', label: '👥 Comptes Privés', badge: accounts.length },
            { id: 'demos', label: '🚀 Démos & Projets Privés', badge: '3' },
            { id: 'system', label: '🖥️ Moniteur VPS & Services', badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-gray-300 border border-slate-700 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto px-4 sm:px-6 py-8">
        {/* TAB 1: SITES & MODE TRAVAUX */}
        {activeTab === 'sites' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Gestion des Sites & Mode Travaux en 1 Clic
                </h2>
                <p className="text-sm text-gray-400">
                  Activez ou désactivez le template de travaux instantanément. En mode travaux, vos visiteurs voient la page de maintenance avec votre message personnalisé.
                </p>
              </div>

              <button
                onClick={refreshSiteStatus}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-gray-300 hover:text-white transition flex items-center gap-2"
              >
                <span>↻</span>
                <span>Actualiser les statuts</span>
              </button>
            </div>

            {/* Sites Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Site 1: Portfolio (sofiane-kherarfa.azim404.com) */}
              <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                siteStatus.portfolio?.inMaintenance
                  ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-950/80 border-slate-800 shadow-xl'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                      Site Portfolio Vitrine
                    </span>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                      <span>sofiane-kherarfa.azim404.com</span>
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  {siteStatus.portfolio?.inMaintenance ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                      <span>🚧</span>
                      <span>EN TRAVAUX</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>EN LIGNE</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-6">
                  Contient vos compétences, la présentation complète de vos projets web et le formulaire de contact pro.
                </p>

                {/* Big 1-Click Toggle Button */}
                <div className="mb-6">
                  <button
                    onClick={handleTogglePortfolio}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 ${
                      siteStatus.portfolio?.inMaintenance
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {siteStatus.portfolio?.inMaintenance ? (
                      <>
                        <span className="text-lg">🟢</span>
                        <span>DÉSACTIVER LES TRAVAUX — REMETTRE EN LIGNE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🚧</span>
                        <span>ACTIVER LE MODE TRAVAUX EN 1 CLIC</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Message Customizer */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="block text-xs font-mono text-gray-300">
                    MESSAGE DU TEMPLATE DE TRAVAUX (VU PAR LES VISITEURS)
                  </label>
                  <textarea
                    rows={3}
                    value={portfolioMsg}
                    onChange={(e) => setPortfolioMsg(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-gray-200 text-xs focus:outline-none focus:border-amber-400 transition"
                    placeholder="Ex: Refonte complète en cours..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setPreviewSite('portfolio')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-gray-300 hover:text-white transition"
                    >
                      Aperçu du Template
                    </button>
                    <button
                      onClick={handleSavePortfolioMsg}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition"
                    >
                      Enregistrer message
                    </button>
                  </div>
                </div>
              </div>

              {/* Site 2: Azim404 Portal (azim404.com) */}
              <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                siteStatus.azim404?.inMaintenance
                  ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                  : 'bg-slate-950/80 border-slate-800 shadow-xl'
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                      Portail Principal & Passerelle
                    </span>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
                      <span>azim404.com</span>
                    </h3>
                  </div>

                  {/* Status Indicator */}
                  {siteStatus.azim404?.inMaintenance ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse">
                      <span>🚧</span>
                      <span>EN TRAVAUX</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>EN LIGNE</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-6">
                  Hub d'entrée digital, authentification privée et accès sécurisé aux services et démos.
                </p>

                {/* Big 1-Click Toggle Button */}
                <div className="mb-6">
                  <button
                    onClick={handleToggleAzim}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 ${
                      siteStatus.azim404?.inMaintenance
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                        : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {siteStatus.azim404?.inMaintenance ? (
                      <>
                        <span className="text-lg">🟢</span>
                        <span>DÉSACTIVER LES TRAVAUX — REMETTRE EN LIGNE</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🚧</span>
                        <span>ACTIVER LE MODE TRAVAUX EN 1 CLIC</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Message Customizer */}
                <div className="space-y-2 pt-4 border-t border-white/5">
                  <label className="block text-xs font-mono text-gray-300">
                    MESSAGE DU TEMPLATE DE TRAVAUX (VU PAR LES VISITEURS)
                  </label>
                  <textarea
                    rows={3}
                    value={azimMsg}
                    onChange={(e) => setAzimMsg(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-gray-200 text-xs focus:outline-none focus:border-amber-400 transition"
                    placeholder="Ex: Maintenance technique planifiée..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setPreviewSite('azim404')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-gray-300 hover:text-white transition"
                    >
                      Aperçu du Template
                    </button>
                    <button
                      onClick={handleSaveAzimMsg}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-medium transition"
                    >
                      Enregistrer message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTION DES COMPTES PRIVÉS */}
        {activeTab === 'accounts' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Gestion des Comptes d'Accès Privé
              </h2>
              <p className="text-sm text-gray-400">
                Créez des identifiants et mots de passe personnalisés pour donner accès à des espaces privés, des sites en avant-première ou des démos protégées.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Account Creation Form */}
              <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>+ Créer un nouvel accès</span>
                </h3>

                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">IDENTIFIANT</label>
                    <input
                      type="text"
                      value={newId}
                      onChange={(e) => setNewId(e.target.value)}
                      placeholder="ex: client-demo, recruteur..."
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">MOT DE PASSE</label>
                    <input
                      type="text"
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="mot de passe d'accès"
                      required
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">NOM OU RÉFÉRENCE</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ex: Démo Entreprise XYZ"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">DROITS / PERMISSIONS</label>
                    <select
                      value={newPerm}
                      onChange={(e) => setNewPerm(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="Accès Démos">Accès Démos & Projets</option>
                      <option value="Accès VIP">Accès VIP / Partenaire</option>
                      <option value="Testeur Privé">Testeur Privé</option>
                      <option value="Accès Complet">Accès Complet</option>
                    </select>
                  </div>

                  {accountMsg && (
                    <div className="text-xs text-rose-400 font-mono">{accountMsg}</div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    Générer et Enregistrer le Compte
                  </button>
                </form>
              </div>

              {/* Accounts Table */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Comptes Actifs ({accounts.length + 1})</h3>
                  <span className="text-xs text-gray-500 font-mono">Stockage persistant</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-gray-400 font-mono">
                        <th className="py-3 px-3">IDENTIFIANT</th>
                        <th className="py-3 px-3">RÉFÉRENCE</th>
                        <th className="py-3 px-3">RÔLE</th>
                        <th className="py-3 px-3">DATE</th>
                        <th className="py-3 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {/* Master Admin Row */}
                      <tr className="bg-cyan-950/20 font-medium">
                        <td className="py-3 px-3 text-cyan-300 font-mono flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>admin (Master)</span>
                        </td>
                        <td className="py-3 px-3 text-gray-300">Sofiane Kherarfa</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                            SUPER ADMIN
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500 font-mono">Permanent</td>
                        <td className="py-3 px-3 text-right text-gray-500 text-[11px] italic">
                          Protégé
                        </td>
                      </tr>

                      {/* Custom Accounts Rows */}
                      {accounts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                            Aucun compte invité supplémentaire créé. Utilisez le formulaire à gauche pour en créer.
                          </td>
                        </tr>
                      ) : (
                        accounts.map((acc) => (
                          <tr key={acc.id} className="hover:bg-slate-900/50 transition">
                            <td className="py-3 px-3 font-mono text-white">{acc.identifier}</td>
                            <td className="py-3 px-3 text-gray-300">{acc.name || '-'}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-gray-300 border border-slate-700 text-[10px]">
                                {acc.permissions || 'Membre'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-500 font-mono">{acc.createdAt || '-'}</td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => {
                                  if (confirm(`Supprimer l'accès pour "${acc.identifier}" ?`)) {
                                    deleteAccount(acc.id);
                                    showToast(`Compte "${acc.identifier}" supprimé`);
                                  }
                                }}
                                className="text-rose-400 hover:text-rose-300 font-mono text-xs underline"
                              >
                                Révoquer
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DÉMOS & PROJETS PRIVÉS */}
        {activeTab === 'demos' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Démos & Applications Réservées
              </h2>
              <p className="text-sm text-gray-400">
                Accès direct aux microservices et interfaces réservées aux utilisateurs authentifiés.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Nexus Discord Manager',
                  desc: 'Tableau de bord et gestionnaire des bots communautaires.',
                  port: '3005',
                  url: '/private/nexus',
                  tag: 'Interne',
                },
                {
                  title: 'WikisGuessr',
                  desc: 'Jeu multijoueur interactif basé sur Wikipedia et Docker.',
                  port: '3010',
                  url: 'https://wikisguessr.azim404.com',
                  tag: 'Projet Démo',
                },
                {
                  title: 'Cars-X-Battle',
                  desc: 'Plateforme et simulateur compétitif web.',
                  port: '3013',
                  url: 'https://cars-x-battle.azim404.com',
                  tag: 'Projet Démo',
                },
              ].map((demo, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {demo.tag}
                      </span>
                      <span className="text-xs font-mono text-gray-500">Port {demo.port}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{demo.title}</h3>
                    <p className="text-xs text-gray-400">{demo.desc}</p>
                  </div>

                  <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-700 hover:border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <span>Lancer l'application</span>
                    <span>↗</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTÈME VPS */}
        {activeTab === 'system' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Supervision Système & Nginx VPS
              </h2>
              <p className="text-sm text-gray-400">
                Statuts des conteneurs Docker et des certificats SSL sur le serveur principal (51.210.244.46).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { name: 'azim404.com (Portail)', port: '3001', status: 'En ligne', ssl: 'Let’s Encrypt Valide' },
                { name: 'sofiane-kherarfa (Portfolio)', port: '3002', status: 'En ligne', ssl: 'Let’s Encrypt Valide' },
                { name: 'Azim API Hub', port: '5000', status: 'En ligne', ssl: 'Interne Nginx' },
                { name: 'Nginx Host Proxy', port: '443 / 80', status: 'Actif', ssl: 'HTTP/2 + TLS 1.3' },
              ].map((srv, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-gray-400">Port {srv.port}</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {srv.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{srv.name}</div>
                  <div className="text-[11px] font-mono text-cyan-400/80">{srv.ssl}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Preview Modal for Maintenance Screen */}
      {previewSite && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex justify-between items-center">
            <span className="text-xs font-mono text-amber-400 flex items-center gap-2">
              <span>👁</span>
              <span>Aperçu en direct du template de travaux pour : <strong>{previewSite}</strong></span>
            </span>
            <button
              onClick={() => setPreviewSite(null)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-gray-200 transition font-mono"
            >
              ✕ Fermer l'aperçu
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MaintenanceScreen
              siteName={previewSite === 'portfolio' ? 'Sofiane Kherarfa (Portfolio)' : 'Azim.404'}
              message={previewSite === 'portfolio' ? portfolioMsg : azimMsg}
              onBypass={() => setPreviewSite(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
