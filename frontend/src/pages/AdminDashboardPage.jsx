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
    sites,
    toggleSiteMaintenance,
    saveSiteConfig,
    removeSite,
    refreshSites,
  } = useAdmin();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sites'); // 'sites', 'accounts', 'demos', 'system'

  // Modals & Forms
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [previewSite, setPreviewSite] = useState(null); // Site object to preview

  // New site form state
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDomain, setNewSiteDomain] = useState('');
  const [newSiteScope, setNewSiteScope] = useState('ALL');
  const [newSitePages, setNewSitePages] = useState('');
  const [newSiteTitle, setNewSiteTitle] = useState('Atelier en cours de rénovation');
  const [newSiteMessage, setNewSiteMessage] = useState(
    "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants."
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCreateSite = async (e) => {
    e.preventDefault();
    if (!newSiteDomain.trim()) return;

    const res = await saveSiteConfig({
      name: newSiteName || newSiteDomain,
      domain: newSiteDomain,
      scope: newSiteScope,
      targetPages: newSitePages,
      title: newSiteTitle,
      message: newSiteMessage,
      inMaintenance: false,
    });

    if (res.success) {
      showToast(`Site "${newSiteDomain}" ajouté au gestionnaire !`);
      setShowAddSiteModal(false);
      setNewSiteName('');
      setNewSiteDomain('');
      setNewSitePages('');
    } else {
      alert(res.error || "Erreur lors de l'ajout du site");
    }
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

  const siteList = Object.values(sites || {});

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-sm font-medium shadow-[0_0_25px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center gap-3 animate-fade-in">
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
              ATELIER D'ADMINISTRATION
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
            { id: 'sites', label: '⚡ Contrôle des Sites & Travaux', badge: siteList.length },
            { id: 'accounts', label: '👥 Comptes Privés', badge: accounts.length },
            { id: 'demos', label: '🚀 Démos & Projets Privés', badge: '3' },
            { id: 'system', label: '🖥️ Supervision VPS', badge: null },
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
                  Contrôle des Sites & Mode Travaux
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Pilotez la maintenance en un clic, ciblez tout le site ou des pages spécifiques, et accédez-y vous-même sans blocage.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAddSiteModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition flex items-center gap-2"
                >
                  <span>+ Ajouter un site</span>
                </button>
                <button
                  onClick={refreshSites}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-gray-300 hover:text-white transition flex items-center gap-1.5"
                  title="Rafraîchir depuis le serveur"
                >
                  <span>↻</span>
                </button>
              </div>
            </div>

            {/* Sites Control Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {siteList.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onToggle={async (id, nextState, patch) => {
                    await toggleSiteMaintenance(id, nextState, patch);
                    showToast(
                      nextState
                        ? `🚧 Mode Travaux activé pour ${site.domain} !`
                        : `🟢 ${site.domain} est de nouveau EN LIGNE !`
                    );
                  }}
                  onSave={async (patch) => {
                    await saveSiteConfig({ ...site, ...patch });
                    showToast(`Configuration mise à jour pour ${site.domain}`);
                  }}
                  onDelete={async (id) => {
                    if (confirm(`Supprimer le site "${site.domain}" du gestionnaire ?`)) {
                      await removeSite(id);
                      showToast(`Site supprimé`);
                    }
                  }}
                  onPreview={() => setPreviewSite(site)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GESTION DES COMPTES PRIVÉS */}
        {activeTab === 'accounts' && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Comptes d'Accès Privé
              </h2>
              <p className="text-sm text-gray-400">
                Créez des identifiants et mots de passe sur-mesure pour donner accès à des démos ou espaces réservés.
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">RÉFÉRENCE / NOTE</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="ex: Démo Entreprise XYZ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">PERMISSIONS</label>
                    <select
                      value={newPerm}
                      onChange={(e) => setNewPerm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
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
                Démos & Projets Réservés
              </h2>
              <p className="text-sm text-gray-400">
                Accès direct aux microservices et applications hébergées sur le VPS.
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
                { name: 'Azim API Hub', port: '5005', status: 'En ligne', ssl: 'Interne Nginx' },
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

      {/* Modal: Ajouter un nouveau site via nom de domaine */}
      {showAddSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white">Ajouter un nouveau site</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Connectez un nouveau sous-domaine ou nom de domaine au gestionnaire de travaux.
                </p>
              </div>
              <button
                onClick={() => setShowAddSiteModal(false)}
                className="text-gray-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">NOM DU SITE</label>
                  <input
                    type="text"
                    value={newSiteName}
                    onChange={(e) => setNewSiteName(e.target.value)}
                    placeholder="ex: WikisGuessr App"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">NOM DE DOMAINE</label>
                  <input
                    type="text"
                    value={newSiteDomain}
                    onChange={(e) => setNewSiteDomain(e.target.value)}
                    placeholder="ex: wikisguessr.azim404.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Scope Selector */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-mono text-gray-300">PORTÉE DES TRAVAUX</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewSiteScope('ALL')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                      newSiteScope === 'ALL'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Tout le site web
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewSiteScope('SPECIFIC')}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-center transition ${
                      newSiteScope === 'SPECIFIC'
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                        : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    Pages spécifiques
                  </button>
                </div>
              </div>

              {newSiteScope === 'SPECIFIC' && (
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-mono text-amber-300">
                    PAGES CIBLÉES (SÉPARÉES PAR DES VIRGULES)
                  </label>
                  <input
                    type="text"
                    value={newSitePages}
                    onChange={(e) => setNewSitePages(e.target.value)}
                    placeholder="ex: /contact, /projets, /dashboard"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[11px] text-gray-500">
                    Seules ces pages afficheront le template de travaux ; les autres resteront accessibles.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">TITRE DU TEMPLATE</label>
                <input
                  type="text"
                  value={newSiteTitle}
                  onChange={(e) => setNewSiteTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">MESSAGE DE TRAVAUX</label>
                <textarea
                  rows={2}
                  value={newSiteMessage}
                  onChange={(e) => setNewSiteMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSiteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 text-xs font-medium hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Enregistrer le site
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal for Maintenance Screen */}
      {previewSite && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex justify-between items-center">
            <span className="text-xs font-mono text-amber-400 flex items-center gap-2">
              <span>👁</span>
              <span>
                Aperçu en direct du template de travaux pour : <strong>{previewSite.domain}</strong>
              </span>
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
              siteName={previewSite.name || previewSite.domain}
              title={previewSite.title || 'Atelier en cours de rénovation'}
              message={previewSite.message}
              onBypass={() => setPreviewSite(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Composant Carte Site individuel
function SiteCard({ site, onToggle, onSave, onDelete, onPreview }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(site.title || 'Atelier en cours de rénovation');
  const [message, setMessage] = useState(site.message || '');
  const [scope, setScope] = useState(site.scope || 'ALL');
  const [targetPages, setTargetPages] = useState(site.targetPages || '');

  // URL avec bypass magique automatique pour Sofiane
  const bypassUrl = `https://${site.domain}/?admin_bypass=azim404`;

  const isProtected = ['portfolio', 'azim404'].includes(site.id);

  const handleSaveEdits = () => {
    onSave({ title, message, scope, targetPages });
    setIsEditing(false);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border transition-all flex flex-col justify-between ${
        site.inMaintenance
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
          : 'bg-slate-950/80 border-slate-800 shadow-xl'
      }`}
    >
      <div>
        {/* Card Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
              {site.name}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{site.domain}</span>
            </h3>
          </div>

          {/* Status Badge */}
          {site.inMaintenance ? (
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

        {/* Scope Tag */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-gray-300">
            Portée : {site.scope === 'SPECIFIC' ? `Pages ciblées (${site.targetPages || 'non défini'})` : 'Tout le site'}
          </span>

          <a
            href={bypassUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title="Ouvrir le site avec votre dérogation administrateur active"
          >
            <span>⚡ Accéder (Bypass Actif)</span>
            <span>↗</span>
          </a>
        </div>

        {/* 1-Click Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => onToggle(site.id, !site.inMaintenance, { title, message, scope, targetPages })}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-3 ${
              site.inMaintenance
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]'
            }`}
          >
            {site.inMaintenance ? (
              <>
                <span className="text-base sm:text-lg">🟢</span>
                <span>DÉSACTIVER LES TRAVAUX — REMETTRE EN LIGNE</span>
              </>
            ) : (
              <>
                <span className="text-base sm:text-lg">🚧</span>
                <span>ACTIVER LE MODE TRAVAUX EN 1 CLIC</span>
              </>
            )}
          </button>
        </div>

        {/* Configuration details / Edit Form */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-gray-400">RÉGLAGES DU TEMPLATE</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
            >
              {isEditing ? 'Annuler' : 'Personnaliser'}
            </button>
          </div>

          {isEditing ? (
            <div className="space-y-3 animate-fade-in">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">PORTÉE</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('ALL')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono ${
                      scope === 'ALL'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    Tout le site
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('SPECIFIC')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono ${
                      scope === 'SPECIFIC'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-gray-400'
                    }`}
                  >
                    Pages spécifiques
                  </button>
                </div>
              </div>

              {scope === 'SPECIFIC' && (
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-amber-300">
                    PAGES CIBLÉES (ex: /projets, /contact)
                  </label>
                  <input
                    type="text"
                    value={targetPages}
                    onChange={(e) => setTargetPages(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    placeholder="/projets, /contact"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">TITRE DE L'ANNONCE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">MESSAGE DE TRAVAUX</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={handleSaveEdits}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition"
              >
                Enregistrer les réglages
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="font-semibold text-white">{site.title || 'Atelier en cours de rénovation'}</div>
              <div className="text-gray-400 line-clamp-2">{site.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="pt-4 mt-4 border-t border-white/5 flex justify-between items-center">
        <button
          onClick={onPreview}
          className="text-xs text-gray-400 hover:text-white transition font-mono flex items-center gap-1"
        >
          <span>👁 Aperçu template</span>
        </button>

        {!isProtected && (
          <button
            onClick={() => onDelete(site.id)}
            className="text-xs text-rose-400/80 hover:text-rose-300 transition font-mono underline"
          >
            Retirer le site
          </button>
        )}
      </div>
    </div>
  );
}
