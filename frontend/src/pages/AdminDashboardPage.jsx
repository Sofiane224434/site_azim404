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
    portfolioProjects,
    savePortfolioProject,
    deletePortfolioProject,
    updateMyCredentials,
    refreshSites,
    refreshPortfolioProjects,
  } = useAdmin();

  const navigate = useNavigate();
  // Tabs: 'projects' (merged Projets, Démos & Travaux), 'accounts' (Comptes & Mon Profil), 'system' (Supervision)
  const [activeTab, setActiveTab] = useState('projects');

  // Modals & forms
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [previewSite, setPreviewSite] = useState(null);

  // New project / site form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStack, setNewStack] = useState('');
  const [newBadge, setNewBadge] = useState('En ligne');
  const [newLink, setNewLink] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [newScope, setNewScope] = useState('ALL');
  const [newTargetPages, setNewTargetPages] = useState('');
  const [newMaintenanceTitle, setNewMaintenanceTitle] = useState('Atelier en cours de rénovation');
  const [newMaintenanceMessage, setNewMaintenanceMessage] = useState(
    "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants."
  );

  // Profile credentials form
  const [myNewId, setMyNewId] = useState('');
  const [myNewPass, setMyNewPass] = useState('');
  const [myName, setMyName] = useState(user?.name || '');
  const [profileMsg, setProfileMsg] = useState('');

  // New account form state
  const [newAccId, setNewAccId] = useState('');
  const [newAccPass, setNewAccPass] = useState('');
  const [newAccName, setNewAccName] = useState('');
  const [newAccPerm, setNewAccPerm] = useState('Accès Démos');
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

  // Add new project/site
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const cleanDomain = (newDomain || (newLink ? new URL(newLink.startsWith('http') ? newLink : `https://${newLink}`).hostname : '')).trim().toLowerCase();

    // 1. Save to portfolio showcase
    const projectRes = await savePortfolioProject({
      title: newTitle,
      description: newDesc,
      technologies: newStack.split(',').map((s) => s.trim()).filter(Boolean),
      badge: newBadge,
      link: newLink,
      domain: cleanDomain,
    });

    // 2. If has domain, also register in site status controller
    if (cleanDomain) {
      await saveSiteConfig({
        id: projectRes.project?.id || cleanDomain.replace(/[^a-z0-9_-]/gi, '_'),
        name: newTitle,
        domain: cleanDomain,
        scope: newScope,
        targetPages: newTargetPages,
        title: newMaintenanceTitle,
        message: newMaintenanceMessage,
        inMaintenance: false,
      });
    }

    showToast(`Projet / Site "${newTitle}" ajouté avec succès !`);
    setShowAddProjectModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewStack('');
    setNewLink('');
    setNewDomain('');
  };

  // Update own credentials
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const res = await updateMyCredentials({
      newIdentifier: myNewId,
      newPassword: myNewPass,
      name: myName,
    });
    if (res.success) {
      showToast('Vos identifiants ont été mis à jour avec succès !');
      setProfileMsg('✓ Identifiants modifiés et session synchronisée.');
      setMyNewId('');
      setMyNewPass('');
    } else {
      setProfileMsg(`⚠ ${res.message}`);
    }
  };

  // Create new private visitor account
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setAccountMsg('');
    const res = await createAccount({
      identifier: newAccId,
      password: newAccPass,
      name: newAccName,
      permissions: newAccPerm,
    });
    if (res.success) {
      showToast(`Compte privé "${newAccId}" créé avec succès !`);
      setNewAccId('');
      setNewAccPass('');
      setNewAccName('');
    } else {
      setAccountMsg(res.message);
    }
  };

  // Combine portfolio projects and custom sites into unified cards list
  const combinedList = [];
  const registeredDomains = new Set();

  // 1. First add portfolio projects
  for (const proj of portfolioProjects) {
    const domainKey = (proj.domain || (proj.link ? new URL(proj.link.startsWith('http') ? proj.link : `https://${proj.link}`).hostname : '')).toLowerCase();
    const siteConfig = domainKey ? (sites[proj.id] || Object.values(sites).find((s) => s.domain?.toLowerCase() === domainKey)) : null;

    combinedList.push({
      isProject: true,
      id: proj.id,
      title: proj.title,
      description: proj.description,
      technologies: proj.technologies || [],
      badge: proj.badge || 'En ligne',
      link: proj.link,
      image: proj.image,
      domain: domainKey || proj.domain || '',
      siteConfig: siteConfig || {
        id: proj.id,
        inMaintenance: false,
        scope: 'ALL',
        targetPages: '',
        title: 'Atelier en cours de rénovation',
        message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...",
      },
    });

    if (domainKey) registeredDomains.add(domainKey);
  }

  // 2. Add sites not present in projects (like azim404.com or custom domains)
  for (const [key, site] of Object.entries(sites || {})) {
    if (!registeredDomains.has(site.domain?.toLowerCase()) && key !== 'portfolio') {
      combinedList.push({
        isProject: false,
        id: site.id || key,
        title: site.name || site.domain,
        description: site.message || "Passerelle et service hébergé sur l'infrastructure Azim404.",
        technologies: ['Infrastructure VPS', 'Docker', 'SSL'],
        badge: site.inMaintenance ? 'En travaux' : 'Actif',
        link: `https://${site.domain}/`,
        domain: site.domain,
        siteConfig: site,
      });
    }
  }

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
          {/* Integrated Flawless Logo Brand */}
          <div className="flex items-center gap-4">
            <Link to="/" className="group flex items-center select-none" title="Retour à l'accueil Azim404">
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center">
                <img
                  src="/images/logo_transparent.png"
                  alt="A"
                  className="h-[1.18em] w-auto object-contain inline-block -mr-1 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform"
                />
                <span>zim.404</span>
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

        {/* Unified Tab Navigation */}
        <div className="container mx-auto px-4 sm:px-6 flex gap-2 border-t border-white/5 overflow-x-auto">
          {[
            { id: 'projects', label: '🚀 Démos, Projets & Mode Travaux', badge: combinedList.length },
            { id: 'accounts', label: '👥 Comptes & Mon Profil', badge: accounts.length + 1 },
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
        {/* UNIFIED TAB: PROJETS, DÉMOS & TRAVAUX */}
        {activeTab === 'projects' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Gestion des Démos, Projets & Mode Travaux
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Modifiez directement les projets de votre portfolio (titre, description, stack, badge), pilotez le mode travaux en 1 clic et retirez les sites selon vos besoins.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAddProjectModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition flex items-center gap-2"
                >
                  <span>+ Ajouter un site ou projet</span>
                </button>
                <button
                  onClick={() => {
                    refreshSites();
                    refreshPortfolioProjects();
                    showToast('Données synchronisées avec le serveur');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-gray-300 hover:text-white transition flex items-center gap-1.5"
                  title="Actualiser depuis le serveur"
                >
                  <span>↻</span>
                </button>
              </div>
            </div>

            {/* Combined Unified Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {combinedList.map((item) => (
                <UnifiedProjectCard
                  key={item.id}
                  item={item}
                  onToggleMaintenance={async (siteId, nextState, patch) => {
                    await toggleSiteMaintenance(siteId, nextState, patch);
                    showToast(
                      nextState
                        ? `🚧 Mode Travaux activé pour ${item.title} !`
                        : `🟢 ${item.title} est de nouveau EN LIGNE !`
                    );
                  }}
                  onSaveProject={async (projData) => {
                    await savePortfolioProject(projData);
                    showToast(`Projet "${projData.title}" mis à jour sur le portfolio !`);
                  }}
                  onSaveSiteConfig={async (siteData) => {
                    await saveSiteConfig(siteData);
                    showToast(`Réglages de maintenance enregistrés pour ${siteData.domain}`);
                  }}
                  onDeleteProject={async (id) => {
                    if (confirm(`Retirer le projet "${item.title}" du portfolio ?`)) {
                      await deletePortfolioProject(id);
                      showToast(`Projet retiré du portfolio`);
                    }
                  }}
                  onDeleteSite={async (id) => {
                    if (confirm(`Retirer le site "${item.domain || item.title}" du gestionnaire ?`)) {
                      await removeSite(id);
                      showToast(`Site retiré du gestionnaire`);
                    }
                  }}
                  onPreview={() => setPreviewSite(item.siteConfig || item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: COMPTES & MON PROFIL */}
        {activeTab === 'accounts' && (
          <div className="space-y-10 animate-fade-in">
            {/* Section 1: Mon Compte (Changement Identifiant & Mot de passe) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🔒 Mon Profil & Sécurité</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Modifiez librement votre identifiant de connexion et votre mot de passe pour cet espace.
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-300">
                      NOUVEL IDENTIFIANT (ACTUEL : {user?.identifier})
                    </label>
                    <input
                      type="text"
                      value={myNewId}
                      onChange={(e) => setMyNewId(e.target.value)}
                      placeholder={user?.identifier}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-300">
                      NOUVEAU MOT DE PASSE
                    </label>
                    <input
                      type="password"
                      value={myNewPass}
                      onChange={(e) => setMyNewPass(e.target.value)}
                      placeholder="laisser vide pour ne pas changer"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">NOM D'AFFICHAGE</label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    placeholder="Votre nom ou pseudonyme"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {profileMsg && (
                  <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-500/30">
                    {profileMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Enregistrer mes nouveaux identifiants
                </button>
              </form>
            </div>

            {/* Section 2: Gestion des Comptes Privés (Admin Only) */}
            {isAdmin && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white">Gestion des Comptes Privés</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Générez des accès sur-mesure pour vos clients, recruteurs ou testeurs.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Account Creation Form */}
                  <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                    <h4 className="text-sm font-bold text-white">+ Créer un nouvel accès invité</h4>
                    <form onSubmit={handleCreateAccount} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-gray-400">IDENTIFIANT</label>
                        <input
                          type="text"
                          value={newAccId}
                          onChange={(e) => setNewAccId(e.target.value)}
                          placeholder="ex: client-demo..."
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-gray-400">MOT DE PASSE</label>
                        <input
                          type="text"
                          value={newAccPass}
                          onChange={(e) => setNewAccPass(e.target.value)}
                          placeholder="mot de passe"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-gray-400">RÉFÉRENCE / NOTE</label>
                        <input
                          type="text"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          placeholder="ex: Démo Entreprise XYZ"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-gray-400">PERMISSIONS</label>
                        <select
                          value={newAccPerm}
                          onChange={(e) => setNewAccPerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Accès Démos">Accès Démos & Projets</option>
                          <option value="Accès VIP">Accès VIP / Partenaire</option>
                          <option value="Testeur Privé">Testeur Privé</option>
                        </select>
                      </div>

                      {accountMsg && (
                        <div className="text-xs text-rose-400 font-mono">{accountMsg}</div>
                      )}

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                      >
                        Créer le compte
                      </button>
                    </form>
                  </div>

                  {/* Accounts Table */}
                  <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-white">Comptes Inscrits ({accounts.length + 1})</h4>
                      <span className="text-xs text-gray-500 font-mono">Stockage persistant</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-gray-400 font-mono">
                            <th className="py-2.5 px-3">IDENTIFIANT</th>
                            <th className="py-2.5 px-3">RÉFÉRENCE</th>
                            <th className="py-2.5 px-3">RÔLE</th>
                            <th className="py-2.5 px-3 text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          <tr className="bg-cyan-950/20 font-medium">
                            <td className="py-2.5 px-3 text-cyan-300 font-mono flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              <span>{user?.role === 'admin' ? user?.identifier : 'admin (Master)'}</span>
                            </td>
                            <td className="py-2.5 px-3 text-gray-300">Sofiane Kherarfa</td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                                SUPER ADMIN
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500 text-[11px] italic">
                              Protégé
                            </td>
                          </tr>

                          {accounts.map((acc) => (
                            <tr key={acc.id} className="hover:bg-slate-900/50 transition">
                              <td className="py-2.5 px-3 font-mono text-white">{acc.identifier}</td>
                              <td className="py-2.5 px-3 text-gray-300">{acc.name || '-'}</td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-gray-300 border border-slate-700 text-[10px]">
                                  {acc.permissions || 'Membre'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
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
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SUPERVISION VPS */}
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

      {/* Modal: Ajouter un nouveau site ou projet */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black text-white">Ajouter un Projet ou Site Web</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Apparaîtra sur sofiane-kherarfa.azim404.com avec contrôle de maintenance en un clic.
                </p>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="text-gray-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">TITRE DU PROJET</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: WikiGame, Nexus Portal..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brève description du projet..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">STACK TECHNOLOGIQUE (VIRGULES)</label>
                  <input
                    type="text"
                    value={newStack}
                    onChange={(e) => setNewStack(e.target.value)}
                    placeholder="React, Node.js, Docker"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">STATUS EN HAUT À DROITE</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="ex: En ligne, En dev, Démo..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">LIEN / URL COMPLÈTE</label>
                  <input
                    type="text"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://monsite.azim404.com/"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">NOM DE DOMAINE (TRAVAUX)</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="monsite.azim404.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-gray-300 text-xs font-medium hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Enregistrer le projet
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
                Aperçu en direct du template de travaux pour : <strong>{previewSite.domain || previewSite.title}</strong>
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
              siteName={previewSite.title || previewSite.name || 'Sofiane Kherarfa'}
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

// Composant Carte Unifiée : Projet Portfolio + Kill-Switch Travaux
function UnifiedProjectCard({
  item,
  onToggleMaintenance,
  onSaveProject,
  onSaveSiteConfig,
  onDeleteProject,
  onDeleteSite,
  onPreview,
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Editable Project info
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [technologies, setTechnologies] = useState((item.technologies || []).join(', '));
  const [badge, setBadge] = useState(item.badge || 'En ligne');
  const [link, setLink] = useState(item.link || '');

  // Maintenance info
  const siteConfig = item.siteConfig || {};
  const [inMaintenance, setInMaintenance] = useState(Boolean(siteConfig.inMaintenance));
  const [scope, setScope] = useState(siteConfig.scope || 'ALL');
  const [targetPages, setTargetPages] = useState(siteConfig.targetPages || '');
  const [mTitle, setMTitle] = useState(siteConfig.title || 'Atelier en cours de rénovation');
  const [mMessage, setMMessage] = useState(siteConfig.message || "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...");

  const bypassUrl = item.domain ? `https://${item.domain}/?admin_bypass=azim404` : item.link;

  const handleSaveAll = () => {
    // 1. Save project details
    if (item.isProject) {
      onSaveProject({
        id: item.id,
        title,
        description,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        badge,
        link,
        domain: item.domain,
      });
    }

    // 2. Save site maintenance details
    if (item.domain) {
      onSaveSiteConfig({
        id: siteConfig.id || item.id,
        name: title,
        domain: item.domain,
        scope,
        targetPages,
        title: mTitle,
        message: mMessage,
        inMaintenance,
      });
    }

    setIsEditing(false);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border transition-all flex flex-col justify-between ${
        siteConfig.inMaintenance
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
          : 'bg-slate-950/80 border-slate-800 shadow-xl'
      }`}
    >
      <div>
        {/* Card Header with Status Badge on Top Right */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                {item.domain || 'Projet Portfolio'}
              </span>
              {item.isProject && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  Vitrine Portfolio
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mt-1">{item.title}</h3>
          </div>

          {/* Status Badge in Top Right */}
          <div className="flex flex-col items-end gap-1.5">
            <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-semibold shadow-md">
              {item.badge}
            </span>

            {siteConfig.inMaintenance && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold animate-pulse">
                TRAVAUX ACTIFS
              </span>
            )}
          </div>
        </div>

        {/* Description & Stack */}
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Technologies Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {(item.technologies || []).map((tech, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-900 text-cyan-300/90 border border-slate-700/80 font-mono"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Quick Actions (Bypass + Launch) */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <a
            href={bypassUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono px-3 py-1 rounded-full bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 transition shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            title="Ouvrir le site avec votre dérogation administrateur active"
          >
            <span>⚡ Accéder (Bypass Actif)</span>
            <span>↗</span>
          </a>

          <a
            href={item.link || `https://${item.domain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white flex items-center gap-1.5 transition"
          >
            <span>Lien direct</span>
            <span>↗</span>
          </a>
        </div>

        {/* 1-Click Kill-Switch Maintenance Toggle */}
        <div className="mb-6">
          <button
            onClick={() => {
              const nextState = !siteConfig.inMaintenance;
              setInMaintenance(nextState);
              onToggleMaintenance(siteConfig.id || item.id, nextState, {
                title: mTitle,
                message: mMessage,
                scope,
                targetPages,
              });
            }}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2.5 ${
              siteConfig.inMaintenance
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]'
            }`}
          >
            {siteConfig.inMaintenance ? (
              <>
                <span>🟢</span>
                <span>DÉSACTIVER LES TRAVAUX — REMETTRE EN LIGNE</span>
              </>
            ) : (
              <>
                <span>🚧</span>
                <span>METTRE CE SITE EN TRAVAUX (1 CLIC)</span>
              </>
            )}
          </button>
        </div>

        {/* Edit Panel (Titre, Description, Stack, Status, Portée) */}
        <div className="pt-4 border-t border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-gray-400">ÉDITION & PARAMÈTRES</span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
            >
              {isEditing ? 'Fermer' : 'Modifier le projet / travaux'}
            </button>
          </div>

          {isEditing && (
            <div className="space-y-3.5 animate-fade-in bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">TITRE DU PROJET</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">DESCRIPTION (SUR LE PORTFOLIO)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400">STACK TECHNOLOGIQUE (VIRGULES)</label>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-gray-400">STATUS EN HAUT À DROITE</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">LIEN / URL</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Scope & maintenance message */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <label className="text-[11px] font-mono text-gray-400">PORTÉE DES TRAVAUX</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('ALL')}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono ${
                      scope === 'ALL'
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-gray-400'
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
                        : 'bg-slate-950 border-slate-800 text-gray-400'
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
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    placeholder="/projets, /contact"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-gray-400">MESSAGE DE TRAVAUX (POUR LES VISITEURS)</label>
                <textarea
                  rows={2}
                  value={mMessage}
                  onChange={(e) => setMMessage(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={handleSaveAll}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md"
              >
                Sauvegarder les modifications
              </button>
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
          <span>👁 Aperçu template travaux</span>
        </button>

        <div className="flex gap-3">
          {item.isProject && (
            <button
              onClick={() => onDeleteProject(item.id)}
              className="text-xs text-rose-400/80 hover:text-rose-300 transition font-mono underline"
            >
              Retirer du portfolio
            </button>
          )}

          {!item.isProject && item.id !== 'azim404' && (
            <button
              onClick={() => onDeleteSite(item.id)}
              className="text-xs text-rose-400/80 hover:text-rose-300 transition font-mono underline"
            >
              Retirer le site
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
