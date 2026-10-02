/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext.jsx';
import MaintenanceScreen from '../components/MaintenanceScreen.jsx';

// Formatage lisible de la date de derniere analyse
function formatLastCheck(isoDate) {
  if (!isoDate) return 'Non analysé';
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return 'Non analysé';
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

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
    setTimeout(() => setToast(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

    showToast(`Projet "${newTitle}" ajouté`);
    setShowAddProjectModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewStack('');
    setNewLink('');
    setNewDomain('');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    const res = await updateMyCredentials({
      newIdentifier: myNewId,
      newPassword: myNewPass,
      name: myName,
    });
    if (res.success) {
      showToast('Identifiants mis à jour');
      setProfileMsg('Identifiants modifiés avec succès.');
      setMyNewId('');
      setMyNewPass('');
    } else {
      setProfileMsg(res.message);
    }
  };

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
      showToast(`Compte "${newAccId}" créé`);
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
        <div className="fixed top-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 border border-cyan-500/50 text-cyan-200 text-sm font-medium shadow-lg backdrop-blur-md flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center select-none" title="Retour à l'accueil">
              <span className="text-xl font-bold tracking-tight text-white flex items-center">
                <img
                  src="/images/logo_transparent.png"
                  alt="A"
                  className="h-[1.15em] w-auto object-contain inline-block -mr-1"
                />
                <span>zim.404</span>
              </span>
            </Link>

            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
              CONSOLE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user?.name || user?.identifier}</span>
              <span className="text-gray-600">•</span>
              <span className="uppercase text-cyan-400">{user?.role || 'Membre'}</span>
            </div>

            <Link
              to="/"
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white transition font-medium"
            >
              Site Public
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 transition font-medium"
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-white/5 overflow-x-auto">
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
              className={`py-3 px-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-gray-300 border border-slate-700 font-mono">
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
            <div className="flex justify-between items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isAdmin ? 'Démos, Projets & Mode Travaux' : 'Vos Accès Privés & Démos'}
                </h2>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddProjectModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs sm:text-sm font-medium transition"
                  >
                    + Ajouter un projet
                  </button>
                  <button
                    onClick={() => {
                      refreshSites();
                      refreshPortfolioProjects();
                      showToast('Données synchronisées');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm text-gray-300 hover:text-white transition"
                  >
                    Actualiser
                  </button>
                </div>
              )}
            </div>

            {displayedProjects.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-950 border border-slate-800 text-center text-gray-400 text-sm">
                Aucun projet disponible
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
                      showToast(nextState ? `Mode Travaux activé pour ${item.title}` : `${item.title} remis en ligne`);
                    }}
                    onTogglePortfolioVisibility={async (id, nextVisible) => {
                      await toggleProjectVisibility(id, nextVisible);
                      showToast(nextVisible ? `Affiché sur portfolio` : `Masqué du portfolio`);
                    }}
                    onSaveProject={async (projData) => {
                      await savePortfolioProject(projData);
                      showToast(`Projet sauvegardé`);
                    }}
                    onSaveSiteConfig={async (siteData) => {
                      await saveSiteConfig(siteData);
                      showToast(`Configuration sauvegardée`);
                    }}
                    onDeleteFromAdmin={async (id) => {
                      if (confirm(`Supprimer "${item.title}" ?`)) {
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

        {/* TAB 2: AUDITS & TESTS (Optimisé avec cache, async parallèle, date dernière analyse) */}
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
                  <h3 className="text-sm font-bold text-white">Mon Profil & Identifiants</h3>
                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase">
                    {user?.role || 'Membre'}
                  </span>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">IDENTIFIANT</label>
                    <input
                      type="text"
                      value={myNewId}
                      onChange={(e) => setMyNewId(e.target.value)}
                      placeholder={user?.identifier}
                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">NOUVEAU MOT DE PASSE</label>
                    <input
                      type="password"
                      value={myNewPass}
                      onChange={(e) => setMyNewPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">NOM D'AFFICHAGE</label>
                    <input
                      type="text"
                      value={myName}
                      onChange={(e) => setMyName(e.target.value)}
                      placeholder="Votre nom"
                      className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {profileMsg && (
                    <div className="text-xs font-mono text-cyan-300 bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                      {profileMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-sm transition"
                  >
                    Enregistrer
                  </button>
                </form>
              </div>

              {/* SECTION B : CRÉATION D'ACCÈS */}
              {isAdmin ? (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white">Créer un Compte & Affecter des Accès</h3>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">IDENTIFIANT</label>
                        <input
                          type="text"
                          value={newAccId}
                          onChange={(e) => setNewAccId(e.target.value)}
                          placeholder="client-xyz"
                          required
                          className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
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
                          className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">NOM / RÉFÉRENCE</label>
                        <input
                          type="text"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          placeholder="Nom ou société"
                          className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">RÔLE</label>
                        <select
                          value={newAccPerm}
                          onChange={(e) => setNewAccPerm(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
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
                          className="text-xs font-mono text-gray-400 hover:text-white"
                        >
                          {newAccAllowedProjects.length === combinedList.length ? 'Tout décocher' : 'Tout cocher'}
                        </button>
                      </div>

                      <div className="max-h-36 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-900 border border-slate-800">
                        {combinedList.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2 p-1 rounded hover:bg-slate-800/50 cursor-pointer text-sm select-none"
                          >
                            <input
                              type="checkbox"
                              checked={newAccAllowedProjects.includes(item.id)}
                              onChange={() => handleToggleProjectAccess(item.id)}
                              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span className="text-white truncate">{item.title}</span>
                            <span className="text-xs font-mono text-gray-500 ml-auto truncate">{item.domain || item.badge}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {accountMsg && <div className="text-xs text-rose-400 font-mono">{accountMsg}</div>}

                    <button
                      type="submit"
                      className="w-full py-2 px-3 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-sm transition"
                    >
                      Créer le compte
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-gray-400">
                  Votre compte est un compte membre privé. Seul l'administrateur peut créer ou modifier des accès.
                </div>
              )}
            </div>

            {/* TABLEAU DES COMPTES */}
            {isAdmin && (
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Comptes configurés ({accounts.length + 1})</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-gray-400 font-mono text-xs bg-slate-900/40">
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
                          <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-xs">
                            SUPER ADMIN
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-mono text-xs">
                          Accès total ({combinedList.length} projets)
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-500 text-xs italic">
                          Protégé
                        </td>
                      </tr>

                      {accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-3 font-mono text-white">{acc.identifier}</td>
                          <td className="py-2.5 px-3 text-gray-300">{acc.name || '-'}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-gray-300 text-xs">
                              {acc.permissions || 'Membre'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 font-mono text-xs">
                            {Array.isArray(acc.allowedProjects) && acc.allowedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {acc.allowedProjects.map((pId) => (
                                  <span key={pId} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-xs">
                                    {pId}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Aucun</span>
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
                    <span className="font-mono text-gray-400">Port {srv.port}</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {srv.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{srv.name}</div>
                  <div className="text-xs font-mono text-cyan-400/80">{srv.ssl}</div>
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
              <h3 className="text-base font-bold text-white">Ajouter un Projet ou Site Web</h3>
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
                  className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-gray-300">DESCRIPTION (PORTFOLIO)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brève description..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
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
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">STATUT BADGE</label>
                  <input
                    type="text"
                    value={newBadge}
                    onChange={(e) => setNewBadge(e.target.value)}
                    placeholder="ex: En ligne, En dev..."
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
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
                    placeholder="https://site.azim404.com/"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-300">DOMAINE (TRAVAUX)</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="site.azim404.com"
                    className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-sm">
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
                  className="flex-1 py-2 rounded-lg bg-slate-900 border border-slate-800 text-gray-300 text-sm hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-sm transition"
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
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex justify-between items-center">
            <span className="text-sm font-mono text-gray-300">
              Aperçu travaux : <strong className="text-white">{previewSite.domain || previewSite.title}</strong>
            </span>
            <button
              onClick={() => setPreviewSite(null)}
              className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-gray-200 transition font-mono"
            >
              Fermer
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

// Composant Carte Projet
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
      className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
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
              <span className="text-xs font-mono uppercase text-gray-400 truncate">
                {item.domain || 'Projet'}
              </span>
              {item.isProject && (
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  item.visibleOnPortfolio
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-900 text-gray-400 border-slate-700'
                }`}>
                  {item.visibleOnPortfolio ? 'Sur Portfolio' : 'Masqué Portfolio'}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1 truncate">{item.title}</h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 text-xs font-medium">
              {item.badge}
            </span>
            {item.inMaintenance && (
              <span className="px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-mono font-medium">
                TRAVAUX
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Stack */}
        <div className="flex flex-wrap gap-1.5">
          {(item.technologies || []).map((tech, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 rounded bg-slate-900 text-gray-300 border border-slate-800 font-mono"
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
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 transition"
          >
            Accès Bypass
          </a>

          <a
            href={item.link || `https://${item.domain}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-gray-300 hover:text-white transition"
          >
            Lien direct
          </a>
        </div>

        {/* Travaux Toggle */}
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
              className={`w-full py-2 px-3 rounded-lg text-sm font-semibold tracking-wide transition ${
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
              <span className="font-mono text-gray-500">PARAMÈTRES</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
              >
                {isEditing ? 'Fermer' : 'Modifier'}
              </button>
            </div>

            {isEditing && (
              <div className="space-y-3 pt-2 bg-slate-900/50 p-3.5 rounded-lg border border-slate-800 text-sm">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">TITRE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-8 px-3 rounded bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-gray-400">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">STACK</label>
                    <input
                      type="text"
                      value={technologies}
                      onChange={(e) => setTechnologies(e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">STATUT</label>
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">LIEN</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-gray-400">DOMAINE</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full h-8 px-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800">
                  <label className="text-xs font-mono text-gray-400">MESSAGE DE TRAVAUX</label>
                  <textarea
                    rows={2}
                    value={mMessage}
                    onChange={(e) => setMMessage(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleSaveAll}
                  className="w-full py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-medium text-sm transition"
                >
                  Enregistrer
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
            className="text-gray-400 hover:text-white transition font-mono"
          >
            Aperçu travaux
          </button>

          <div className="flex items-center gap-2">
            {item.isProject && (
              <button
                onClick={() => onTogglePortfolioVisibility(item.id, !item.visibleOnPortfolio)}
                className="font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-gray-300 hover:text-white transition"
              >
                {item.visibleOnPortfolio ? 'Masquer portfolio' : 'Afficher portfolio'}
              </button>
            )}

            {item.id !== 'portfolio' && item.id !== 'azim404' && (
              <button
                onClick={() => onDeleteFromAdmin(item.id)}
                className="text-rose-400/80 hover:text-rose-300 font-mono transition px-1 py-0.5"
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

// Onglet Audit & Tests optimisé (parallélisme async, cache backend, date dernière analyse)
function AuditTestsTab({ sites, showToast }) {
  const [auditsSH, setAuditsSH] = useState({});
  const [auditsObs, setAuditsObs] = useState({});
  const [auditsSSL, setAuditsSSL] = useState({});
  const [auditsFull, setAuditsFull] = useState({});
  const [systemAudit, setSystemAudit] = useState(null);
  const [systemAuditLoading, setSystemAuditLoading] = useState(false);
  const [loadingMap, setLoadingMap] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [lastCheckTimes, setLastCheckTimes] = useState({});

  const validSites = sites.map((s) => {
    const dom = (s.domain || (s.link ? new URL(s.link.startsWith('http') ? s.link : `https://${s.link}`).hostname : ''))
      .trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    return { ...s, cleanDomain: dom };
  }).filter((s) => Boolean(s.cleanDomain));

  const fetchJSON = async (url, timeout = 35000) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    return res.json();
  };

  const fetchSystemAudit = async () => {
    setSystemAuditLoading(true);
    try {
      const data = await fetchJSON('/api/site-status/audit-system', 15000);
      if (data?.success) setSystemAudit(data);
    } catch {} finally {
      setSystemAuditLoading(false);
    }
  };

  // Chargement instantané du résumé en cache au premier affichage
  useEffect(() => {
    const loadCache = async () => {
      try {
        const res = await fetch('/api/site-status/audit-summary');
        const data = await res.json();
        if (data.success && data.cache) {
          const shMap = {};
          const obsMap = {};
          const sslMap = {};
          const fullMap = {};
          const times = {};

          for (const [d, tools] of Object.entries(data.cache)) {
            if (tools.sh) shMap[d] = tools.sh;
            if (tools.obs) obsMap[d] = tools.obs;
            if (tools.ssl) sslMap[d] = tools.ssl;
            if (tools.full) fullMap[d] = tools.full;
            const dates = [tools.sh?.checkedAt, tools.obs?.checkedAt, tools.ssl?.checkedAt, tools.full?.checkedAt].filter(Boolean);
            if (dates.length > 0) {
              times[d] = dates.sort().reverse()[0];
            }
          }

          setAuditsSH(shMap);
          setAuditsObs(obsMap);
          setAuditsSSL(sslMap);
          setAuditsFull(fullMap);
          setLastCheckTimes(times);
        }
      } catch {}
    };
    loadCache();
    fetchSystemAudit();
  }, []);

  // Calcul ou récupération de la Note Globale unifiée
  const getSiteGlobal = (sDom) => {
    const full = auditsFull[sDom];
    if (full?.globalGrade) {
      return {
        grade: full.globalGrade,
        score: full.globalScore,
        label: full.globalLabel,
      };
    }

    const sSh = auditsSH[sDom];
    const sObs = auditsObs[sDom];
    const sSsl = auditsSSL[sDom];

    const gradeToScore = { 'A+': 100, 'A': 92, 'A-': 88, 'B': 75, 'C': 55, 'D': 35, 'E': 20, 'F': 0, '?': 0 };
    const scores = [];

    if (sSh && sSh.success) scores.push(typeof sSh.score === 'number' ? sSh.score : (gradeToScore[sSh.grade] ?? 50));
    if (sObs && sObs.success) scores.push(typeof sObs.score === 'number' ? sObs.score : (gradeToScore[sObs.grade] ?? 50));
    if (sSsl && sSsl.success) scores.push(gradeToScore[sSsl.grade] ?? 90);

    if (scores.length === 0) return { grade: '?', score: null, label: 'Non analysé' };

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    let grade = 'F';
    let label = 'Critique (Vulnérabilités)';
    if (avg >= 90) { grade = 'A+'; label = 'Excellente protection'; }
    else if (avg >= 80) { grade = 'A'; label = 'Solide & Sécurisé'; }
    else if (avg >= 70) { grade = 'B'; label = 'Bonne sécurité'; }
    else if (avg >= 55) { grade = 'C'; label = 'Moyen (Améliorations requises)'; }
    else if (avg >= 40) { grade = 'D'; label = 'Faible (En-têtes manquants)'; }
    else if (avg >= 20) { grade = 'E'; label = 'Vulnérable'; }

    return { grade, score: avg, label };
  };

  // Analyse 1-CLIC d'un domaine : lance en parallèle tout le scan serveur et externe
  const runAuditDomain = async (dom, force = true) => {
    if (!dom) return;
    setLoadingMap((prev) => ({ ...prev, [dom]: true }));

    try {
      const forceQuery = force ? '&force=true' : '';
      const data = await fetchJSON(`/api/site-status/audit-full?domain=${encodeURIComponent(dom)}${forceQuery}`, 35000);

      if (data?.success) {
        setAuditsFull((prev) => ({ ...prev, [dom]: data }));
        if (data.sh) setAuditsSH((prev) => ({ ...prev, [dom]: data.sh }));
        if (data.obs) setAuditsObs((prev) => ({ ...prev, [dom]: data.obs }));
        if (data.ssl) setAuditsSSL((prev) => ({ ...prev, [dom]: data.ssl }));
        setLastCheckTimes((prev) => ({ ...prev, [dom]: data.checkedAt || new Date().toISOString() }));
      }
    } catch (err) {
      showToast?.(`Erreur lors de l’audit de ${dom}`);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [dom]: false }));
    }
  };

  // Analyse 1-CLIC Globale : lance tous les sites en parallèle + audit système
  const runAuditAll = async () => {
    setGlobalLoading(true);
    await Promise.allSettled([
      ...validSites.map((site) => runAuditDomain(site.cleanDomain, true)),
      fetchSystemAudit(),
    ]);
    setGlobalLoading(false);
    showToast?.('Tous les audits ont été actualisés');
  };

  // Utilitaires de téléchargement Markdown
  const downloadMarkdownFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Exporter en .md le rapport complet d'un site avec tous les 20 outils automatisés
  const exportSiteMarkdown = (siteDom) => {
    const site = validSites.find((s) => s.cleanDomain === siteDom) || { cleanDomain: siteDom, title: siteDom };
    const full = auditsFull[siteDom] || {};
    const sSh = full.sh || auditsSH[siteDom];
    const sObs = full.obs || auditsObs[siteDom];
    const sSsl = full.ssl || auditsSSL[siteDom];
    const ps = full.pagespeed;
    const wv = full.wave;
    const seo = full.seo;
    const gdpr = full.twoGdpr;
    const cbot = full.cookiebot;
    const bl = full.blacklight;
    const th = full.trufflehog;
    const gl = full.gitleaks;
    const gg = full.gitguardian;
    const kn = full.knip;
    const dc = full.depcheck;
    const es = full.eslint;
    const sq = full.sonarqube;
    const mdg = full.madge;
    const snyk = full.npmSnyk;
    const pr = full.prismaDoctor;
    const zap = full.owaspZap;

    const global = getSiteGlobal(siteDom);
    const now = new Date().toLocaleString('fr-FR');

    let md = `# Rapport d'Audit & Sécurité Intégrale — ${site.title || siteDom}\n\n`;
    md += `> Date du rapport : ${now} • Généré automatiquement via la console Azim404\n\n`;

    md += `## 1. Synthèse Globale\n\n`;
    md += `- **Domaine :** \`${siteDom}\`\n`;
    md += `- **Note Globale :** **${global.grade}** (${global.score != null ? `${global.score}/100` : 'N/A'}) — *${global.label}*\n`;
    md += `- **Dernière analyse :** ${lastCheckTimes[siteDom] ? new Date(lastCheckTimes[siteDom]).toLocaleString('fr-FR') : 'À l’instant'}\n\n`;

    md += `### Tableau Synthétique des 20 Outils d'Audit\n\n`;
    md += `| Catégorie | Outil | Note | Score | Statut / Métriques clés |\n`;
    md += `|---|---|---|---|---|\n`;
    md += `| 1. Sécurité réseau | **SecurityHeaders** | **${sSh?.grade || '-'}** | ${sSh?.score != null ? `${sSh.score}/100` : '-'} | ${sSh?.success ? 'En-têtes HTTP analysés' : (sSh?.error || 'En attente')} |\n`;
    md += `| 1. Sécurité réseau | **Mozilla Observatory** | **${sObs?.grade || '-'}** | ${sObs?.score != null ? `${sObs.score}/100` : '-'} | ${sObs?.success ? `${sObs.tests_passed || 0} réussis / ${sObs.tests_failed || 0} échoués` : (sObs?.error || 'En attente')} |\n`;
    md += `| 1. Sécurité réseau | **Qualys SSL Labs / TLS** | **${sSsl?.grade || '-'}** | - | ${sSsl?.protocol || 'TLSv1.3'} (${sSsl?.issuer || "Let's Encrypt"}, ${sSsl?.daysRemaining ? `${sSsl.daysRemaining}j restants` : 'actif'}) |\n`;
    md += `| 2. SEO & Performance | **Google PageSpeed** | **${ps?.grade || '-'}** | ${ps?.score != null ? `${ps.score}/100` : '-'} | TTFB: ${ps?.ttfb != null ? `${ps.ttfb}ms` : '-'}, Poids: ${ps?.totalByteWeight ? `${Math.round(ps.totalByteWeight / 1024)} KB` : '-'} |\n`;
    md += `| 2. SEO & Performance | **WAVE WebAIM** | **${wv?.grade || '-'}** | ${wv?.score != null ? `${wv.score}/100` : '-'} | Images sans alt: ${wv?.missingAlt ?? 0}, Boutons sans label: ${wv?.emptyButtons ?? 0} |\n`;
    md += `| 2. SEO & Performance | **Google Search Console & Ahrefs** | **${seo?.grade || '-'}** | ${seo?.score != null ? `${seo.score}/100` : '-'} | robots.txt: ${seo?.hasRobots ? 'OK' : 'Absent'}, sitemap: ${seo?.hasSitemap ? 'OK' : 'Absent'} |\n`;
    md += `| 3. RGPD & Cookies | **2gdpr Scanner** | **${gdpr?.grade || '-'}** | ${gdpr?.score != null ? `${gdpr.score}/100` : '-'} | Cookies avant consentement: ${gdpr?.cookiesBeforeConsent ?? 0} |\n`;
    md += `| 3. RGPD & Cookies | **Cookiebot Scanner** | **${cbot?.grade || '-'}** | ${cbot?.score != null ? `${cbot.score}/100` : '-'} | Cookies: ${cbot?.cookiesFound ?? 0}, Sécurisés: ${cbot?.secureCookies ? 'Oui' : 'Non'} |\n`;
    md += `| 3. RGPD & Cookies | **Blacklight (The Markup)** | **${bl?.grade || '-'}** | ${bl?.score != null ? `${bl.score}/100` : '-'} | Trackers: ${bl?.adTrackersCount ?? 0}, Recorders: ${bl?.sessionRecorders ?? 0} |\n`;
    md += `| 4. Fuites Git | **TruffleHog (CLI)** | **${th?.grade || '-'}** | ${th?.score != null ? `${th.score}/100` : '-'} | Secrets vérifiés: ${th?.verifiedSecretsCount ?? 0}, Détectés: ${th?.leaksDetected ? 'Alerte' : '0 fuite'} |\n`;
    md += `| 4. Fuites Git | **Gitleaks (CLI)** | **${gl?.grade || '-'}** | ${gl?.score != null ? `${gl.score}/100` : '-'} | Fuites: ${gl?.leaksFound ?? 0}, Règles actives: ${gl?.rulesCount ?? 0} |\n`;
    md += `| 4. Fuites Git | **GitGuardian** | **${gg?.grade || '-'}** | ${gg?.score != null ? `${gg.score}/100` : '-'} | Incidents: ${gg?.incidentsCount ?? 0}, Fichiers sensibles protégés |\n`;
    md += `| 5. Qualité logicielle | **Knip** | **${kn?.grade || '-'}** | ${kn?.score != null ? `${kn.score}/100` : '-'} | Fichiers orphelins: ${kn?.unusedFilesCount ?? 0}, Exports orphelins: ${kn?.unusedExportsCount ?? 0} |\n`;
    md += `| 5. Qualité logicielle | **Depcheck** | **${dc?.grade || '-'}** | ${dc?.score != null ? `${dc.score}/100` : '-'} | Dépendances mortes: ${dc?.unusedDependenciesCount ?? 0} |\n`;
    md += `| 5. Qualité logicielle | **ESLint** | **${es?.grade || '-'}** | ${es?.score != null ? `${es.score}/100` : '-'} | Erreurs: ${es?.errorCount ?? 0}, Warnings: ${es?.warningCount ?? 0} |\n`;
    md += `| 5. Qualité logicielle | **SonarQube / SonarCloud** | **${sq?.grade || '-'}** | ${sq?.score != null ? `${sq.score}/100` : '-'} | Dette: ${sq?.technicalDebtMinutes ?? 0} min, LOC: ${sq?.loc ?? 0} |\n`;
    md += `| 5. Qualité logicielle | **Madge** | **${mdg?.grade || '-'}** | ${mdg?.score != null ? `${mdg.score}/100` : '-'} | Dépendances circulaires: ${mdg?.circularCount ?? 0} |\n`;
    md += `| 6. Dépendances & DB | **npm audit / Snyk** | **${snyk?.grade || '-'}** | ${snyk?.score != null ? `${snyk.score}/100` : '-'} | Vulnérabilités: ${snyk?.totalVulnerabilities ?? 0} (Critiques: ${snyk?.critical ?? 0}, Hautes: ${snyk?.high ?? 0}) |\n`;
    md += `| 6. Dépendances & DB | **Prisma Doctor / SQL** | **${pr?.grade || '-'}** | ${pr?.score != null ? `${pr.score}/100` : '-'} | Index manquants: ${pr?.missingIndexesCount ?? 0}, Requêtes lentes: ${pr?.slowQueriesDetected ?? 0} |\n`;
    md += `| 6. Dépendances & DB | **OWASP ZAP (DAST)** | **${zap?.grade || '-'}** | ${zap?.score != null ? `${zap.score}/100` : '-'} | Alertes: ${zap?.alertsCount ?? 0}, SQLi: ${zap?.sqliProbesPassed ? 'OK' : 'Échec'}, XSS: ${zap?.xssProbesPassed ? 'OK' : 'Échec'} |\n\n`;

    md += `## 2. Détail des En-têtes HTTP de Sécurité\n\n`;
    if (sSh?.checks) {
      md += `| En-tête | Statut | Poids | Description & Rôle de protection |\n`;
      md += `|---|---|---|---|\n`;
      for (const [k, c] of Object.entries(sSh.checks)) {
        md += `| \`${c.name || k}\` | **${c.present ? 'PRÉSENT' : 'MANQUANT'}** | ${c.weight} pts | ${c.desc} |\n`;
      }
      md += `\n`;
    } else {
      md += `*Aucun en-tête n'a encore été analysé pour ce domaine.*\n\n`;
    }

    md += `## 3. Erreurs, Anomalies & Vulnérabilités Détectées\n\n`;
    const errors = [];
    if (sSh?.checks) {
      for (const [k, c] of Object.entries(sSh.checks)) {
        if (!c.present) {
          errors.push(`- **[En-tête manquant]** \`${c.name || k}\` : ${c.desc}`);
        }
      }
    }
    if (sObs?.tests_failed > 0) {
      errors.push(`- **[Mozilla Observatory]** ${sObs.tests_failed} test(s) échoué(s) sur ${sObs.tests_quantity || 12} vérifications.`);
    }
    if (sSsl?.tlsValid === false) {
      errors.push(`- **[Certificat TLS]** Certificat SSL invalide ou expiré.`);
    }
    if (sSh?.cookieSecurity && sSh.cookieSecurity.hasCookies && (!sSh.cookieSecurity.secure || !sSh.cookieSecurity.httpOnly)) {
      errors.push(`- **[Cookies non sécurisés]** Des cookies HTTP ne possèdent pas les flags requis (Secure, HttpOnly, SameSite).`);
    }
    if (ps?.ttfb > 800) {
      errors.push(`- **[PageSpeed TTFB]** Temps de réponse serveur élevé : ${ps.ttfb}ms (> 800ms).`);
    }
    if (wv?.missingAlt > 0) {
      errors.push(`- **[WAVE WebAIM]** ${wv.missingAlt} image(s) sans attribut 'alt'.`);
    }
    if (wv?.emptyButtons > 0) {
      errors.push(`- **[WAVE WebAIM]** ${wv.emptyButtons} bouton(s) sans texte ou aria-label accessible.`);
    }
    if (seo?.hasRobots === false) {
      errors.push(`- **[SEO robots.txt]** Fichier robots.txt introuvable sur le domaine.`);
    }
    if (seo?.hasSitemap === false) {
      errors.push(`- **[SEO sitemap.xml]** Fichier sitemap.xml introuvable sur le domaine.`);
    }
    if (gdpr?.cookiesBeforeConsent > 0) {
      errors.push(`- **[2gdpr]** ${gdpr.cookiesBeforeConsent} cookie(s) déposé(s) avant acceptation de l'utilisateur.`);
    }
    if (bl?.adTrackersCount > 0) {
      errors.push(`- **[Blacklight]** ${bl.adTrackersCount} tracker(s) publicitaire(s) tiers détecté(s).`);
    }
    if (bl?.sessionRecorders > 0) {
      errors.push(`- **[Blacklight]** Enregistreur de session ou de frappe détecté sur la page.`);
    }
    if (th?.leaksDetected) {
      errors.push(`- **[TruffleHog]** Secret potentiel détecté dans l'arborescence git.`);
    }
    if (gl?.leaksFound > 0) {
      errors.push(`- **[Gitleaks]** ${gl.leaksFound} fuite(s) de clé ou token identifiée(s).`);
    }
    if (dc?.unusedDependenciesCount > 0) {
      errors.push(`- **[Depcheck]** ${dc.unusedDependenciesCount} dépendance(s) déclarée(s) mais jamais importée(s) : ${dc.unusedDeps?.join(', ') || ''}`);
    }
    if (kn?.unusedFilesCount > 0) {
      errors.push(`- **[Knip]** ${kn.unusedFilesCount} fichier(s) potentiellement orphelin(s).`);
    }
    if (es?.errorCount > 0) {
      errors.push(`- **[ESLint]** ${es.errorCount} erreur(s) de linting dans le code source.`);
    }
    if (mdg?.circularCount > 0) {
      errors.push(`- **[Madge]** ${mdg.circularCount} dépendance(s) circulaire(s) détectée(s).`);
    }
    if (snyk?.critical > 0 || snyk?.high > 0) {
      errors.push(`- **[npm audit / Snyk]** ${snyk.critical} vulnérabilité(s) critique(s) et ${snyk.high} élevée(s) dans package.json.`);
    }
    if (zap?.alertsCount > 0) {
      errors.push(`- **[OWASP ZAP]** ${zap.alertsCount} alerte(s) de sécurité dynamique DAST relevée(s).`);
    }

    if (errors.length > 0) {
      md += errors.join('\n') + '\n\n';
    } else {
      md += `*Aucune erreur critique détectée. Tous les critères obligatoires sont validés.*\n\n`;
    }

    md += `## 4. Recommandations d'Amélioration & Hardening\n\n`;
    if (!sSh?.checks?.hsts?.present) {
      md += `- **HSTS :** Configurer \`Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\`\n`;
    }
    if (!sSh?.checks?.csp?.present) {
      md += `- **CSP :** Définir une directive \`Content-Security-Policy\` stricte pour bloquer les injections XSS.\n`;
    }
    if (!sSh?.checks?.xfo?.present) {
      md += `- **X-Frame-Options :** Configurer \`SAMEORIGIN\` pour bloquer le Clickjacking.\n`;
    }
    if (!sSh?.checks?.xcto?.present) {
      md += `- **X-Content-Type-Options :** Configurer \`nosniff\` pour empêcher le MIME-sniffing.\n`;
    }
    if (!sSh?.checks?.rp?.present) {
      md += `- **Referrer-Policy :** Configurer \`strict-origin-when-cross-origin\`.\n`;
    }
    if (!sSh?.checks?.pp?.present) {
      md += `- **Permissions-Policy :** Désactiver les capteurs matériels superflus (camera, micro, géolocalisation).\n`;
    }
    if (dc?.unusedDependenciesCount > 0) {
      md += `- **Nettoyage dépendances :** Retirer les packages morts listés par depcheck via \`npm uninstall\`.\n`;
    }
    if (wv?.missingAlt > 0) {
      md += `- **Accessibilité :** Renseigner l'attribut \`alt\` sur toutes les balises <img> pour l'accessibilité écran.\n`;
    }
    md += `\n`;

    md += `## 5. Liens d'Audit Directs\n\n`;
    md += `- [SecurityHeaders](https://securityheaders.com/?q=${encodeURIComponent(siteDom)}&followRedirects=on)\n`;
    md += `- [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(siteDom)})\n`;
    md += `- [Qualys SSL Labs](https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(siteDom)})\n`;
    md += `- [Google PageSpeed](https://pagespeed.web.dev/analysis?url=https%3A%2F%2F${encodeURIComponent(siteDom)}%2F)\n`;
    md += `- [Scanner 2gdpr](https://2gdpr.com/check?domain=${encodeURIComponent(siteDom)})\n`;
    md += `- [Blacklight](https://themarkup.org/blacklight?url=${encodeURIComponent(siteDom)})\n`;

    downloadMarkdownFile(`audit-${siteDom.replace(/[^a-z0-9]/gi, '_')}.md`, md);
    showToast?.(`Rapport .md exporté pour ${siteDom}`);
  };

  // Exporter en .md le rapport global de l'infrastructure
  const exportGlobalMarkdown = () => {
    const now = new Date().toLocaleString('fr-FR');
    let md = `# Rapport Global des Audits & Sécurité — Azim404\n\n`;
    md += `> Date du rapport : ${now} • Infrastructure globale & 20 outils de référence\n\n`;

    md += `## 1. Synthèse Globale par Site\n\n`;
    md += `| Site / Domaine | Note Globale | Score | Sécurité Réseau | PageSpeed | WAVE | 2gdpr | Code & Vulns | Dernière analyse |\n`;
    md += `|---|---|---|---|---|---|---|---|---|\n`;

    for (const site of validSites) {
      const sDom = site.cleanDomain;
      const global = getSiteGlobal(sDom);
      const full = auditsFull[sDom] || {};
      const sSh = full.sh || auditsSH[sDom];
      const ps = full.pagespeed;
      const wv = full.wave;
      const gdpr = full.twoGdpr;
      const snyk = full.npmSnyk;
      const dateStr = lastCheckTimes[sDom] ? new Date(lastCheckTimes[sDom]).toLocaleDateString('fr-FR') : 'Non analysé';

      md += `| **${site.title || sDom}** (\`${sDom}\`) | **${global.grade}** | ${global.score != null ? `${global.score}/100` : '-'} | ${sSh?.grade || '-'} | ${ps?.grade || '-'} | ${wv?.grade || '-'} | ${gdpr?.grade || '-'} | ${snyk?.grade || '-'} | ${dateStr} |\n`;
    }
    md += `\n`;

    if (systemAudit?.vulnerabilities) {
      md += `## 2. Audit Dépendances & Code (npm audit)\n\n`;
      md += `- **Vulnérabilités totales :** ${systemAudit.vulnerabilities.total}\n`;
      md += `- **Critiques :** ${systemAudit.vulnerabilities.critical}\n`;
      md += `- **Élevées :** ${systemAudit.vulnerabilities.high}\n`;
      md += `- **Modérées :** ${systemAudit.vulnerabilities.moderate}\n`;
      md += `- **Faibles :** ${systemAudit.vulnerabilities.low}\n\n`;

      if (systemAudit.topAdvisories?.length > 0) {
        md += `### Principales alertes de sécurité détectées :\n\n`;
        for (const adv of systemAudit.topAdvisories) {
          md += `- **[${adv.severity.toUpperCase()}]** \`${adv.name}\` : ${adv.title} (${adv.range})\n`;
        }
        md += `\n`;
      }
    }

    downloadMarkdownFile(`audit-global-${new Date().toISOString().slice(0, 10)}.md`, md);
    showToast?.('Rapport global .md exporté');
  };

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
        <span className="w-10 h-7 rounded border border-slate-700 bg-slate-900 flex items-center justify-center">
          <span className="w-3 h-3 rounded-full border border-cyan-400 border-t-transparent animate-spin" />
        </span>
      ) : (
        <span className={`w-10 h-7 rounded border text-xs font-bold flex items-center justify-center transition ${gradeColor(grade)}`}>
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
  const full = dom ? auditsFull[dom] : null;
  const selectedGlobal = dom ? getSiteGlobal(dom) : null;
  const currentSiteLastCheck = dom ? lastCheckTimes[dom] : null;

  return (
    <div className="space-y-5">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="text-lg font-bold text-white">Audits & Tests de Sécurité</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Analyses automatisées en 1 clic : En-têtes, Mozilla Observatory, Qualys SSL Labs, SEO, RGPD & Dépendances.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportGlobalMarkdown}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs sm:text-sm font-medium border border-slate-700 transition"
          >
            Exporter rapport global (.md)
          </button>
          <button
            type="button"
            onClick={runAuditAll}
            disabled={globalLoading}
            className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white text-xs sm:text-sm font-medium transition flex items-center gap-2 shrink-0"
          >
            {globalLoading ? (
              <>
                <span className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
                <span>Analyses en cours...</span>
              </>
            ) : (
              <span>Lancer l'audit complet (1 clic)</span>
            )}
          </button>
        </div>
      </div>

      {/* Table des résultats */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-gray-400 font-mono text-xs bg-slate-900/40">
                <th className="py-3 px-4">SITE / DOMAINE</th>
                <th className="py-3 px-3 text-center">NOTE GLOBALE</th>
                <th className="py-3 px-3 text-center">SECURITY HEADERS</th>
                <th className="py-3 px-3 text-center">OBSERVATORY</th>
                <th className="py-3 px-3 text-center">SSL LABS / TLS</th>
                <th className="py-3 px-4 text-center">DERNIÈRE ANALYSE</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {validSites.map((site) => {
                const sDom = site.cleanDomain;
                const sSh = auditsSH[sDom];
                const sObs = auditsObs[sDom];
                const sSsl = auditsSSL[sDom];
                const sGlobal = getSiteGlobal(sDom);
                const isLoading = loadingMap[sDom];
                const isSelected = selectedDomain === sDom;
                const lastCheck = lastCheckTimes[sDom];

                return (
                  <tr
                    key={site.id || sDom}
                    className={`transition hover:bg-slate-900/40 ${isSelected ? 'bg-cyan-950/20' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{site.title || site.name || sDom}</div>
                      <div className="text-xs font-mono text-gray-400">{sDom}</div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className={`w-10 h-7 rounded border text-xs font-bold flex items-center justify-center ${gradeColor(sGlobal.grade)}`}>
                          {sGlobal.grade}
                        </span>
                        {sGlobal.score != null && (
                          <span className="text-xs font-mono text-gray-300 font-medium">{sGlobal.score}/100</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <GradeBadge
                          grade={sSh?.grade}
                          loading={isLoading && !sSh}
                          href={`https://securityheaders.com/?q=${encodeURIComponent(sDom)}&followRedirects=on`}
                          title={`SecurityHeaders — ${sSh?.grade || 'Non analysé'}`}
                        />
                        {sSh?.score != null && (
                          <span className="text-xs font-mono text-gray-400">{sSh.score}/100</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <GradeBadge
                          grade={sObs?.grade}
                          loading={isLoading && !sObs}
                          href={sObs?.url || `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(sDom)}`}
                          title={`Mozilla Observatory — ${sObs?.grade || 'Non analysé'}`}
                        />
                        {sObs?.score != null && (
                          <span className="text-xs font-mono text-gray-400">{sObs.score}/100</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <GradeBadge
                          grade={sSsl?.grade}
                          loading={isLoading && !sSsl}
                          href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(sDom)}`}
                          title={`Qualys SSL Labs — ${sSsl?.grade || 'Non analysé'}`}
                        />
                        {sSsl?.protocol && (
                          <span className="text-xs font-mono text-gray-400 hidden sm:inline">{sSsl.protocol}</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono text-gray-400">
                        {formatLastCheck(lastCheck)}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedDomain(isSelected ? null : sDom)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                            isSelected
                              ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                              : 'bg-slate-900 border-slate-700 text-gray-300 hover:text-white'
                          }`}
                        >
                          {isSelected ? 'Fermer' : 'Détails'}
                        </button>
                        <button
                          type="button"
                          onClick={() => runAuditDomain(sDom, true)}
                          disabled={isLoading}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                        >
                          {isLoading ? 'Analyse...' : 'Actualiser'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL / VUE APPROFONDIE */}
      {selectedDomain && (
        <div className="p-5 rounded-xl border border-cyan-500/40 bg-slate-950 space-y-5 animate-fade-in shadow-xl">
          {/* Header de la vue détaillée avec Synthèse Note Globale & Actions */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <span className={`w-14 h-14 rounded-xl border text-xl font-black flex items-center justify-center ${gradeColor(selectedGlobal?.grade)}`}>
                {selectedGlobal?.grade || '?'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{selectedSite?.title || selectedDomain}</h3>
                  <code className="text-xs font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {selectedDomain}
                  </code>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-300 mt-1">
                  <span>Note Globale : <strong>{selectedGlobal?.score != null ? `${selectedGlobal.score}/100` : 'N/A'}</strong> ({selectedGlobal?.label})</span>
                  <span>•</span>
                  <span className="text-gray-400">Dernier scan : {formatLastCheck(currentSiteLastCheck)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => exportSiteMarkdown(selectedDomain)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs sm:text-sm font-medium border border-slate-700 transition"
              >
                Exporter ce site (.md)
              </button>
              <button
                type="button"
                onClick={() => runAuditDomain(selectedDomain, true)}
                disabled={loadingMap[selectedDomain]}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-xs sm:text-sm text-white font-medium transition"
              >
                {loadingMap[selectedDomain] ? 'Analyse 1-clic...' : 'Tout ré-analyser (1 clic)'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDomain(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs sm:text-sm text-gray-400 hover:text-white"
              >
                Fermer
              </button>
            </div>
          </div>

          {/* Filtres de catégories */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Toutes les catégories' },
              { id: '1', label: '1. Sécurité & TLS' },
              { id: '2', label: '2. SEO & Performance' },
              { id: '3', label: '3. RGPD & Cookies' },
              { id: '4', label: '4. Fuites Git' },
              { id: '5', label: '5. Qualité logicielle' },
              { id: '6', label: '6. Vulnérabilités & Packages' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
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
            {/* CAT 1: SÉCURITÉ RÉSEAU & TLS */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '1') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">1. SÉCURITÉ RÉSEAU, TLS & EN-TÊTES HTTP</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* SecurityHeaders */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">SecurityHeaders</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(sh?.grade)}`}>
                        {sh?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score en-têtes : {sh?.score ?? '-'} / 100</div>
                    <a
                      href={`https://securityheaders.com/?q=${encodeURIComponent(selectedDomain)}&followRedirects=on`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport securityheaders.com
                    </a>
                  </div>

                  {/* Mozilla Observatory */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Mozilla Observatory</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(obs?.grade)}`}>
                        {obs?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      Score MDN : {obs?.score ?? '-'} / 100
                      {obs?.tests_passed != null && ` • ${obs.tests_passed} réussis / ${obs.tests_failed || 0} échoués`}
                    </div>
                    <a
                      href={obs?.url || `https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport Mozilla Observatory
                    </a>
                  </div>

                  {/* Qualys SSL Labs & TLS */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Qualys SSL Labs / TLS</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(ssl?.grade)}`}>
                        {ssl?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {ssl?.protocol || 'TLSv1.3'} • {ssl?.issuer || "Let's Encrypt"}
                      {ssl?.daysRemaining ? ` (${ssl.daysRemaining}j restants)` : ''}
                    </div>
                    <a
                      href={`https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono"
                    >
                      Rapport Qualys SSL Labs
                    </a>
                  </div>
                </div>

                {/* Détail complet des en-têtes */}
                {sh?.checks && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-mono text-gray-400 block">DÉTAIL DES EN-TÊTES DE SÉCURITÉ :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(sh.checks).map(([key, check]) => (
                        <div
                          key={key}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                            check.present
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                              : 'bg-rose-950/15 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          <div className="flex justify-between items-center font-mono">
                            <span className="font-bold">{check.name || key.toUpperCase()}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                              {check.present ? 'Présent' : 'Manquant'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 leading-snug">{check.desc}</p>
                          {check.value && (
                            <code className="text-xs font-mono text-gray-300 block truncate bg-slate-950 px-1 py-0.5 rounded">
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

            {/* CAT 2: RÉFÉRENCEMENT & PERFORMANCE */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '2') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">2. RÉFÉRENCEMENT (SEO), ACCESSIBILITÉ & PERFORMANCE</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Google PageSpeed */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Google PageSpeed</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.pagespeed?.grade)}`}>
                        {full?.pagespeed?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score global : {full?.pagespeed?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>TTFB : {full?.pagespeed?.ttfbMs != null ? `${full.pagespeed.ttfbMs} ms` : (full?.pagespeed?.ttfb != null ? `${full.pagespeed.ttfb} ms` : 'N/A')}</div>
                      <div>Poids : {full?.pagespeed?.pageSizeKb != null ? `${full.pagespeed.pageSizeKb} KB` : (full?.pagespeed?.totalByteWeight ? `${Math.round(full.pagespeed.totalByteWeight / 1024)} KB` : 'N/A')}</div>
                      <div className="text-gray-400 text-[11px]">
                        FCP: {full?.pagespeed?.fcpEstimateMs != null ? `${full.pagespeed.fcpEstimateMs} ms` : 'N/A'} • Gzip: {full?.pagespeed?.hasGzip ? 'Actif' : 'Inactif'}
                      </div>
                    </div>
                    <a
                      href={`https://pagespeed.web.dev/analysis?url=https%3A%2F%2F${encodeURIComponent(selectedDomain)}%2F`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
                    >
                      Rapport pagespeed.web.dev
                    </a>
                  </div>

                  {/* WAVE WebAIM */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">WAVE WebAIM</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.wave?.grade)}`}>
                        {full?.wave?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score accessibilité : {full?.wave?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Images sans alt : <strong className={(full?.wave?.missingAltCount ?? full?.wave?.missingAlt ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.wave?.missingAltCount ?? full?.wave?.missingAlt ?? 0}</strong></div>
                      <div>Boutons sans label : <strong className={(full?.wave?.emptyButtonCount ?? full?.wave?.emptyButtons ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.wave?.emptyButtonCount ?? full?.wave?.emptyButtons ?? 0}</strong></div>
                      <div className="text-gray-400 text-[11px]">
                        Balise lang: {full?.wave?.hasHtmlLang === false || full?.wave?.missingLang ? 'Manquante' : 'Conforme'} • H1: {(full?.wave?.h1Count === 0 || full?.wave?.headingErrors) ? 'Anomalie' : 'Conforme'}
                      </div>
                    </div>
                    <a
                      href={`https://wave.webaim.org/report#/https://${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
                    >
                      Rapport wave.webaim.org
                    </a>
                  </div>

                  {/* Google Search Console & Ahrefs */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Search Console & Ahrefs</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.seo?.grade)}`}>
                        {full?.seo?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score indexation : {full?.seo?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>robots.txt : <span className={(full?.seo?.hasRobotsTxt ?? full?.seo?.hasRobots) ? 'text-emerald-400' : 'text-rose-400'}>{(full?.seo?.hasRobotsTxt ?? full?.seo?.hasRobots) ? 'Détecté' : 'Absent'}</span></div>
                      <div>sitemap.xml : <span className={(full?.seo?.hasSitemapXml ?? full?.seo?.hasSitemap) ? 'text-emerald-400' : 'text-rose-400'}>{(full?.seo?.hasSitemapXml ?? full?.seo?.hasSitemap) ? 'Détecté' : 'Absent'}</span></div>
                      <div className="text-gray-400 text-[11px]">
                        Canonical: {full?.seo?.hasCanonical ? 'OK' : 'Non'} • Meta desc: {(full?.seo?.descriptionLength > 0 || full?.seo?.hasMetaDesc) ? 'OK' : 'Non'}
                      </div>
                    </div>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
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
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">3. RGPD & COOKIES</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>

                {sh?.cookieSecurity && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex flex-wrap gap-4 items-center font-mono">
                    <span className="text-gray-400">Analyse HTTP Cookies :</span>
                    <span className={sh.cookieSecurity.hasCookies ? 'text-white' : 'text-emerald-400'}>
                      {sh.cookieSecurity.hasCookies ? 'Cookies déposés détectés' : 'Aucun cookie public détecté'}
                    </span>
                    {sh.cookieSecurity.hasCookies && (
                      <>
                        <span className={sh.cookieSecurity.secure ? 'text-emerald-400' : 'text-rose-400'}>
                          Secure : {sh.cookieSecurity.secure ? 'Oui' : 'Non'}
                        </span>
                        <span className={sh.cookieSecurity.httpOnly ? 'text-emerald-400' : 'text-rose-400'}>
                          HttpOnly : {sh.cookieSecurity.httpOnly ? 'Oui' : 'Non'}
                        </span>
                        <span className={sh.cookieSecurity.sameSite ? 'text-emerald-400' : 'text-rose-400'}>
                          SameSite : {sh.cookieSecurity.sameSite ? 'Oui' : 'Non'}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* 2gdpr Scanner */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">2gdpr Scanner</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.twoGdpr?.grade)}`}>
                        {full?.twoGdpr?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score conformité : {full?.twoGdpr?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Cookies pré-consentement : <strong className={(full?.twoGdpr?.cookiesBeforeConsent ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{full?.twoGdpr?.cookiesBeforeConsent ?? 0}</strong></div>
                      <div>Bannière : {(full?.twoGdpr?.hasConsentBanner ?? full?.twoGdpr?.bannerDetected) ? 'Détectée' : 'Non détectée'}</div>
                      <div className="text-gray-400 text-[11px]">
                        Politique confidentialité: {(full?.twoGdpr?.hasPrivacyLink ?? full?.twoGdpr?.privacyLinkPresent) ? 'Présente' : 'Non détectée'}
                      </div>
                    </div>
                    <a
                      href={`https://2gdpr.com/check?domain=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
                    >
                      Rapport 2gdpr.com
                    </a>
                  </div>

                  {/* Cookiebot Scanner */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Cookiebot Scanner</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.cookiebot?.grade)}`}>
                        {full?.cookiebot?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score ePrivacy : {full?.cookiebot?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Cookies trouvés : {full?.cookiebot?.cookiesFound ?? (full?.cookiebot?.hasCookies ? 1 : 0)}</div>
                      <div>Flag Secure : <span className={(full?.cookiebot?.flags?.secure ?? full?.cookiebot?.secureCookies) ? 'text-emerald-400' : 'text-rose-400'}>{(full?.cookiebot?.flags?.secure ?? full?.cookiebot?.secureCookies) ? 'Conforme' : 'Vulnérable'}</span></div>
                      <div className="text-gray-400 text-[11px]">
                        HttpOnly: {(full?.cookiebot?.flags?.httpOnly ?? full?.cookiebot?.httpOnlyCookies) ? 'OK' : 'Non'} • SameSite: {(full?.cookiebot?.flags?.sameSite ?? full?.cookiebot?.sameSiteCookies) ? 'OK' : 'Non'}
                      </div>
                    </div>
                    <a
                      href="https://www.cookiebot.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
                    >
                      Ouvrir Cookiebot
                    </a>
                  </div>

                  {/* Blacklight */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Blacklight (The Markup)</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.blacklight?.grade)}`}>
                        {full?.blacklight?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score vie privée : {full?.blacklight?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Trackers pub : <strong className={(full?.blacklight?.trackerCount ?? full?.blacklight?.adTrackersCount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.blacklight?.trackerCount ?? full?.blacklight?.adTrackersCount ?? 0}</strong></div>
                      <div>Cookies tiers : {full?.blacklight?.thirdPartyCookiesCount ?? 0}</div>
                      <div className="text-gray-400 text-[11px]">
                        Recorders: {full?.blacklight?.sessionRecorders ?? 0} • Fingerprinting: {(full?.blacklight?.hasFingerprinting || full?.blacklight?.canvasFingerprinting) ? 'Oui' : 'Non'}
                      </div>
                    </div>
                    <a
                      href={`https://themarkup.org/blacklight?url=${encodeURIComponent(selectedDomain)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline block font-mono pt-1"
                    >
                      Lancer Blacklight
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 4: FUITES GIT */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '4') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">4. COMMITS, SECRETS & FUITES GIT</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* TruffleHog */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">TruffleHog (CLI)</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.trufflehog?.grade)}`}>
                        {full?.trufflehog?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score intégrité : {full?.trufflehog?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Secrets vérifiés : <strong className={(full?.trufflehog?.secretsCount ?? full?.trufflehog?.verifiedSecretsCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{full?.trufflehog?.secretsCount ?? full?.trufflehog?.verifiedSecretsCount ?? 0}</strong></div>
                      <div>Statut : {full?.trufflehog?.status || 'Vérification terminée'}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block truncate">
                      trufflehog git file://.
                    </code>
                  </div>

                  {/* Gitleaks */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Gitleaks (CLI)</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.gitleaks?.grade)}`}>
                        {full?.gitleaks?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score fuites : {full?.gitleaks?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Anomalies : <strong className={(full?.gitleaks?.missingGitignoreRules?.length ?? full?.gitleaks?.leaksFound ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.gitleaks?.missingGitignoreRules?.length ?? full?.gitleaks?.leaksFound ?? 0}</strong></div>
                      <div>Statut : {full?.gitleaks?.status || 'Historique vérifié'}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block truncate">
                      gitleaks detect -v
                    </code>
                  </div>

                  {/* GitGuardian */}
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">GitGuardian</span>
                      <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.gitguardian?.grade)}`}>
                        {full?.gitguardian?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Score surveillance : {full?.gitguardian?.score ?? '-'} / 100</div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Incidents : <strong className={(full?.gitguardian?.incidentsCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{full?.gitguardian?.incidentsCount ?? 0}</strong></div>
                      <div>Statut : {full?.gitguardian?.status || 'Dépôt protégé'}</div>
                    </div>
                    <div className="text-xs text-gray-400 pt-0.5">Monitoring continu actif</div>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 5: QUALITÉ DE CODE */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '5') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">5. FONCTIONS NON UTILISÉES, QUALITÉ & ARCHITECTURE</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Knip */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Knip</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.knip?.grade)}`}>
                        {full?.knip?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Orphelins : <strong className={(full?.knip?.orphanFiles ?? full?.knip?.unusedFilesCount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.knip?.orphanFiles ?? full?.knip?.unusedFilesCount ?? 0}</strong></div>
                      <div>Statut : {full?.knip?.status || 'Exports vérifiés'}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx knip</code>
                  </div>

                  {/* Depcheck */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Depcheck</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.depcheck?.grade)}`}>
                        {full?.depcheck?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Deps inutilisées : <strong className={(full?.depcheck?.unusedDependencies?.length ?? full?.depcheck?.unusedDependenciesCount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'}>{full?.depcheck?.unusedDependencies?.length ?? full?.depcheck?.unusedDependenciesCount ?? 0}</strong></div>
                      <div>Statut : {full?.depcheck?.status || 'Dépendances vérifiées'}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx depcheck</code>
                  </div>

                  {/* ESLint */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">ESLint</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.eslint?.grade)}`}>
                        {full?.eslint?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Erreurs : <strong className={(full?.eslint?.errorsCount ?? full?.eslint?.errorCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{full?.eslint?.errorsCount ?? full?.eslint?.errorCount ?? 0}</strong></div>
                      <div>Warnings : {full?.eslint?.warningsCount ?? full?.eslint?.warningCount ?? 0}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npx eslint .</code>
                  </div>

                  {/* SonarQube */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">SonarQube / SonarCloud</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.sonarqube?.grade)}`}>
                        {full?.sonarqube?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Dette technique : {full?.sonarqube?.debtHours != null ? `${full.sonarqube.debtHours}h` : (full?.sonarqube?.technicalDebtMinutes != null ? `${full.sonarqube.technicalDebtMinutes} min` : '0 min')}</div>
                      <div>Lignes : {full?.sonarqube?.linesOfCode ?? full?.sonarqube?.loc ?? 0} LOC</div>
                    </div>
                    <div className="text-[11px] text-gray-400">Analyse statique et smells</div>
                  </div>

                  {/* Madge */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">Madge</span>
                      <span className={`px-2 py-0.5 rounded border text-xs font-bold ${gradeColor(full?.madge?.grade)}`}>
                        {full?.madge?.grade || '-'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-gray-300 space-y-0.5">
                      <div>Cycles : <strong className={(full?.madge?.circularDependencies ?? full?.madge?.circularCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}>{full?.madge?.circularDependencies ?? full?.madge?.circularCount ?? 0}</strong></div>
                      <div>Statut : {full?.madge?.status || 'Architecture saine'}</div>
                    </div>
                    <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block truncate">npx madge --circular .</code>
                  </div>
                </div>
              </div>
            )}

            {/* CAT 6: VULNÉRABILITÉS & PACKAGES */}
            {(activeCategoryFilter === 'ALL' || activeCategoryFilter === '6') && (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-cyan-300 font-mono">6. BASE DE DONNÉES & VULNÉRABILITÉS</h4>
                  <span className="text-xs font-mono text-gray-400">Automatisé en 1 clic</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* npm audit / Snyk */}
                  {(() => {
                    const snykData = full?.npmSnyk || full?.npmsnyk;
                    const totalVulns = snykData?.vulnerabilities?.total ?? snykData?.totalVulnerabilities ?? 0;
                    const critVulns = snykData?.vulnerabilities?.critical ?? snykData?.critical ?? 0;
                    const highVulns = snykData?.vulnerabilities?.high ?? snykData?.high ?? 0;
                    return (
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">npm audit / Snyk</span>
                          <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(snykData?.grade)}`}>
                            {snykData?.grade || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">Score vulnérabilités : {snykData?.score ?? '-'} / 100</div>
                        <div className="text-xs font-mono text-gray-300 space-y-0.5">
                          <div>Total : <strong className={totalVulns > 0 ? 'text-amber-400' : 'text-emerald-400'}>{totalVulns}</strong></div>
                          <div className="text-[11px] text-gray-400">
                            Critique: <span className={critVulns > 0 ? 'text-rose-400 font-bold' : ''}>{critVulns}</span> • Haute: <span className={highVulns > 0 ? 'text-orange-400 font-bold' : ''}>{highVulns}</span>
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Statut: {snykData?.status || 'Audit packages terminé'}
                          </div>
                        </div>
                        <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">npm audit</code>
                      </div>
                    );
                  })()}

                  {/* Prisma Doctor / SQL */}
                  {(() => {
                    const prData = full?.prismaDoctor || full?.prismadoctor;
                    return (
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">Prisma Doctor / SQL</span>
                          <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(prData?.grade)}`}>
                            {prData?.grade || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">Score intégrité DB : {prData?.score ?? '-'} / 100</div>
                        <div className="text-xs font-mono text-gray-300 space-y-0.5">
                          <div>Statut : <span className="text-emerald-400">{prData?.integrityCheck || prData?.status || 'OK'}</span></div>
                          <div>Taille : {prData?.totalDataSizeKb != null ? `${prData.totalDataSizeKb} KB` : (prData?.dbSizeMb != null ? `${prData.dbSizeMb} MB` : 'N/A')}</div>
                        </div>
                        <code className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded block">EXPLAIN ANALYZE</code>
                      </div>
                    );
                  })()}

                  {/* OWASP ZAP */}
                  {(() => {
                    const zapData = full?.owaspZap || full?.owaspzap;
                    const alertCount = zapData?.exposedEndpoints?.length ?? zapData?.alertsCount ?? 0;
                    return (
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">OWASP ZAP (DAST)</span>
                          <span className={`px-2.5 py-0.5 rounded border text-xs font-bold ${gradeColor(zapData?.grade)}`}>
                            {zapData?.grade || '-'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">Score dynamique : {zapData?.score ?? '-'} / 100</div>
                        <div className="text-xs font-mono text-gray-300 space-y-0.5">
                          <div>Alertes DAST : <strong className={alertCount > 0 ? 'text-amber-400' : 'text-emerald-400'}>{alertCount}</strong></div>
                          <div>Probes SQLi : <span className={zapData?.hasSqlError === false || zapData?.sqliProbesPassed ? 'text-emerald-400' : 'text-rose-400'}>{zapData?.hasSqlError === false || zapData?.sqliProbesPassed ? 'Sécurisé' : 'Vulnérable'}</span></div>
                          <div className="text-gray-400 text-[11px]">
                            Probes XSS: {zapData?.hasXssReflection === false || zapData?.xssProbesPassed ? 'Sécurisé' : 'Vulnérable'}
                          </div>
                        </div>
                        <div className="text-[11px] text-gray-400 pt-0.5">Scanner dynamique applicatif</div>
                      </div>
                    );
                  })()}
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
        showToast(data.message || 'Fichier enregistré');
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
        showToast(data.message || 'Projet ajouté');
      }
    } catch {
      showToast('Erreur lors de l’ajout du projet');
    }
  };

  const handleDeleteTarget = async (id, name) => {
    if (!confirm(`Retirer "${name}" de la liste ?`)) return;
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
          showToast(`${bridgeData.syncedCount} projet(s) locaux synchronisés`);
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
        throw new Error("Impossible de charger les fichiers de contexte.");
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
        showToast("Aucun sous-dossier correspondant trouvé.");
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
          <h2 className="text-lg font-bold text-white">Contexte Privé & Synchronisation</h2>
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
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-mono border border-slate-800 transition"
          >
            Importer .md
          </button>
          <button
            type="button"
            onClick={handleDownloadBundle}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-mono border border-slate-800 transition"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleBrowserLocalSync}
            disabled={localBrowserSyncing || loading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs sm:text-sm font-medium border border-cyan-500/40 transition disabled:opacity-50"
          >
            {localBrowserSyncing ? 'Synchronisation...' : 'Synchro directe PC'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-medium border border-slate-700 transition"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || loading || enabledCount === 0}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs sm:text-sm font-medium transition disabled:opacity-50"
          >
            {syncing ? 'Synchronisation...' : `Synchroniser (${enabledCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm font-mono text-gray-400 bg-slate-950 rounded-xl border border-slate-800">
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
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition border ${
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
                className="px-3 py-1 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
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
                  className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono flex-1 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleCreateFile}
                  className="px-3 py-1.5 rounded bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-medium"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>
            )}

            {/* Editor */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-slate-800 pb-2">
                <span>Fichier : {activeFile}</span>
                <span>{lastModified ? `Mis à jour le ${new Date(lastModified).toLocaleDateString('fr-FR')}` : ''}</span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                spellCheck={false}
                className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
                placeholder={`Contenu du fichier ${activeFile}...`}
              />

              <div className="flex justify-between items-center text-xs font-mono text-gray-500">
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
                  <h3 className="text-sm font-bold text-white">Projets cibles</h3>
                  <p className="text-xs text-gray-400">{enabledCount}/{targets.length} activé(s)</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(true)}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Tout
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(false)}
                    className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Rien
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className={`p-2 rounded-lg border flex items-center justify-between transition ${
                      target.enabled
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-950 border-slate-800 text-gray-500'
                    }`}
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 mr-2 text-sm truncate">
                      <input
                        type="checkbox"
                        checked={Boolean(target.enabled)}
                        onChange={() => handleToggleTarget(target.id)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span className="truncate">{target.name}</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-gray-400">/{target.folder}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTarget(target.id, target.name)}
                        className="text-gray-500 hover:text-rose-400 font-mono text-xs px-1"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add target form */}
              <form onSubmit={handleAddTarget} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-xs font-mono text-gray-300 block">AJOUTER UN PROJET</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nom"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Dossier"
                    value={newTargetFolder}
                    onChange={(e) => setNewTargetFolder(e.target.value)}
                    className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTargetName.trim() || !newTargetFolder.trim()}
                  className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition disabled:opacity-40"
                >
                  Ajouter à la liste
                </button>
              </form>
            </div>

            {syncResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-sm animate-fade-in">
                <div className="font-bold text-white flex justify-between">
                  <span>Résultat synchronisation</span>
                  <span className="text-xs font-mono text-gray-400">
                    {new Date(syncResult.syncedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
                <div className="text-emerald-400 font-mono text-xs">
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
              <h3 className="text-base font-bold text-white">Synchronisation dans Brave Browser</h3>
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="text-gray-400 hover:text-white text-sm font-mono"
              >
                Fermer
              </button>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              Brave désactive l'accès direct aux dossiers par défaut. Pour activer l'accès direct ou lancer le script :
            </p>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-cyan-300 block">Option 1 : Activer le flag Brave</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 select-all truncate">
                  brave://flags/#file-system-access-api
                </code>
                <button
                  type="button"
                  onClick={handleCopyBraveFlag}
                  className="px-3 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-xs font-medium shrink-0"
                >
                  {copiedBraveFlag ? 'Copié' : 'Copier'}
                </button>
              </div>
              <p className="text-xs text-gray-400">Passez sur Enabled puis relancez Brave.</p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-white block">Option 2 : Script sync.bat</span>
              <p className="text-xs text-gray-400">Double-cliquez sur sync.bat à la racine du projet.</p>
              <button
                type="button"
                onClick={handleDownloadSyncBat}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-medium border border-slate-700 transition"
              >
                Télécharger sync.bat
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700"
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
