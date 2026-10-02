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
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'accounts', 'system'

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

    const cleanDomain = (newDomain || (newLink ? new URL(newLink.startsWith('http') ? newLink : `https://${link}`).hostname : '')).trim().toLowerCase();

    // 1. Save to portfolio showcase and auto-register in context sync targets if allowed
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

    // 2. Also register in site status controller
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

    showToast(`Site / Projet "${newTitle}" ajouté avec succès !`);
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
      allowedProjects: newAccAllowedProjects,
    });
    if (res.success) {
      showToast(`Compte privé "${newAccId}" créé avec succès !`);
      setNewAccId('');
      setNewAccPass('');
      setNewAccName('');
      setNewAccAllowedProjects([]);
    } else {
      setAccountMsg(res.message);
    }
  };

  // Toggle allowed project checkbox
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

  // Filter list if user is a member with restricted access
  const displayedProjects = isAdmin
    ? combinedList
    : combinedList.filter((item) => (user?.allowedProjects || []).includes(item.id));

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

        {/* Tab Navigation */}
        <div className="container mx-auto px-4 sm:px-6 flex gap-2 border-t border-white/5 overflow-x-auto">
          {[
            { id: 'projects', label: 'Démos & Projets', badge: displayedProjects.length },
            { id: 'accounts', label: 'Comptes & Profil', badge: isAdmin ? accounts.length + 1 : 1 },
            { id: 'security', label: 'SecurityHeaders', badge: displayedProjects.length },
            { id: 'context', label: 'Contexte Privé', badge: null },
            { id: 'system', label: 'Supervision VPS', badge: null },
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
                  {isAdmin ? 'Gestion des Démos, Projets & Mode Travaux' : 'Vos Accès Privés & Démos Réservées'}
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {isAdmin
                    ? 'Modifiez les fiches des projets en direct, choisissez de les afficher ou non sur le portfolio public, et basculez la maintenance en un clic.'
                    : 'Applications et démonstrations spécifiquement autorisées pour votre compte par l’administrateur.'}
                </p>
              </div>

              {isAdmin && (
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
                      showToast('Données synchronisées en direct avec le serveur');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-gray-300 hover:text-white transition flex items-center gap-1.5"
                    title="Actualiser depuis le serveur"
                  >
                    <span>↻</span>
                  </button>
                </div>
              )}
            </div>

            {displayedProjects.length === 0 ? (
              <div className="p-12 rounded-3xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
                <span className="text-3xl">🔒</span>
                <h3 className="text-lg font-bold text-white">Aucun projet assigné pour le moment</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Votre compte n'a pas encore de démonstrations spécifiques affectées. Veuillez contacter Sofiane pour débloquer des accès.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {displayedProjects.map((item) => (
                  <UnifiedProjectCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onToggleMaintenance={async (siteId, nextState, patch) => {
                      await toggleSiteMaintenance(siteId, nextState, patch);
                      showToast(
                        nextState
                          ? `🚧 Mode Travaux activé pour ${item.title} !`
                          : `🟢 ${item.title} est de nouveau EN LIGNE !`
                      );
                    }}
                    onTogglePortfolioVisibility={async (id, nextVisible) => {
                      await toggleProjectVisibility(id, nextVisible);
                      showToast(
                        nextVisible
                          ? `👁️ "${item.title}" est maintenant affiché sur le portfolio public`
                          : `🚫 "${item.title}" a été masqué du portfolio (conservé dans l'admin)`
                      );
                    }}
                    onSaveProject={async (projData) => {
                      await savePortfolioProject(projData);
                      showToast(`Projet "${projData.title}" mis à jour en direct !`);
                    }}
                    onSaveSiteConfig={async (siteData) => {
                      await saveSiteConfig(siteData);
                      showToast(`Réglages de travaux enregistrés pour ${siteData.domain}`);
                    }}
                    onDeleteFromAdmin={async (id) => {
                      if (confirm(`Supprimer définitivement "${item.title}" de l'administration ?`)) {
                        if (item.isProject) await deletePortfolioProject(id);
                        await removeSite(id);
                        showToast(`Site supprimé de l'admin`);
                      }
                    }}
                    onPreview={() => setPreviewSite(item.siteConfig || item)}
                    onSelectTab={setActiveTab}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COMPTES & MON PROFIL (CLAIREMENT ORGANISÉ) */}
        {activeTab === 'accounts' && (
          <div className="space-y-10 animate-fade-in">
            {/* Split layout : Section A (Mon Profil) et Section B (Comptes Invités) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* SECTION A : MON PROFIL & SÉCURITÉ */}
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-white/5 pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>🔒 Mon Profil & Identifiants</span>
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono uppercase">
                      {user?.role || 'Membre'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Personnalisez librement votre identifiant et votre mot de passe de connexion.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-300">
                      IDENTIFIANT DE CONNEXION
                    </label>
                    <input
                      type="text"
                      value={myNewId}
                      onChange={(e) => setMyNewId(e.target.value)}
                      placeholder={user?.identifier}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-gray-500">
                      Actuel : <strong className="text-cyan-400">{user?.identifier}</strong>. Laissez vide pour ne pas modifier.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-300">
                      NOUVEAU MOT DE PASSE
                    </label>
                    <input
                      type="password"
                      value={myNewPass}
                      onChange={(e) => setMyNewPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-[11px] text-gray-500">
                      Laissez vide pour conserver votre mot de passe actuel.
                    </p>
                  </div>

                  <div className="space-y-1.5">
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
                    <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-3 rounded-xl border border-cyan-500/30">
                      {profileMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    Sauvegarder mes identifiants
                  </button>
                </form>
              </div>

              {/* SECTION B : CRÉATION D'ACCÈS SUR-MESURE AVEC SÉLECTION DE CONTENU (Admin Only) */}
              {isAdmin ? (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-6">
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>👥 Créer un Compte & Affecter du Contenu</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Créez un compte pour un client ou collaborateur et choisissez exactement les projets auxquels il a accès.
                    </p>
                  </div>

                  <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">IDENTIFIANT</label>
                        <input
                          type="text"
                          value={newAccId}
                          onChange={(e) => setNewAccId(e.target.value)}
                          placeholder="client-xyz"
                          required
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
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
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
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
                          placeholder="ex: Entreprise ABC"
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-mono text-gray-400">RÔLE</label>
                        <select
                          value={newAccPerm}
                          onChange={(e) => setNewAccPerm(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="Accès Démos">Accès Démos Sélectionnées</option>
                          <option value="Client Privé">Client Privé</option>
                          <option value="Testeur VIP">Testeur VIP</option>
                        </select>
                      </div>
                    </div>

                    {/* SELECTEUR DE CONTENU DESTINÉ */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-mono text-cyan-300">
                          PROJETS & DÉMOS AUTORISÉS POUR CE COMPTE
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
                          className="text-[11px] font-mono text-gray-400 hover:text-white underline"
                        >
                          {newAccAllowedProjects.length === combinedList.length ? 'Tout décocher' : 'Tout cocher'}
                        </button>
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1.5 p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                        {combinedList.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-xs select-none"
                          >
                            <input
                              type="checkbox"
                              checked={newAccAllowedProjects.includes(item.id)}
                              onChange={() => handleToggleProjectAccess(item.id)}
                              className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                            />
                            <span className="font-semibold text-white">{item.title}</span>
                            <span className="text-[10px] font-mono text-gray-500 ml-auto">
                              {item.domain || item.badge}
                            </span>
                          </label>
                        ))}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Ce compte verra uniquement les {newAccAllowedProjects.length} projet(s) sélectionné(s).
                      </p>
                    </div>

                    {accountMsg && (
                      <div className="text-xs text-rose-400 font-mono">{accountMsg}</div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-[0_0_15px_rgba(6,182,212,0.3)] transition"
                    >
                      Créer le compte et affecter les accès
                    </button>
                  </form>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs text-gray-400">
                  <h4 className="font-bold text-white text-sm">Gestion des Accès</h4>
                  <p>Votre compte est un compte membre privé. Seul l'administrateur peut créer ou attribuer de nouveaux accès.</p>
                </div>
              )}
            </div>

            {/* TABLEAU DES COMPTES ENREGISTRÉS */}
            {isAdmin && (
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-white">Comptes d'accès créés ({accounts.length + 1})</h3>
                    <p className="text-xs text-gray-400">Liste des utilisateurs autorisés et de leurs projets assignés.</p>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">Stockage persistant</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-gray-400 font-mono">
                        <th className="py-3 px-3">IDENTIFIANT</th>
                        <th className="py-3 px-3">RÉFÉRENCE</th>
                        <th className="py-3 px-3">RÔLE</th>
                        <th className="py-3 px-3">DÉMOS ASSIGNÉES</th>
                        <th className="py-3 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      <tr className="bg-cyan-950/20 font-medium">
                        <td className="py-3 px-3 text-cyan-300 font-mono flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span>{user?.identifier} (Actuel)</span>
                        </td>
                        <td className="py-3 px-3 text-gray-300">{user?.name || 'Sofiane Kherarfa'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px]">
                            SUPER ADMIN
                          </span>
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-mono text-[11px]">
                          Accès total (Tous les projets)
                        </td>
                        <td className="py-3 px-3 text-right text-gray-500 text-[11px] italic">
                          Protégé
                        </td>
                      </tr>

                      {accounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-3 font-mono text-white">{acc.identifier}</td>
                          <td className="py-3 px-3 text-gray-300">{acc.name || '-'}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-gray-300 border border-slate-700 text-[10px]">
                              {acc.permissions || 'Membre'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">
                            {Array.isArray(acc.allowedProjects) && acc.allowedProjects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {acc.allowedProjects.map((pId) => (
                                  <span key={pId} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-[10px]">
                                    {pId}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 italic">Aucun projet</span>
                            )}
                          </td>
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB SÉCURITÉ : NOTES & AUDIT SECURITYHEADERS.COM (À GAUCHE DE SUPERVISION VPS) */}
        {activeTab === 'security' && (
          <SecurityHeadersTab
            sites={displayedProjects}
            showToast={showToast}
          />
        )}

        {/* TAB 4: CONTEXTE PRIVÉ & SYNCHRONISATION */}
        {activeTab === 'context' && (
          <ContextSyncTab showToast={showToast} />
        )}

        {/* TAB 5: SUPERVISION VPS */}
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
                  Contrôlable depuis l'admin avec son mode travaux en 1 clic.
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
                <label className="text-xs font-mono text-gray-300">DESCRIPTION (SUR LE PORTFOLIO)</label>
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
                  <label className="text-xs font-mono text-gray-300">STACK TECHNOLOGIQUE</label>
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

              {/* Visibilité sur le portfolio */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Afficher sur le portfolio public</span>
                  <span className="text-[11px] text-gray-400">Désactivez pour garder le site privé dans l'admin uniquement</span>
                </div>
                <input
                  type="checkbox"
                  checked={newVisibleOnPortfolio}
                  onChange={(e) => setNewVisibleOnPortfolio(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Autorisation synchronisation contexte privé */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Autoriser la synchronisation du contexte privé</span>
                    <span className="text-[11px] text-gray-400">Ajoute automatiquement le projet à la liste et synchronise le dossier agent/</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={newAllowContextSync}
                    onChange={(e) => setNewAllowContextSync(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                </div>
                {newAllowContextSync && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[10px] font-mono text-gray-400 block mb-1">
                      DOSSIER LOCAL / VPS (LAISSER VIDE POUR AUTO-DÉTECTER)
                    </label>
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="ex: nouveau-projet"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
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
                Aperçu du template de travaux pour : <strong>{previewSite.domain || previewSite.title}</strong>
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

// Composant Carte Unifiée avec synchronisation en DIRECT
function UnifiedProjectCard({
  item,
  isAdmin,
  onToggleMaintenance,
  onTogglePortfolioVisibility,
  onSaveProject,
  onSaveSiteConfig,
  onDeleteFromAdmin,
  onPreview,
  onSelectTab,
}) {
  const [isEditing, setIsEditing] = useState(false);

  // Synchronise les champs avec les props pour réactivité immédiate
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
    // 1. Sauvegarde des données du projet (Portfolio)
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

    // 2. Sauvegarde des données de maintenance
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
      className={`p-6 sm:p-8 rounded-3xl border transition-all flex flex-col justify-between ${
        item.inMaintenance
          ? 'bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.15)]'
          : 'bg-slate-950/80 border-slate-800 shadow-xl'
      }`}
    >
      <div>
        {/* Card Header with Status Badge on Top Right */}
        <div className="flex justify-between items-start mb-4 gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400">
                {item.domain || 'Projet'}
              </span>

              {item.isProject && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  item.visibleOnPortfolio
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-900 text-gray-400 border-slate-700'
                }`}>
                  {item.visibleOnPortfolio ? '👁️ Sur Portfolio' : '🚫 Masqué Portfolio'}
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

            {item.inMaintenance && (
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
        {isAdmin && (
          <div className="mb-4">
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
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center justify-center gap-2.5 ${
                item.inMaintenance
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]'
              }`}
            >
              {item.inMaintenance ? (
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
        )}

        {/* Edit Panel (Titre, Description, Stack, Status, Domaine, Portée) */}
        {isAdmin && (
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-gray-400">ÉDITION & PARAMÈTRES</span>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
              >
                {isEditing ? 'Fermer' : 'Modifier les infos / travaux'}
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
                    <label className="text-[11px] font-mono text-gray-400">STACK TECHNOLOGIQUE</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400">LIEN / URL</label>
                    <input
                      type="text"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-gray-400">NOM DE DOMAINE (TRAVAUX)</label>
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="ex: fansite.azim404.com"
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
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
                  <label className="text-[11px] font-mono text-gray-400">MESSAGE DE TRAVAUX (VU PAR LES VISITEURS)</label>
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
                  Enregistrer les modifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer Actions : Visibilité Portfolio vs Suppression Admin */}
      {isAdmin && (
        <div className="pt-4 mt-4 border-t border-white/5 flex flex-wrap gap-2 justify-between items-center">
          <button
            onClick={onPreview}
            className="text-xs text-gray-400 hover:text-white transition font-mono flex items-center gap-1"
          >
            <span>👁 Aperçu travaux</span>
          </button>

          <div className="flex items-center gap-3">
            {/* Toggle Afficher / Retirer du portfolio public SANS supprimer de l'admin */}
            {item.isProject && (
              <button
                onClick={() => onTogglePortfolioVisibility(item.id, !item.visibleOnPortfolio)}
                className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition ${
                  item.visibleOnPortfolio
                    ? 'bg-slate-900 border-slate-700 text-gray-300 hover:text-white'
                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                }`}
                title={item.visibleOnPortfolio ? "Masquer ce projet du portfolio public tout en le gardant dans l'admin" : "Ré-afficher ce projet sur le portfolio public"}
              >
                {item.visibleOnPortfolio ? 'Masquer du portfolio' : 'Ré-afficher sur le portfolio'}
              </button>
            )}

            {/* Supprimer définitivement de l'admin */}
            {item.id !== 'portfolio' && item.id !== 'azim404' && (
              <button
                onClick={() => onDeleteFromAdmin(item.id)}
                className="text-xs text-rose-400/80 hover:text-rose-300 transition font-mono underline"
                title="Supprime définitivement ce site de l'administration et du portfolio"
              >
                Supprimer de l'Admin
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Onglet audit de securite - vue table compacte avec auto-analyse
function SecurityHeadersTab({ sites, showToast }) {
  const [audits, setAudits] = useState(() => {
    try {
      const stored = localStorage.getItem('azim_securityheaders_cache');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [loadingMap, setLoadingMap] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [expandedDomain, setExpandedDomain] = useState(null);
  const hasAutoRun = useRef(false);

  const AUDIT_TOOLS = (dom) => [
    { id: 'securityheaders', name: 'SecurityHdr', desc: 'En-têtes HTTP (note A+ à F)', url: `https://securityheaders.com/?q=${encodeURIComponent(dom)}&followRedirects=on` },
    { id: 'ssllabs', name: 'SSL Labs', desc: 'Audit SSL/TLS complet', url: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(dom)}` },
    { id: 'observatory', name: 'Observatory', desc: 'En-têtes, TLS, bonnes pratiques', url: `https://observatory.mozilla.org/analyze/${encodeURIComponent(dom)}` },
    { id: 'pagespeed', name: 'PageSpeed', desc: 'Core Web Vitals, SEO, accessibilité', url: `https://pagespeed.web.dev/analysis?url=https%3A%2F%2F${encodeURIComponent(dom)}%2F` },
    { id: 'wave', name: 'WAVE', desc: 'Accessibilité visuelle (ARIA, contrastes)', url: `https://wave.webaim.org/report#/https://${encodeURIComponent(dom)}` },
    { id: 'blacklight', name: 'Blacklight', desc: 'Trackers, fingerprinting', url: `https://themarkup.org/blacklight?url=${encodeURIComponent(dom)}` },
    { id: '2gdpr', name: '2GDPR', desc: 'Conformité RGPD et cookies', url: `https://2gdpr.com/?url=${encodeURIComponent(dom)}` },
  ];

  const saveAudit = (domain, data) => {
    setAudits((prev) => {
      const updated = { ...prev, [domain]: data };
      try { localStorage.setItem('azim_securityheaders_cache', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const fetchWithRetry = async (url, retries = 3, delay = 600) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok && res.status >= 500 && attempt < retries) {
          await new Promise((r) => setTimeout(r, delay * attempt));
          continue;
        }
        return await res.json();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, delay * attempt));
      }
    }
  };

  const runAudit = async (rawDomain) => {
    const cleanDomain = (rawDomain || '').trim().toLowerCase()
      .replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];
    if (!cleanDomain) return;
    setLoadingMap((prev) => ({ ...prev, [cleanDomain]: true }));
    try {
      const data = await fetchWithRetry(`/api/site-status/audit-headers?domain=${encodeURIComponent(cleanDomain)}`, 3, 600);
      saveAudit(cleanDomain, data);
    } catch (err) {
      saveAudit(cleanDomain, { success: false, domain: cleanDomain, grade: '?', score: 0, error: `Erreur : ${err.message}` });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [cleanDomain]: false }));
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
      await runAudit(site.cleanDomain);
      await new Promise((r) => setTimeout(r, 300));
    }
    setGlobalLoading(false);
    showToast?.('Analyse terminée pour tous les sites');
  };

  // Auto-analyse au premier affichage
  useEffect(() => {
    if (hasAutoRun.current || validSites.length === 0) return;
    hasAutoRun.current = true;
    runAuditAll();
  }, [validSites.length]);

  const gradeColor = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    if (grade === 'B') return 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40';
    if (grade === 'C') return 'text-amber-400 bg-amber-950/40 border-amber-500/40';
    if (grade === 'D' || grade === 'F') return 'text-rose-400 bg-rose-950/40 border-rose-500/40';
    return 'text-gray-400 bg-slate-900 border-slate-700';
  };

  const testedCount = validSites.filter((s) => audits[s.cleanDomain]?.success).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Audit de securite</h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            {testedCount}/{validSites.length} sites analyses — SecurityHeaders analyse automatiquement, les autres outils s'ouvrent en un clic
          </p>
        </div>
        <button
          type="button"
          onClick={runAuditAll}
          disabled={globalLoading}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition flex items-center gap-2 disabled:opacity-50 shrink-0"
        >
          {globalLoading ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <span>Analyse...</span>
            </>
          ) : (
            <span>Relancer l'analyse</span>
          )}
        </button>
      </div>

      {/* Table compacte */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden">
        {/* En-tête table */}
        <div className="grid text-[10px] font-mono text-gray-500 px-4 py-2 bg-slate-950 border-b border-slate-800"
          style={{ gridTemplateColumns: '1fr 56px repeat(7, 80px) 28px' }}>
          <span>DOMAINE</span>
          <span className="text-center">NOTE</span>
          <span className="text-center">SHdr</span>
          <span className="text-center">SSL</span>
          <span className="text-center">Obsvr</span>
          <span className="text-center">Speed</span>
          <span className="text-center">WAVE</span>
          <span className="text-center">BLight</span>
          <span className="text-center">RGPD</span>
          <span />
        </div>

        {/* Lignes */}
        {validSites.map((site) => {
          const dom = site.cleanDomain;
          const audit = audits[dom];
          const isLoading = loadingMap[dom];
          const tools = AUDIT_TOOLS(dom);

          return (
            <div key={site.id || dom}>
              <div
                className="grid items-center px-4 py-2.5 border-b border-slate-800/60 hover:bg-slate-900/40 transition text-xs"
                style={{ gridTemplateColumns: '1fr 56px repeat(7, 80px) 28px' }}
              >
                {/* Domaine */}
                <div className="min-w-0">
                  <div className="font-semibold text-gray-200 truncate">{site.title || site.name || dom}</div>
                  <div className="text-[10px] font-mono text-gray-500 truncate">{dom}</div>
                </div>

                {/* Note SecurityHeaders */}
                <div className="flex justify-center">
                  {isLoading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                  ) : (
                    <span className={`w-9 h-7 rounded-lg border text-[11px] font-black flex items-center justify-center ${gradeColor(audit?.grade)}`}>
                      {audit?.grade || '–'}
                    </span>
                  )}
                </div>

                {/* Liens outils */}
                {tools.map((tool) => (
                  <div key={tool.id} className="flex justify-center">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={tool.desc}
                      className="text-[10px] font-mono text-gray-400 hover:text-cyan-300 transition px-1.5 py-1 rounded-lg hover:bg-slate-800 flex items-center gap-0.5"
                    >
                      <span>{tool.name}</span>
                      <span className="text-[8px]">↗</span>
                    </a>
                  </div>
                ))}

                {/* Bouton détails */}
                <div className="flex justify-end">
                  {audit?.checks && (
                    <button
                      type="button"
                      onClick={() => setExpandedDomain(expandedDomain === dom ? null : dom)}
                      title="Voir détail en-têtes"
                      className="text-[10px] font-mono text-gray-500 hover:text-cyan-400 transition"
                    >
                      {expandedDomain === dom ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {/* Détail en-têtes dépliable */}
              {expandedDomain === dom && audit?.checks && (
                <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(audit.checks).map(([key, check]) => (
                    <div
                      key={key}
                      title={check.desc}
                      className={`p-1.5 rounded-lg border text-[10px] font-mono flex items-center justify-between ${
                        check.present
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-950/20 border-rose-500/20 text-rose-400/80'
                      }`}
                    >
                      <span className="truncate">{key.toUpperCase()}</span>
                      <span>{check.present ? '✓' : '✗'}</span>
                    </div>
                  ))}
                  {audit.error && (
                    <div className="col-span-full text-[10px] font-mono text-amber-400">{audit.error}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}





// Onglet dédié à l'édition et la synchronisation du dossier de contexte privé
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
        showToast(data.message || 'Fichier enregistré avec succès.');
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
        showToast(`Projet "${name}" retiré.`);
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
        showToast(`Dossier synchronisé et sécurisé sur ${data.syncedCount} projet(s).`);
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
        showToast(`Fichier "${cleanName}" chargé dans l'éditeur. Cliquez sur "Enregistrer" pour synchroniser.`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Synchronisation directe des dossiers locaux depuis le navigateur (sans terminal)
  const handleBrowserLocalSync = async () => {
    setLocalBrowserSyncing(true);

    // 1. Détection du bridge local HTTP (http://127.0.0.1:5001)
    // S'il est actif, il synchronise immédiatement tous les navigateurs y compris Brave sans aucune restriction
    try {
      const bridgePing = await fetch('http://127.0.0.1:5001/ping', { signal: AbortSignal.timeout(1200) }).catch(() => null);
      if (bridgePing && bridgePing.ok) {
        showToast("Bridge local détecté. Synchronisation en cours...");
        const bridgeRes = await fetch('http://127.0.0.1:5001/sync', { method: 'POST' });
        const bridgeData = await bridgeRes.json();
        if (bridgeData.success) {
          showToast(`✓ ${bridgeData.syncedCount} projet(s) locaux synchronisés via le bridge local !`);
          setLocalBrowserSyncing(false);
          return;
        }
      }
    } catch {
      // Bridge local non actif, on continue avec File System Access API
    }

    // 2. Vérification du support natif du navigateur
    if (!window.showDirectoryPicker) {
      setLocalBrowserSyncing(false);
      setShowBraveModal(true);
      return;
    }

    try {
      showToast("Sélectionnez votre dossier de projets (ex: 'git commit')...");

      const rootDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

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
            // Recherche insensible à la casse
            for await (const [name, handle] of rootDirHandle.entries()) {
              if (handle.kind === 'directory' && name.toLowerCase() === folderName.toLowerCase()) {
                projectHandle = handle;
                break;
              }
            }
          }
          if (!projectHandle) continue;

          // 1. Protection .gitignore
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

          // 2. Écriture dans le dossier racine sync/ et project-context.md
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
        } catch {
          // Dossier projet absent de ce dossier racine
        }
      }

      if (localUpdatedCount > 0) {
        showToast(`✓ ${localUpdatedCount} projet(s) locaux synchronisés avec succès depuis le site !`);
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
        showToast('Fichiers de contexte exportés.');
      }
    } catch {
      showToast('Erreur lors de l’export');
    }
  };

  const enabledCount = targets.filter((t) => t.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Dossier Contexte Privé &amp; Synchronisation</h2>
          <p className="text-xs text-gray-400 mt-1">
            Gérez le dossier de configuration et synchronisez l'ensemble des fichiers sur vos projets avec protection automatique (.gitignore &amp; .env).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-white text-xs font-mono border border-slate-800 transition"
            title="Importer un fichier Markdown (.md) local directement dans l'éditeur"
          >
            Importer .md
          </button>
          <button
            type="button"
            onClick={handleDownloadBundle}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white text-xs font-mono border border-slate-800 transition"
            title="Télécharger l'ensemble des fichiers du dossier au format JSON"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleBrowserLocalSync}
            disabled={localBrowserSyncing || loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-cyan-500/40 shadow-sm transition disabled:opacity-50"
            title="Synchroniser vos dossiers locaux directement depuis le navigateur sans passer par le terminal"
          >
            {localBrowserSyncing ? 'Synchronisation...' : 'Synchroniser en local (Site Web)'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || loading || enabledCount === 0}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {syncing ? 'Synchronisation...' : `Synchroniser le dossier (${enabledCount})`}
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-gray-400">
        <span>Protection automatique active : vérification et injection .gitignore &amp; .env avant chaque écriture dans les projets cibles.</span>
        <span className="font-mono text-[11px] text-cyan-400">Sécurisé</span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-gray-400 bg-slate-950 rounded-2xl border border-slate-800">
          Chargement du dossier contexte...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {files.map((f) => (
                <button
                  key={f.filename}
                  type="button"
                  onClick={() => handleSelectFile(f.filename)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
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
                className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900 border border-slate-800 text-gray-400 hover:text-white"
              >
                + Ajouter un fichier
              </button>
            </div>

            {showNewFileModal && (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="nom-fichier.md"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono flex-1 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleCreateFile}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Créer
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewFileModal(false)}
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Annuler
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-slate-800 pb-2">
                <span>Fichier : {activeFile}</span>
                <span>
                  {lastModified ? `Mis à jour le ${new Date(lastModified).toLocaleString('fr-FR')}` : ''}
                </span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={25}
                spellCheck={false}
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
                placeholder={`Contenu du fichier ${activeFile}...`}
              />

              <div className="flex justify-between items-center text-[11px] font-mono text-gray-500">
                <span>{content.split('\n').length} lignes • {content.length} caractères</span>
                <button
                  type="button"
                  onClick={() => fetchContextData(activeFile)}
                  className="text-gray-400 hover:text-white underline"
                >
                  Recharger depuis le serveur
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <span className="font-bold text-white block">Synchronisation sur vos dossiers locaux :</span>
                  <p className="text-gray-400 text-[11px] leading-relaxed mt-0.5">
                    Synchronisez directement vos dossiers sur votre PC sans quitter le navigateur, ou via terminal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBrowserLocalSync}
                  disabled={localBrowserSyncing}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md whitespace-nowrap"
                >
                  {localBrowserSyncing ? 'Synchronisation...' : 'Synchroniser mes dossiers locaux'}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-gray-500 font-mono">
                <span>Alternative en ligne de commande :</span>
                <code className="text-cyan-400/90 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">npm run sync:context</code>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Liste de synchronisation</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {enabledCount} sur {targets.length} projet(s) sélectionné(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(true)}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Tout cocher
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAllTargets(false)}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 text-gray-300 hover:text-white border border-slate-800"
                  >
                    Désélectionner
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                      target.enabled
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-gray-500'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1 mr-2">
                      <input
                        type="checkbox"
                        checked={Boolean(target.enabled)}
                        onChange={() => handleToggleTarget(target.id)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs font-medium">{target.name}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-400">/{target.folder}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteTarget(target.id, target.name)}
                        className="text-gray-500 hover:text-rose-400 p-0.5 text-xs font-mono"
                        title="Retirer de la liste"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulaire d'ajout rapide pour autoriser un nouveau projet */}
              <form onSubmit={handleAddTarget} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-gray-300 block">Autoriser un nouveau projet / dossier</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nom (ex: Mon Jeu)"
                    value={newTargetName}
                    onChange={(e) => setNewTargetName(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="Dossier (ex: mon-jeu)"
                    value={newTargetFolder}
                    onChange={(e) => setNewTargetFolder(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newTargetName.trim() || !newTargetFolder.trim()}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition disabled:opacity-40"
                >
                  + Ajouter et autoriser la synchronisation
                </button>
              </form>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncing || enabledCount === 0}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
              >
                {syncing ? 'Synchronisation en cours...' : 'Lancer la synchronisation'}
              </button>
            </div>

            {syncResult && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 animate-fade-in">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Résultat de la synchronisation</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(syncResult.syncedAt).toLocaleTimeString('fr-FR')}
                  </span>
                </div>

                <div className="text-xs text-emerald-400 font-mono">
                  {syncResult.syncedCount} projet(s) mis à jour avec la dernière version.
                </div>

                {syncResult.synced?.length > 0 && (
                  <div className="text-[11px] text-gray-300 space-y-1">
                    <span className="text-gray-500 text-[10px] block">Projets synchronisés :</span>
                    <div className="flex flex-wrap gap-1">
                      {syncResult.synced.map((name, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {syncResult.securedProjects?.length > 0 && (
                  <div className="text-[10px] text-gray-400 font-mono">
                    ✓ Sécurité .gitignore validée sur {syncResult.securedProjects.length} dépôts.
                  </div>
                )}

                {syncResult.errors?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-400 font-mono">
                    <span className="block text-[10px] text-gray-400">Non synchronisés (dossier absent) :</span>
                    {syncResult.errors.map((err, i) => (
                      <span key={i} className="block text-[10px] text-gray-500">
                        • {err.target} ({err.error})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal d'assistance pour Brave Browser */}
      {showBraveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-base font-bold text-white">
                Synchronisation locale dans Brave Browser
              </h3>
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="text-gray-400 hover:text-white text-sm font-mono p-1 transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Brave désactive l'accès direct aux dossiers par défaut pour préserver la vie privée. Deux options simples permettent de synchroniser vos projets locaux :
            </p>

            {/* Option 1 : Activer le flag Brave */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-300">
                  Option 1 (Recommandée) : 100% sur le site
                </span>
                <span className="text-[10px] font-mono text-gray-400">1 seule fois</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Activez l'accès direct dans Brave pour utiliser le bouton directement depuis le site :
              </p>
              <ol className="text-xs text-gray-300 space-y-1.5 list-decimal list-inside">
                <li>Ouvrez un nouvel onglet dans Brave et collez :</li>
              </ol>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-400 select-all overflow-x-auto">
                  brave://flags/#file-system-access-api
                </code>
                <button
                  type="button"
                  onClick={handleCopyBraveFlag}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/50 text-xs font-medium transition shrink-0"
                >
                  {copiedBraveFlag ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <ol start="2" className="text-xs text-gray-300 space-y-1 list-decimal list-inside">
                <li>Passez le réglage de <strong className="text-white">Default</strong> à <strong className="text-emerald-400">Enabled</strong>.</li>
                <li>Cliquez sur <strong className="text-white">Relaunch</strong> en bas à droite de Brave.</li>
              </ol>
              <p className="text-[11px] text-gray-400">
                Une fois relancé, le bouton du site synchronise directement vos dossiers sans aucune commande.
              </p>
            </div>

            {/* Option 2 : 1 double-clic avec sync.bat */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Option 2 : Sans modifier Brave
                </span>
                <span className="text-[10px] font-mono text-gray-400">1 double-clic</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Double-cliquez sur le fichier <code className="text-cyan-300 font-mono">sync.bat</code> situé à la racine du projet <code className="text-cyan-300 font-mono">azim404</code>. Aucun terminal à ouvrir, aucune commande à taper.
              </p>
              <button
                type="button"
                onClick={handleDownloadSyncBat}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-medium border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <span>Télécharger sync.bat</span>
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowBraveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
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


