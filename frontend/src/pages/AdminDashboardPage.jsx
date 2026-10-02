/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react';
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
    toggleProjectVisibility,
    deletePortfolioProject,
    updateMyCredentials,
    refreshSites,
    refreshPortfolioProjects,
  } = useAdmin();

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'security', 'accounts', 'context', 'system'

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
  const [newVisibleOnPortfolio, setNewVisibleOnPortfolio] = useState(true);
  const [newAllowContextSync, setNewAllowContextSync] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');

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
  const [newAccAllowedProjects, setNewAccAllowedProjects] = useState([]);
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

    const projectRes = await savePortfolioProject({
      title: newTitle,
      description: newDesc,
      technologies: newStack.split(',').map((s) => s.trim()).filter(Boolean),
      badge: newBadge,
      link: newLink,
      domain: cleanDomain,
      visibleOnPortfolio: newVisibleOnPortfolio,
      inMaintenance: false,
      allowContextSync: newAllowContextSync,
      folderName: newFolderName || undefined,
    });

    if (cleanDomain) {
      await saveSiteConfig({
        id: projectRes.project?.id || cleanDomain.replace(/[^a-z0-9_-]/gi, '_'),
        name: newTitle,
        domain: cleanDomain,
        scope: 'ALL',
        targetPages: '',
        title: 'Atelier en cours de rénovation',
        message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants.",
        inMaintenance: false,
      });
    }

    showToast(`Site / Projet "${newTitle}" ajouté avec succès`);
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
      showToast('Vos identifiants ont été mis à jour');
      setProfileMsg('Identifiants modifiés avec succès.');
      setMyNewId('');
      setMyNewPass('');
    } else {
      setProfileMsg(res.message);
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
      allowedProjects: newAccAllowedProjects,
    });
    if (res.success) {
      showToast(`Compte "${newAccId}" créé avec succès`);
      setNewAccId('');
      setNewAccPass('');
      setNewAccName('');
      setNewAccAllowedProjects([]);
    } else {
      setAccountMsg(res.message);
    }
  };

  const handleToggleProjectAccess = (projId) => {
    if (newAccAllowedProjects.includes(projId)) {
      setNewAccAllowedProjects(newAccAllowedProjects.filter((id) => id !== projId));
    } else {
      setNewAccAllowedProjects([...newAccAllowedProjects, projId]);
    }
  };

  // Combine portfolio projects and custom sites into unified list
  const combinedList = [];
  const registeredDomains = new Set();

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
      visibleOnPortfolio: proj.visibleOnPortfolio !== false,
      inMaintenance: Boolean(siteConfig?.inMaintenance || proj.inMaintenance),
      siteConfig: siteConfig || {
        id: proj.id,
        inMaintenance: Boolean(proj.inMaintenance),
        scope: 'ALL',
        targetPages: '',
        title: 'Atelier en cours de rénovation',
        message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...",
      },
    });

    if (domainKey) registeredDomains.add(domainKey);
  }

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
        visibleOnPortfolio: false,
        inMaintenance: Boolean(site.inMaintenance),
        siteConfig: site,
      });
    }
  }

  const displayedProjects = isAdmin
    ? combinedList
    : combinedList.filter((item) => (user?.allowedProjects || []).includes(item.id));

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-2 rounded-lg bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs font-medium shadow-lg backdrop-blur-md flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center select-none" title="Retour à l'accueil Azim404">
              <span className="text-lg font-bold tracking-tight text-white flex items-center">
                <img
                  src="/images/logo_transparent.png"
                  alt="A"
                  className="h-[1.15em] w-auto object-contain inline-block -mr-1"
                />
                <span>zim.404</span>
              </span>
            </Link>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              CONSOLE ADMINISTRATION
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-gray-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{user?.name || user?.identifier}</span>
              <span className="text-gray-600">•</span>
              <span className="uppercase text-cyan-400">{user?.role || 'Membre'}</span>
            </div>

            <Link
              to="/"
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white transition"
            >
              Site Public
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 transition"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-white/5 overflow-x-auto">
          {[
            { id: 'projects', label: 'Démos & Projets', badge: displayedProjects.length },
            { id: 'security', label: 'Audits & Tests', badge: displayedProjects.length },
            { id: 'accounts', label: 'Comptes & Profil', badge: isAdmin ? accounts.length + 1 : 1 },
            { id: 'context', label: 'Contexte Privé', badge: null },
            { id: 'system', label: 'Supervision VPS', badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2.5 px-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-gray-300 border border-slate-700 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* TAB 1: PROJETS & DÉMOS */}
        {activeTab === 'projects' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isAdmin ? 'Démos, Projets & Mode Travaux' : 'Vos Accès Privés & Démos'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isAdmin
                    ? 'Gestion des fiches de projets, visibilité portfolio et bascule des travaux en un clic.'
                    : 'Applications et démonstrations autorisées pour votre compte.'}
                </p>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium transition"
                  >
                    + Ajouter un projet
                  </button>
                  <button
                    onClick={() => {
                      refreshSites();
                      refreshPortfolioProjects();
                      showToast('Données synchronisées');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-gray-300 hover:text-white transition"
                    title="Actualiser depuis le serveur"
                  >
                    Actualiser
                  </button>
                </div>
              )}
            </div>

            {displayedProjects.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                <h3 className="text-sm font-semibold text-white">Aucun projet assigné</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Votre compte n'a pas encore de démonstrations spécifiques affectées.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {displayedProjects.map((item) => (
                  <UnifiedProjectCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onToggleMaintenance={async (siteId, nextState, patch) => {
                      await toggleSiteMaintenance(siteId, nextState, patch);
                      showToast(nextState ? `Mode Travaux activé pour ${item.title}` : `${item.title} est en ligne`);
                    }}
                    onTogglePortfolioVisibility={async (id, nextVisible) => {
                      await toggleProjectVisibility(id, nextVisible);
                      showToast(nextVisible ? `Affiché sur portfolio` : `Masqué du portfolio`);
                    }}
                    onSaveProject={async (projData) => {
                      await savePortfolioProject(projData);
                      showToast(`Projet mis à jour`);
                    }}
                    onSaveSiteConfig={async (siteData) => {
                      await saveSiteConfig(siteData);
                      showToast(`Réglages enregistrés`);
                    }}
                    onDeleteFromAdmin={async (id) => {
                      if (confirm(`Supprimer "${item.title}" de l'administration ?`)) {
                        if (item.isProject) await deletePortfolioProject(id);
                        await removeSite(id);
                        showToast(`Site supprimé`);
                      }
                    }}
                    onPreview={() => setPreviewSite(item.siteConfig || item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUDITS & TESTS QUALITÉ (Complet avec notes, 6 catégories et auto-analyse) */}
        {activeTab === 'security' && (
          <AuditTestsTab sites={displayedProjects} showToast={showToast} />
        )}

        {/* TAB 3: COMPTES & MON PROFIL */}
        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* SECTION A : MON PROFIL */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="border-b border-white/5 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Mon Profil & Identifiants</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Mettez à jour votre mot de passe et nom de session.</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase">
                    {user?.role || 'Membre'}
                  </span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">IDENTIFIANT DE CONNEXION</label>
                    <input
                      type="text"
                      value={myNewId}
                      onChange={(e) => setMyNewId(e.target.value)}
                      placeholder={user?.identifier}
                      className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[10px] text-gray-500">Actuel : {user?.identifier}. Laissez vide pour ne pas modifier.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">NOUVEAU MOT DE PASSE</label>
                    <input
                      type="password"
                      value={myNewPass}
                      onChange={(e) => setMyNewPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">NOM D'AFFICHAGE</label>
                    <input
                      type="text"
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder="Votre nom ou pseudonyme"
                      className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {profileMsg && (
                    <div className="text-xs font-mono text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                      {profileMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs transition"
                  >
                    Sauvegarder mes identifiants
                  </button>
                </form>
              </div>

              {/* SECTION B : CRÉATION D'ACCÈS (Admin Only) */}
              {isAdmin ? (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white">Créer un Compte & Affecter du Contenu</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Créez un compte privé et affectez-lui des projets spécifiques.</p>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">IDENTIFIANT</label>
                        <input
                          type="text"
                          value={newAccId}
                          onChange={(e) => setNewAccId(e.target.value)}
                          placeholder="identifiant"
                          required
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">MOT DE PASSE</label>
                        <input
                          type="text"
                          value={newAccPass}
                          onChange={(e) => setNewAccPass(e.target.value)}
                          placeholder="mot de passe"
                          required
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">NOM / RÉFÉRENCE</label>
                        <input
                          type="text"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          placeholder="Nom du contact"
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">RÔLE</label>
                        <select
                          value={newAccPerm}
                          onChange={(e) => setNewAccPerm(e.target.value)}
                          className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Accès Démos">Accès Démos Sélectionnées</option>
                          <option value="Client Privé">Client Privé</option>
                          <option value="Testeur">Testeur</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-mono text-cyan-300">
                          PROJETS AUTORISÉS ({newAccAllowedProjects.length}/{combinedList.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (newAccAllowedProjects.length === combinedList.length) {
                              setNewAccAllowedProjects([]);
                            } else {
                              setNewAccAllowedProjects(combinedList.map((c) => c.id));
                            }
                          }}
                          className="text-[10px] font-mono text-gray-400 hover:text-white"
                        >
                          {newAccAllowedProjects.length === combinedList.length ? 'Tout décocher' : 'Tout cocher'}
                        </button>
                      </div>

                      <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {combinedList.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-1 rounded hover:bg-slate-800/50 cursor-pointer text-xs select-none"
                          >
                            <input
                              type="checkbox"
                              checked={newAccAllowedProjects.includes(item.id)}
                              onChange={() => handleToggleProjectAccess(item.id)}
                              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span className="text-white truncate">{item.title}</span>
                            <span className="text-[10px] font-mono text-gray-500 ml-auto truncate">{item.domain || item.badge}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {accountMsg && <div className="text-xs text-rose-400 font-mono">{accountMsg}</div>}

                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs transition"
                    >
                      Créer le compte
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-gray-400">
                  <h4 className="font-semibold text-white text-sm mb-1">Gestion des Accès</h4>
                  <p>Votre compte est un compte membre privé. Seul l'administrateur peut créer ou modifier des accès.</p>
                </div>
              )}
            </div>

            {/* TABLEAU DES COMPTES */}
            {isAdmin && (
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Comptes configurés ({accounts.length + 1})</h3>
                  <span className="text-[11px] text-gray-500 font-mono">Stockage persistant</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-gray-400 font-mono text-[11px] bg-slate-900/40">
                        <th className="py-2.5 px-3">IDENTIFIANT</th>
                        <th className="py-2.5 px-3">NOM / RÉFÉRENCE</th>
                        <th className="py-2.5 px-3">RÔLE</th>
                        <th className="py-2.5 px-3">PROJETS ASSIGNÉS</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      <tr className="bg-cyan-950/10 font-medium">
                        <td className="py-2.5 px-3 text-cyan-300 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                          <span>{user?.identifier} (Actuel)</span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-300">{user?.name || 'Administrateur'}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px]">
                            SUPER ADMIN
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-mono text-[11px]">
                          Accès total ({combinedList.length} projets)
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500 text-[11px] italic">
                          Protégé
                        </td>
                      </tr>

                      {accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3 font-mono text-white">{acc.identifier}</td>
                          <td className="py-2.5 px-3 text-gray-300">{acc.name || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-gray-300 text-[10px]">
                              {acc.permissions || 'Membre'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 font-mono text-[11px]">
                            {Array.isArray(acc.allowedProjects) && acc.allowedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {acc.allowedProjects.map((pId) => (
                                  <span key={pId} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[10px]">
                                    {pId}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Aucun projet</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Supprimer l'accès pour "${acc.identifier}" ?`)) {
                                  deleteAccount(acc.id);
                                  showToast(`Compte supprimé`);
                                }
                              }}
                              className="text-rose-400 hover:text-rose-300 font-mono text-xs"
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
            )}
          </div>
        )}

        {/* TAB 4: CONTEXTE PRIVÉ & SYNCHRONISATION */}
        {activeTab === 'context' && (
          <ContextSyncTab showToast={showToast} />
        )}

        {/* TAB 5: SUPERVISION VPS */}
        {activeTab === 'system' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white">Supervision Système & Nginx VPS</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Statuts des conteneurs Docker et des certificats SSL sur le serveur principal (51.210.244.46).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: 'azim404.com (Portail)', port: '3001', status: 'En ligne', ssl: 'Let’s Encrypt Valide' },
                { name: 'sofiane-kherarfa (Portfolio)', port: '3002', status: 'En ligne', ssl: 'Let’s Encrypt Valide' },
                { name: 'Azim API Hub', port: '5005', status: 'En ligne', ssl: 'Interne Nginx' },
                { name: 'Nginx Host Proxy', port: '443 / 80', status: 'Actif', ssl: 'HTTP/2 + TLS 1.3' },
              ].map((srv, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-gray-400 text-[11px]">Port {srv.port}</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {srv.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white">{srv.name}</div>
                  <div className="text-[11px] font-mono text-cyan-400/80">{srv.ssl}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Ajouter un nouveau site ou projet */}
      {showAddProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-white/5 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Ajouter un Projet ou Site Web</h3>
                <p className="text-xs text-gray-400 mt-0.5">Contrôlable depuis l'admin avec son mode travaux en 1 clic.</p>
              </div>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="text-gray-400 hover:text-white p-1 text-sm font-mono"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">TITRE DU PROJET</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="ex: WikiGame, Nexus Portal..."
                  required
                  className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">DESCRIPTION (PORTFOLIO)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brève description du projet..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">STACK TECHNOLOGIQUE</label>
                  <input
                    type="text"
                    value={newStack}
                    onChange={(e) => setNewStack(e.target.value)}
                    placeholder="React, Node.js, Docker"
                    className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">STATUT BADGE</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="ex: En ligne, En dev..."
                    className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">LIEN / URL COMPLÈTE</label>
                  <input
                    type="text"
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    placeholder="https://monsite.azim404.com/"
                    className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">NOM DE DOMAINE (TRAVAUX)</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="monsite.azim404.com"
                    className="w-full h-8 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-white">Afficher sur le portfolio public</span>
                <input
                  type="checkbox"
                  checked={newVisibleOnPortfolio}
                  onChange={(e) => setNewVisibleOnPortfolio(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-gray-300 text-xs hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal for Maintenance Screen */}
      {previewSite && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center">
            <span className="text-xs font-mono text-gray-300">
              Aperçu travaux : <strong className="text-white">{previewSite.domain || previewSite.title}</strong>
            </span>
            <button
              onClick={() => setPreviewSite(null)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-gray-200 transition font-mono"
            >
              Fermer l'aperçu
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

// Composant Carte Unifiée
function UnifiedProjectCard({
  item,
  isAdmin,
  onToggleMaintenance,
  onTogglePortfolioVisibility,
  onSaveProject,
  onSaveSiteConfig,
  onDeleteFromAdmin,
  onPreview,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [technologies, setTechnologies] = useState((item.technologies || []).join(', '));
  const [badge, setBadge] = useState(item.badge || 'En ligne');
  const [link, setLink] = useState(item.link || '');
  const [domain, setDomain] = useState(item.domain || '');

  const siteConfig = item.siteConfig || {};
  const [inMaintenance, setInMaintenance] = useState(Boolean(item.inMaintenance));
  const [scope, setScope] = useState(siteConfig.scope || 'ALL');
  const [targetPages, setTargetPages] = useState(siteConfig.targetPages || '');
  const [mTitle, setMTitle] = useState(siteConfig.title || 'Atelier en cours de rénovation');
  const [mMessage, setMMessage] = useState(siteConfig.message || "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...");

  useEffect(() => {
    if (!isEditing) {
      setTitle(item.title || '');
      setDescription(item.description || '');
      setTechnologies((item.technologies || []).join(', '));
      setBadge(item.badge || 'En ligne');
      setLink(item.link || '');
      setDomain(item.domain || '');
      setInMaintenance(Boolean(item.inMaintenance));
      const sc = item.siteConfig || {};
      setScope(sc.scope || 'ALL');
      setTargetPages(sc.targetPages || '');
      setMTitle(sc.title || 'Atelier en cours de rénovation');
      setMMessage(sc.message || "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...");
    }
  }, [item, isEditing]);

  const bypassUrl = item.domain ? `https://${item.domain}/?admin_bypass=azim404` : item.link;

  const handleSaveAll = () => {
    if (item.isProject) {
      onSaveProject({
        id: item.id,
        title,
        description,
        technologies: technologies.split(',').map((t) => t.trim()).filter(Boolean),
        badge,
        link,
        domain: (domain || item.domain).trim(),
        visibleOnPortfolio: item.visibleOnPortfolio,
        inMaintenance,
      });
    }

    const cleanDomain = (domain || item.domain).replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
    if (cleanDomain) {
      onSaveSiteConfig({
        id: siteConfig.id || item.id,
        name: title,
        domain: cleanDomain,
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
      className={`p-4 sm:p-5 rounded-xl border flex flex-col justify-between transition-all ${
        item.inMaintenance
          ? 'bg-slate-950 border-amber-500/40 shadow-sm'
          : 'bg-slate-950/80 border-slate-800'
      }`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-gray-400 truncate">
                {item.domain || 'Projet'}
              </span>
              {item.isProject && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                  item.visibleOnPortfolio
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-900 text-gray-400 border-slate-700'
                }`}>
                  {item.visibleOnPortfolio ? 'Sur Portfolio' : 'Masqué Portfolio'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-white mt-0.5 truncate">{item.title}</h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-[10px] font-medium">
              {item.badge}
            </span>
            {item.inMaintenance && (
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-mono">
                TRAVAUX
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Stack */}
        <div className="flex flex-wrap gap-1">
          {(item.technologies || []).map((tech, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-gray-300 border border-slate-800 font-mono"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href={bypassUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 transition"
          >
            Accès Bypass
          </a>

          <a
            href={item.link || `https://${item.domain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-400 hover:text-white transition"
          >
            Lien direct
          </a>
        </div>

        {/* 1-Click Travaux Toggle */}
        {isAdmin && (
          <div className="pt-2">
            <button
              onClick={() => {
                const nextState = !item.inMaintenance;
                setInMaintenance(nextState);
                onToggleMaintenance(siteConfig.id || item.id, nextState, {
                  domain: (domain || item.domain || '').trim(),
                  title: mTitle,
                  message: mMessage,
                  scope,
                  targetPages,
                });
              }}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition ${
                item.inMaintenance
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  : 'bg-amber-700 hover:bg-amber-600 text-white'
              }`}
            >
              {item.inMaintenance
                ? 'Désactiver les travaux (Remettre en ligne)'
                : 'Mettre ce site en travaux (1 clic)'}
            </button>
          </div>
        )}

        {/* Edit Panel */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-gray-500 text-[11px]">CONFIGURATION</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
              >
                {isEditing ? 'Fermer' : 'Modifier'}
              </button>
            </div>

            {isEditing && (
              <div className="space-y-2.5 pt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400">TITRE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-7 px-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">STACK</label>
                    <input
                      type="text"
                      value={technologies}
                      onChange={(e) => setTechnologies(e.target.value)}
                      className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">STATUT</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">LIEN</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400">DOMAINE</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full h-7 px-2 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <label className="text-[10px] font-mono text-gray-400">MESSAGE DE TRAVAUX</label>
                  <textarea
                    rows={2}
                    value={mMessage}
                    onChange={(e) => setMMessage(e.target.value)}
                    className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleSaveAll}
                  className="w-full py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-xs transition"
                >
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {isAdmin && (
        <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between items-center text-xs">
          <button
            onClick={onPreview}
            className="text-gray-400 hover:text-white transition font-mono text-[11px]"
          >
            Aperçu travaux
          </button>

          <div className="flex items-center gap-2">
            {item.isProject && (
              <button
                onClick={() => onTogglePortfolioVisibility(item.id, !item.visibleOnPortfolio)}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-gray-300 hover:text-white transition"
              >
                {item.visibleOnPortfolio ? 'Masquer portfolio' : 'Afficher portfolio'}
              </button>
            )}

            {item.id !== 'portfolio' && item.id !== 'azim404' && (
              <button
                onClick={() => onDeleteFromAdmin(item.id)}
                className="text-[11px] text-rose-400/80 hover:text-rose-300 font-mono transition"
              >
                Supprimer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Onglet Audit & Tests complet (Référentiel complet 6 catégories avec notes et vue d'ensemble)
function AuditTestsTab({ sites, showToast }) {
  const [auditsSH, setAuditsSH] = useState(() => {
    try { return JSON.parse(localStorage.getItem('azim_sh_cache') || '{}'); } catch { return {}; }
  });
  const [auditsObs, setAuditsObs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('azim_obs_cache') || '{}'); } catch { return {}; }
  });
  const [auditsSSL, setAuditsSSL] = useState(() => {
    try { return JSON.parse(localStorage.getItem('azim_ssl_cache') || '{}'); } catch { return {}; }
  });

  const [loadingMap, setLoadingMap] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const hasAutoRun = useRef(false);

  const saveTo = (setter, key, domain, data) => {
    setter((prev) => {
      const updated = { ...prev, [domain]: data };
      try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const fetchJSON = async (url, timeout = 30000) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return res.json();
  };

  const runAuditDomain = async (dom) => {
    if (!dom) return;
    setLoadingMap((prev) => ({ ...prev, [dom]: true }));
    try {
      const [shData, obsData, sslData] = await Promise.allSettled([
        fetchJSON(`/api/site-status/audit-headers?domain=${encodeURIComponent(dom)}`, 12000),
        fetchJSON(`/api/site-status/audit-observatory?domain=${encodeURIComponent(dom)}`, 35000),
        fetchJSON(`/api/site-status/audit-ssllabs?domain=${encodeURIComponent(dom)}`, 100000),
      ]);
      if (shData.status === 'fulfilled') saveTo(setAuditsSH, 'azim_sh_cache', dom, shData.value);
      if (obsData.status === 'fulfilled') saveTo(setAuditsObs, 'azim_obs_cache', dom, obsData.value);
      if (sslData.status === 'fulfilled') saveTo(setAuditsSSL, 'azim_ssl_cache', dom, sslData.value);
    } catch (err) {
      saveTo(setAuditsSH, 'azim_sh_cache', dom, { success: false, domain: dom, grade: '?', error: err.message });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [dom]: false }));
    }
  };

  const validSites = sites.map((s) => {
    const dom = (s.domain || (s.link ? new URL(s.link.startsWith('http') ? s.link : `https://${s.link}`).hostname : ''))
      .trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    return { ...s, cleanDomain: dom };
  }).filter((s) => Boolean(s.cleanDomain));

  const runAuditAll = async () => {
    setGlobalLoading(true);
    for (const site of validSites) {
      await runAuditDomain(site.cleanDomain);
      await new Promise((r) => setTimeout(r, 200));
    }
    setGlobalLoading(false);
    showToast?.('Analyse globale terminée');
  };

  useEffect(() => {
    if (hasAutoRun.current || validSites.length === 0) return;
    hasAutoRun.current = true;
    runAuditAll();
  }, [validSites.length]);

  const gradeColor = (grade) => {
    if (!grade || grade === '?' || grade === '-') return 'text-gray-400 bg-slate-900 border-slate-700';
    if (grade === 'A+') return 'text-emerald-300 bg-emerald-950/60 border-emerald-400/50';
    if (grade === 'A' || grade === 'A-') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    if (grade === 'B') return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40';
    if (grade === 'C') return 'text-amber-400 bg-amber-950/40 border-amber-500/40';
    if (grade === 'D' || grade === 'E') return 'text-orange-400 bg-orange-950/40 border-orange-500/40';
    return 'text-rose-400 bg-rose-950/40 border-rose-500/40';
  };

  const GradeBadge = ({ grade, loading, href, title: badgeTitle }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" title={badgeTitle} className="inline-flex">
      {loading ? (
        <span className="w-9 h-6 rounded border border-slate-700 bg-slate-900 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
        </span>
      ) : (
        <span className={`w-9 h-6 rounded border text-[11px] font-black flex items-center justify-center transition ${gradeColor(grade)}`}>
          {grade || '-'}
        </span>
      )}
    </a>
  );

  const selectedSite = validSites.find((s) => s.cleanDomain === selectedDomain) || validSites[0];
  const dom = selectedSite?.cleanDomain;
  const sh = dom ? auditsSH[dom] : null;
  const obs = dom ? auditsObs[dom] : null;
  const ssl = dom ? auditsSSL[dom] : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Audits & Conformité Technique</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Sécurité (SecurityHeaders, Observatory, SSL Labs), SEO, Accessibilité, RGPD et Qualité de code.
          </p>
        </div>

        <button
          type="button"
          onClick={runAuditAll}
          disabled={globalLoading}
          className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs font-medium transition flex items-center gap-2 shrink-0"
        >
          {globalLoading ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full border border-white border-t-transparent animate-spin" />
              <span>Analyse en cours...</span>
            </>
          ) : (
            <span>Tout analyser</span>
          )}
        </button>
      </div>

      {/* Overview Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-gray-400 font-mono text-[11px] bg-slate-900/40">
                <th className="py-2.5 px-3">SITE / DOMAINE</th>
                <th className="py-2.5 px-3 text-center">SECURITY HEADERS</th>
                <th className="py-2.5 px-3 text-center">OBSERVATORY</th>
                <th className="py-2.5 px-3 text-center">SSL LABS</th>
                <th className="py-2.5 px-3 text-center">ENSEMBLE DES TESTS</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {validSites.map((site) => {
                const sDom = site.cleanDomain;
                const sSh = auditsSH[sDom];
                const sObs = auditsObs[sDom];
                const sSsl = auditsSSL[sDom];
                const isLoading = loadingMap[sDom];
                const isSelected = selectedDomain === sDom;

                return (
                  <tr
                    key={site.id || sDom}
                    className={`transition hover:bg-slate-900/40 ${isSelected ? 'bg-cyan-950/20' : ''}`}
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {site.title || site.name || sDom}
                      </div>
                      <div className="text-[10px] font-mono text-gray-500 truncate max-w-[200px]">
                        {sDom}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <GradeBadge
                          grade={sSh?.grade}
                          loading={isLoading && !sSh}
                          href={`https://securityheaders.com/?q=${encodeURIComponent(sDom)}&followRedirects=on`}
                          title={`SecurityHeaders — ${sSh?.grade || 'Non analysé'}${sSh?.score != null ? ` (${sSh.score}/100)` : ''}`}
                        />
                        {sSh?.score != null && (
                          <span className="text-[10px] font-mono text-gray-400">{sSh.score}/100</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <GradeBadge
                          grade={sObs?.grade}
                          loading={isLoading && !sObs}
                          href={`https://observatory.mozilla.org/analyze/${encodeURIComponent(sDom)}`}
                          title={`Mozilla Observatory — ${sObs?.grade || 'Non analysé'}`}
                        />
                        {sObs?.score != null && (
                          <span className="text-[10px] font-mono text-gray-400">{sObs.score}/100</span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <GradeBadge
                        grade={sSsl?.grade}
                        loading={isLoading && !sSsl}
                        href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(sDom)}`}
                        title={`Qualys SSL Labs — ${sSsl?.grade || 'Non analysé'}`}
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedDomain(isSelected ? null : sDom)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-slate-700 text-gray-300 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Masquer le détail' : 'Voir les 6 catégories'}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => runAuditDomain(sDom)}
                        disabled={isLoading}
                        className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline disabled:opacity-50"
                      >
                        {isLoading ? 'Analyse...' : 'Analyser'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL TEST SUITE DETAIL PANEL */}
      {selectedDomain && (
        <div className="p-5 rounded-xl border border-cyan-500/40 bg-slate-950 space-y-5 animate-fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 uppercase">ENSEMBLE DES TESTS</span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm font-bold text-white">{selectedSite?.title || selectedDomain}</span>
                <span className="text-xs font-mono text-gray-400">({selectedDomain})</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Audit complet selon le référentiel : Sécurité réseau, Référencement/Accessibilité, RGPD, Git, Qualité de code et Vulnérabilités.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runAuditDomain(selectedDomain)}
                disabled={loadingMap[selectedDomain]}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-gray-200 transition"
              >
                {loadingMap[selectedDomain] ? 'Analyse en cours...' : 'Relancer pour ce site'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDomain(null)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-gray-400 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'ALL', label: 'Toutes les catégories' },
              { id: '1', label: '1. Sécurité & TLS' },
              { id: '2', label: '2. SEO & Accessibilité' },
              { id: '3', label: '3. RGPD & Cookies' },
              { id: '4', label: '4. Fuites Git' },
              { id: '5', label: '5. Qualité de code' },
              { id: '6', label: '6. Vulnérabilités' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                  activeCategoryFilter === cat.id
                    ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* CAT 1: SÉCURITÉ RÉSEAU, TLS & EN-TÊTES */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '1') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">1. SÉCURITÉ RÉSEAU, TLS & EN-TÊTES</h4>
                  <span className="text-[11px] font-mono text-gray-500">Auto-analysé</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* SecurityHeaders */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">SecurityHeaders</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(sh?.grade)}`}>
                        {sh?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Score : <strong className="text-white">{sh?.score ?? '-'} / 100</strong>
                    </div>
                    <a
                      href={`https://securityheaders.com/?q=${encodeURIComponent(selectedDomain)}&followRedirects=on`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport officiel securityheaders.com
                    </a>
                  </div>

                  {/* Mozilla Observatory */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Mozilla Observatory</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(obs?.grade)}`}>
                        {obs?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Score : <strong className="text-white">{obs?.score ?? '-'} / 100</strong>
                    </div>
                    <a
                      href={`https://observatory.mozilla.org/analyze/${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport Mozilla Observatory
                    </a>
                  </div>

                  {/* Qualys SSL Labs */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-white">Qualys SSL Labs</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(ssl?.grade)}`}>
                        {ssl?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Certificat TLS & suites de chiffrement
                    </div>
                    <a
                      href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport complet Qualys SSL Labs
                    </a>
                  </div>
                </div>

                {/* En-têtes HTTP décortiqués */}
                {sh?.checks && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono text-gray-400 block">DÉTAIL DES 6 EN-TÊTES DE SÉCURITÉ :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(sh.checks).map(([key, check]) => (
                        <div
                          key={key}
                          className={`p-2 rounded-lg border text-xs space-y-1 ${
                            check.present
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/15 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="flex justify-between items-center font-mono">
                            <span className="font-bold">{check.name || key.toUpperCase()}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800">
                              {check.present ? 'Présent' : 'Manquant'}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 leading-tight">{check.desc}</p>
                          {check.value && (
                            <code className="text-[10px] font-mono text-gray-300 block truncate bg-slate-950 px-1 py-0.5 rounded">
                              {check.value}
                            </code>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CAT 2: RÉFÉRENCEMENT, ACCESSIBILITÉ & PERFORMANCE */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '2') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">2. RÉFÉRENCEMENT (SEO), ACCESSIBILITÉ & PERFORMANCE</h4>
                  <span className="text-[11px] font-mono text-gray-500">Audits web</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Google PageSpeed / Lighthouse</div>
                    <p className="text-[11px] text-gray-400">Core Web Vitals, SEO technique, performance et accessibilité de base.</p>
                    <a
                      href={`https://pagespeed.web.dev/analysis?url=https%3A%2F%2F${encodeURIComponent(selectedDomain)}%2F`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Lancer l'audit PageSpeed
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">WAVE WebAIM</div>
                    <p className="text-[11px] text-gray-400">Audit visuel précis de l'accessibilité : contrastes, balises ARIA, hiérarchie.</p>
                    <a
                      href={`https://wave.webaim.org/report#/https://${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Lancer l'audit WAVE
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Google Search Console & Ahrefs</div>
                    <p className="text-[11px] text-gray-400">Détection des erreurs d'indexation, liens cassés et balises canoniques.</p>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Ouvrir Search Console
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 3: RGPD & COOKIES */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '3') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">3. RGPD & COOKIES</h4>
                  <span className="text-[11px] font-mono text-gray-500">Conformité vie privée</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">2gdpr Scanner</div>
                    <p className="text-[11px] text-gray-400">Scanne la conformité RGPD, cookies déposés avant consentement et trackers tiers.</p>
                    <a
                      href={`https://2gdpr.com/check?domain=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Scanner sur 2gdpr.com
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Cookiebot Scanner</div>
                    <p className="text-[11px] text-gray-400">Vérifie l'exhaustivité des mentions légales de cookies et la conformité ePrivacy.</p>
                    <a
                      href="https://www.cookiebot.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Ouvrir Cookiebot Scanner
                    </a>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Blacklight (The Markup)</div>
                    <p className="text-[11px] text-gray-400">Détecte précisément trackers publicitaires, keyloggers et canvas fingerprinting.</p>
                    <a
                      href={`https://themarkup.org/blacklight?url=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:underline block font-mono"
                    >
                      Lancer le test Blacklight
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 4: COMMITS, SECRETS & FUITES GIT */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '4') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">4. COMMITS, SECRETS & FUITES GIT</h4>
                  <span className="text-[11px] font-mono text-gray-500">Sécurité du code source</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">TruffleHog (CLI)</div>
                    <p className="text-[11px] text-gray-400">Scanne l'historique complet des commits pour détecter clés API, tokens et mots de passe.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                      trufflehog git file://.
                    </code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Gitleaks (CLI / CI)</div>
                    <p className="text-[11px] text-gray-400">Détection automatique ultra-rapide des secrets oubliés dans les commits.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-1 rounded block">
                      gitleaks detect -v
                    </code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">GitGuardian</div>
                    <p className="text-[11px] text-gray-400">Monitoring continu des dépôts GitHub/GitLab pour bloquer les fuites en temps réel.</p>
                    <span className="text-[10px] font-mono text-gray-500 block">Monitoring recommandé en webhook</span>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 5: QUALITÉ DE CODE & ARCHITECTURE */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '5') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">5. FONCTIONS NON UTILISÉES, QUALITÉ & ARCHITECTURE</h4>
                  <span className="text-[11px] font-mono text-gray-500">Analyse statique</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">Knip</div>
                    <p className="text-[11px] text-gray-400">Détecte automatiquement fichiers orphelins, exports et types inutilisés.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx knip</code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">Depcheck</div>
                    <p className="text-[11px] text-gray-400">Liste les dépendances installées mais jamais importées dans le projet.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx depcheck</code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">ESLint (no-unused-vars)</div>
                    <p className="text-[11px] text-gray-400">Traque les variables, paramètres et fonctions mortes fichier par fichier.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx eslint .</code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">SonarQube / SonarCloud</div>
                    <p className="text-[11px] text-gray-400">Dette technique, code smells, duplication et failles de sécurité statiques.</p>
                    <span className="text-[10px] font-mono text-gray-500 block">Audit continu recommandé</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">Madge</div>
                    <p className="text-[11px] text-gray-400">Graphe visuel des dépendances et détection des dépendances circulaires.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx madge --circular .</code>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 6: VULNÉRABILITÉS & BASE DE DONNÉES */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '6') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-cyan-300 font-mono">6. BASE DE DONNÉES & VULNÉRABILITÉS APPLICATIVES</h4>
                  <span className="text-[11px] font-mono text-gray-500">Sécurité applicative</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">npm audit / Snyk</div>
                    <p className="text-[11px] text-gray-400">Scanne les vulnérabilités de sécurité connues (CVE) dans les packages.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npm audit</code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">Prisma Doctor / Index SQL</div>
                    <p className="text-[11px] text-gray-400">Audit des requêtes lentes, index manquants et détection des N+1 queries.</p>
                    <code className="text-[10px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">EXPLAIN ANALYZE</code>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-bold text-white">OWASP ZAP</div>
                    <p className="text-[11px] text-gray-400">Scanner dynamique (DAST) pour tester failles XSS, injections SQL et API exposée.</p>
                    <span className="text-[10px] font-mono text-gray-500 block">Scanner dynamique DAST</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Onglet synchronisation contexte privé
function ContextSyncTab({ showToast }) {
  const [content, setContent] = useState('');
  const [lastModified, setLastModified] = useState(null);
  const [targets, setTargets] = useState([]);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState('project-context.md');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const fetchContextData = async (fileToLoad = activeFile) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/context?file=${encodeURIComponent(fileToLoad)}`);
      const data = await res.json();
      if (data.success) {
        setContent(data.content || '');
        setLastModified(data.lastModified);
        setTargets(data.targets || []);
        setFiles(data.files || []);
        setActiveFile(data.activeFile || fileToLoad);
      }
    } catch {
      showToast('Impossible de charger le contexte privé');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContextData();
  }, []);

  const handleSelectFile = (name) => {
    setActiveFile(name);
    fetchContextData(name);
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const clean = newFileName.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
    setActiveFile(clean);
    setContent(`# ${clean}\n\n`);
    setShowNewFileModal(false);
    setNewFileName('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/context/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: activeFile }),
      });
      const data = await res.json();
      if (data.success) {
        setLastModified(data.lastModified);
        showToast(data.message || 'Fichier enregistré avec succès');
        fetchContextData(activeFile);
      } else {
        showToast(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      showToast('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const [newTargetName, setNewTargetName] = useState('');
  const [newTargetFolder, setNewTargetFolder] = useState('');

  const handleAddTarget = async (e) => {
    e?.preventDefault();
    if (!newTargetName.trim() || !newTargetFolder.trim()) return;
    try {
      const res = await fetch('/api/context/targets/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTargetName.trim(),
          folder: newTargetFolder.trim(),
          enabled: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
        setNewTargetName('');
        setNewTargetFolder('');
        showToast(data.message || 'Projet ajouté à la synchronisation');
      }
    } catch {
      showToast('Erreur lors de l’ajout du projet cible');
    }
  };

  const handleDeleteTarget = async (id, name) => {
    if (!confirm(`Retirer "${name}" de la liste de synchronisation ?`)) return;
    try {
      const res = await fetch(`/api/context/targets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTargets(data.targets);
        showToast(`Projet "${name}" retiré`);
      }
    } catch {
      showToast('Erreur lors de la suppression');
    }
  };

  const handleToggleTarget = async (targetId) => {
    const nextTargets = targets.map((t) =>
      t.id === targetId ? { ...t, enabled: !t.enabled } : t
    );
    setTargets(nextTargets);
    try {
      await fetch('/api/context/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: nextTargets }),
      });
    } catch {}
  };

  const handleToggleAllTargets = async (enableAll) => {
    const nextTargets = targets.map((t) => ({ ...t, enabled: enableAll }));
    setTargets(nextTargets);
    try {
      await fetch('/api/context/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: nextTargets }),
      });
    } catch {}
  };

  const handleSyncAll = async () => {
    try {
      setSyncing(true);
      setSyncResult(null);

      await fetch('/api/context/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: activeFile }),
      });

      const res = await fetch('/api/context/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        showToast(`Synchronisé sur ${data.syncedCount} projet(s)`);
      }
    } catch {
      showToast('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const [localBrowserSyncing, setLocalBrowserSyncing] = useState(false);
  const [showBraveModal, setShowBraveModal] = useState(false);
  const [copiedBraveFlag, setCopiedBraveFlag] = useState(false);

  const handleCopyBraveFlag = () => {
    navigator.clipboard.writeText('brave://flags/#file-system-access-api');
    setCopiedBraveFlag(true);
    setTimeout(() => setCopiedBraveFlag(false), 2500);
  };

  const handleDownloadSyncBat = () => {
    const batContent = `@echo off\r\ntitle Synchronisation Contexte Prive - Azim404\r\ncolor 0b\r\necho ========================================================\r\necho   Synchronisation du Contexte Prive sur tous les projets\r\necho ========================================================\r\necho.\r\ncd /d "%~dp0"\r\nnode scripts/sync-local-context.mjs\r\necho.\r\necho Termine. Appuyez sur une touche pour quitter.\r\npause > nul\r\n`;
    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sync.bat';
    a.click();
    URL.revokeObjectURL(url);
    showToast('sync.bat téléchargé');
  };

  const fileInputRef = useRef(null);

  const handleImportLocalMd = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        setActiveFile(cleanName);
        setContent(text);
        showToast(`Fichier "${cleanName}" chargé`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleBrowserLocalSync = async () => {
    setLocalBrowserSyncing(true);

    try {
      const bridgePing = await fetch('http://127.0.0.1:5001/ping', { signal: AbortSignal.timeout(1200) }).catch(() => null);
      if (bridgePing && bridgePing.ok) {
        showToast("Bridge local détecté. Synchronisation en cours...");
        const bridgeRes = await fetch('http://127.0.0.1:5001/sync', { method: 'POST' });
        const bridgeData = await bridgeRes.json();
        if (bridgeData.success) {
          showToast(`${bridgeData.syncedCount} projet(s) locaux synchronisés via bridge local`);
          setLocalBrowserSyncing(false);
          return;
        }
      }
    } catch {}

    if (!window.showDirectoryPicker) {
      setLocalBrowserSyncing(false);
      setShowBraveModal(true);
      return;
    }

    try {
      showToast("Sélectionnez votre dossier de projets...");
      const rootDirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const bundleRes = await fetch('/api/context/bundle');
      const bundleData = await bundleRes.json();
      if (!bundleData.success || !bundleData.bundle) {
        throw new Error("Impossible de charger les fichiers de contexte depuis le serveur.");
      }
      const bundleFiles = bundleData.bundle;
      const enabledTargets = targets.filter((t) => t.enabled);
      let localUpdatedCount = 0;

      for (const target of enabledTargets) {
        const folderName = target.folder || target.id;
        try {
          let projectHandle = null;
          try {
            projectHandle = await rootDirHandle.getDirectoryHandle(folderName);
          } catch {
            for await (const [name, handle] of rootDirHandle.entries()) {
              if (handle.kind === 'directory' && name.toLowerCase() === folderName.toLowerCase()) {
                projectHandle = handle;
                break;
              }
            }
          }
          if (!projectHandle) continue;

          try {
            let gitignoreContent = '';
            try {
              const gitignoreHandle = await projectHandle.getFileHandle('.gitignore');
              const file = await gitignoreHandle.getFile();
              gitignoreContent = await file.text();
            } catch {}

            const rules = ['.env', 'sync/', 'agent/', 'shared-context/', 'project-context.md', '*contexte*prive*.md'];
            const missing = rules.filter((r) => !gitignoreContent.includes(r));
            if (missing.length > 0) {
              const gitignoreHandle = await projectHandle.getFileHandle('.gitignore', { create: true });
              const writable = await gitignoreHandle.createWritable();
              await writable.write(gitignoreContent + '\n# Private Context Rules\n' + missing.join('\n') + '\n');
              await writable.close();
            }
          } catch {}

          const syncDirHandle = await projectHandle.getDirectoryHandle('sync', { create: true });
          for (const [fname, fileContent] of Object.entries(bundleFiles)) {
            const fileHandle = await syncDirHandle.getFileHandle(fname, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(fileContent);
            await writable.close();

            if (fname === 'project-context.md') {
              const rootFileHandle = await projectHandle.getFileHandle(fname, { create: true });
              const rootWritable = await rootFileHandle.createWritable();
              await rootWritable.write(fileContent);
              await rootWritable.close();
            }
          }

          localUpdatedCount++;
        } catch {}
      }

      if (localUpdatedCount > 0) {
        showToast(`${localUpdatedCount} projet(s) locaux synchronisés`);
      } else {
        showToast("Aucun sous-dossier correspondant trouvé dans le répertoire sélectionné.");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast(`Erreur synchro locale : ${err.message}`);
      }
    } finally {
      setLocalBrowserSyncing(false);
    }
  };

  const handleDownloadBundle = async () => {
    try {
      const res = await fetch('/api/context/bundle');
      const data = await res.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'private-context-bundle.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Fichiers exportés');
      }
    } catch {
      showToast('Erreur lors de l’export');
    }
  };

  const enabledCount = targets.filter((t) => t.enabled).length;

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white">Dossier Contexte Privé & Synchronisation</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Édition centralisée et synchronisation automatique avec injection .gitignore.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".md,.txt"
            onChange={handleImportLocalMd}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-mono border border-slate-800 transition"
          >
            Importer .md
          </button>
          <button
            type="button"
            onClick={handleDownloadBundle}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-mono border border-slate-800 transition"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleBrowserLocalSync}
            disabled={localBrowserSyncing || loading}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-medium border border-cyan-500/40 transition disabled:opacity-50"
          >
            {localBrowserSyncing ? 'Synchronisation...' : 'Synchro directe PC'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || loading || enabledCount === 0}
            className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium transition disabled:opacity-50"
          >
            {syncing ? 'Synchronisation...' : `Synchroniser (${enabledCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-gray-400 bg-slate-950 rounded-xl border border-slate-800">
          Chargement du dossier contexte...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-3">
            {/* File pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {files.map((f) => (
                <button
                  key={f.filename}
                  type="button"
                  onClick={() => handleSelectFile(f.filename)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition border ${
                    activeFile === f.filename
                      ? 'bg-cyan-950 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {f.filename}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewFileModal(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
              >
                + Fichier
              </button>
            </div>

            {showNewFileModal && (
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="nom-fichier.md"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono flex-1 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleCreateFile}
                  className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Editor */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-slate-800 pb-2">
                <span>Fichier actif : {activeFile}</span>
                <span>{lastModified ? `Mis à jour le ${new Date(lastModified).toLocaleDateString('fr-FR')}` : ''}</span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
                placeholder={`Contenu du fichier ${activeFile}...`}
              />

              <div className="flex justify-between items-center text-[10px] font-mono text-gray-500">
                <span>{content.split('\n').length} lignes • {content.length} caractères</span>
                <button
                  type="button"
                  onClick={() => fetchContextData(activeFile)}
                  className="text-gray-400 hover:text-white underline"
                >
                  Recharger
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar targets */}
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-white">Projets cibles</h3>
                  <p className="text-[10px] text-gray-400">{enabledCount}/{targets.length} activé(s)</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(true)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(false)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Rien
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className={`p-2 rounded-lg border flex items-center justify-between transition ${
                      target.enabled
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-950 border-slate-800 text-gray-500'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 mr-2 text-xs truncate">
                      <input
                        type="checkbox"
                        checked={Boolean(target.enabled)}
                        onChange={() => handleToggleTarget(target.id)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className="truncate">{target.name}</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-gray-400">/{target.folder}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTarget(target.id, target.name)}
                        className="text-gray-500 hover:text-rose-400 font-mono text-xs"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add target form */}
              <form onSubmit={handleAddTarget} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-mono text-gray-300 block">AJOUTER UN PROJET CIBLE</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Dossier"
                    value={newTargetFolder}
                    onChange={(e) => setNewTargetFolder(e.target.value)}
                    className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTargetName.trim() || !newTargetFolder.trim()}
                  className="w-full py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition disabled:opacity-40"
                >
                  Ajouter à la liste
                </button>
              </form>
            </div>

            {syncResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs animate-fade-in">
                <div className="font-bold text-white flex justify-between">
                  <span>Résultat synchronisation</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(syncResult.syncedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="text-emerald-400 font-mono text-[11px]">
                  {syncResult.syncedCount} projet(s) mis à jour
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Brave Browser */}
      {showBraveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Synchronisation dans Brave Browser</h3>
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Brave désactive l'accès direct aux dossiers par défaut. Pour activer l'accès direct ou lancer le script :
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-cyan-300 block">Option 1 : Activer le flag Brave</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-400 select-all truncate">
                  brave://flags/#file-system-access-api
                </code>
                <button
                  type="button"
                  onClick={handleCopyBraveFlag}
                  className="px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-xs font-medium shrink-0"
                >
                  {copiedBraveFlag ? 'Copié' : 'Copier'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400">Passez sur Enabled puis relancez Brave.</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-white block">Option 2 : Script sync.bat</span>
              <p className="text-[11px] text-gray-400">Double-cliquez sur sync.bat à la racine du projet.</p>
              <button
                type="button"
                onClick={handleDownloadSyncBat}
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-medium border border-slate-700 transition"
              >
                Télécharger sync.bat
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
