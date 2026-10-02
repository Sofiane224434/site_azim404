import { useState, useEffect } from 'react';
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

    // 1. Save to portfolio showcase
    const projectRes = await savePortfolioProject({
      title: newTitle,
      description: newDesc,
      technologies: newStack.split(',').map((s) => s.trim()).filter(Boolean),
      badge: newBadge,
      link: newLink,
      domain: cleanDomain,
      visibleOnPortfolio: newVisibleOnPortfolio,
      inMaintenance: false,
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

        {/* Note & Accès SecurityHeaders.com */}
        {((domain || item.domain || item.link) ? (
          <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-slate-950 border border-cyan-500/20 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className="text-base">🛡️</span>
              <div>
                <span className="text-xs font-bold text-white block">Note SecurityHeaders.com</span>
                <span className="text-[11px] text-cyan-300/80 font-mono">
                  {((domain || item.domain) || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://securityheaders.com/?q=${encodeURIComponent(((domain || item.domain || item.link) || '').replace(/^https?:\/\//, '').replace(/\/.*$/, ''))}&followRedirects=on`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-200 border border-cyan-400/40 font-bold transition flex items-center gap-1 shadow-sm"
                title="Consulter directement le rapport sur SecurityHeaders.com"
              >
                <span>Voir la note</span>
                <span className="text-[9px]">↗</span>
              </a>
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('security')}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-700 transition"
                  title="Consulter le tableau de bord SecurityHeaders de tous vos sites"
                >
                  Onglet Sécurité ➔
                </button>
              )}
            </div>
          </div>
        ) : null)}

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

// Onglet complet dédié aux notes & audits SecurityHeaders.com (à gauche de Supervision VPS)
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
  const [expandedDetails, setExpandedDetails] = useState({});

  const saveAudit = (domain, data) => {
    setAudits((prev) => {
      const updated = { ...prev, [domain]: data };
      try {
        localStorage.setItem('azim_securityheaders_cache', JSON.stringify(updated));
      } catch {
        // quota fallback
      }
      return updated;
    });
  };

  const runAudit = async (rawDomain) => {
    const cleanDomain = (rawDomain || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0];

    if (!cleanDomain) return;

    setLoadingMap((prev) => ({ ...prev, [cleanDomain]: true }));
    try {
      const res = await fetch(`/api/site-status/audit-headers?domain=${encodeURIComponent(cleanDomain)}`);
      const data = await res.json();
      saveAudit(cleanDomain, data);
      if (data.success) {
        showToast?.(`Note SecurityHeaders pour ${cleanDomain} : ${data.grade} (${data.score}/100)`);
      }
    } catch (err) {
      saveAudit(cleanDomain, {
        success: false,
        domain: cleanDomain,
        grade: '?',
        score: 0,
        gradeColor: 'text-gray-400 bg-slate-900 border-slate-700',
        error: `Erreur de connexion : ${err.message}`,
        tools: [{
          id: 'securityheaders',
          name: 'SecurityHeaders.com',
          url: `https://securityheaders.com/?q=${encodeURIComponent(cleanDomain)}&followRedirects=on`,
        }],
      });
    } finally {
      setLoadingMap((prev) => ({ ...prev, [cleanDomain]: false }));
    }
  };

  const runAuditAll = async () => {
    setGlobalLoading(true);
    for (const item of sites) {
      const dom = (item.domain || (item.link ? new URL(item.link.startsWith('http') ? item.link : `https://${item.link}`).hostname : ''))
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .split(':')[0];

      if (dom) {
        await runAudit(dom);
      }
    }
    setGlobalLoading(false);
    showToast?.('Analyse SecurityHeaders terminée pour tous vos sites !');
  };

  const validSites = sites.map((s) => {
    const dom = (s.domain || (s.link ? new URL(s.link.startsWith('http') ? s.link : `https://${s.link}`).hostname : ''))
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0];
    return { ...s, cleanDomain: dom };
  }).filter((s) => Boolean(s.cleanDomain));

  const testedCount = validSites.filter((s) => audits[s.cleanDomain]?.success).length;
  const excellentCount = validSites.filter((s) => {
    const g = audits[s.cleanDomain]?.grade;
    return g === 'A+' || g === 'A';
  }).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛡️</span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Notes &amp; Audits SecurityHeaders.com
            </h2>
          </div>
          <p className="text-sm text-gray-400 mt-1 max-w-3xl">
            Retrouvez en <strong className="text-white">première information la note officielle</strong> émise pour chacun de vos sites web et sous-domaines selon les recommandations de <strong className="text-cyan-300">SecurityHeaders.com</strong>.
          </p>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={runAuditAll}
            disabled={globalLoading}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition flex items-center gap-2 disabled:opacity-50"
          >
            {globalLoading ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Analyser tous les sites (1 clic)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-gray-400 block">SITES SURVEILLÉS</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{validSites.length} domaines</span>
          </div>
          <span className="text-2xl">🌐</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-emerald-400 block">NOTE EXCELLENTE (A+ / A)</span>
            <span className="text-xl font-bold text-emerald-300 mt-0.5 block">{excellentCount} site(s)</span>
          </div>
          <span className="text-2xl">🏆</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-cyan-400 block">SITES AUDITÉS</span>
            <span className="text-xl font-bold text-cyan-300 mt-0.5 block">{testedCount} / {validSites.length}</span>
          </div>
          <span className="text-2xl">🛡️</span>
        </div>
      </div>

      {/* Grid of sites */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {validSites.map((site) => {
          const dom = site.cleanDomain;
          const audit = audits[dom];
          const isLoading = loadingMap[dom];
          const isExpanded = expandedDetails[dom];

          const gradeBadgeClass =
            audit?.grade === 'A+' || audit?.grade === 'A'
              ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.35)]'
              : audit?.grade === 'B'
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              : audit?.grade === 'C'
              ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
              : audit?.grade === 'D' || audit?.grade === 'F'
              ? 'bg-rose-950/80 border-rose-400 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'bg-slate-900 border-slate-700 text-gray-400';

          return (
            <div
              key={site.id || dom}
              className="p-6 rounded-3xl bg-slate-950/90 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5"
            >
              <div>
                {/* 1. EN PREMIÈRE INFO : LA NOTE DONNÉE PAR SECURITYHEADERS */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    {/* Grand Badge de Note */}
                    <div
                      className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center border font-black transition-all ${gradeBadgeClass}`}
                    >
                      <span className="text-3xl leading-none">{audit?.grade || '?'}</span>
                      <span className="text-[10px] font-mono tracking-tighter opacity-80 mt-0.5">NOTE</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gray-400">NOTE SECURITYHEADERS</span>
                        {audit?.success && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                            {audit.score} / 100
                          </span>
                        )}
                      </div>

                      <div className="text-base font-extrabold text-white mt-0.5">
                        {audit?.grade === 'A+' && 'Excellent — Conforme A+'}
                        {audit?.grade === 'A' && 'Très Bon — Conforme A'}
                        {audit?.grade === 'B' && 'Bon — HSTS Actif'}
                        {audit?.grade === 'C' && 'Moyen — En-têtes partiels'}
                        {audit?.grade === 'D' && 'Faible — À sécuriser'}
                        {audit?.grade === 'F' && 'Insuffisant — Headers manquants'}
                        {(!audit || audit?.grade === '?') && 'Non encore analysé'}
                      </div>

                      <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {audit?.checkedAt ? `Testé à ${new Date(audit.checkedAt).toLocaleTimeString('fr-FR')}` : 'Cliquez sur Tester pour obtenir la note'}
                      </div>
                    </div>
                  </div>

                  {/* Bouton pour tester ce site */}
                  <button
                    type="button"
                    onClick={() => runAudit(dom)}
                    disabled={isLoading}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-gray-300 hover:text-white transition flex items-center gap-1.5 font-mono text-xs disabled:opacity-50"
                    title="Actualiser la note de ce site"
                  >
                    {isLoading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    ) : (
                      <span>↻</span>
                    )}
                    <span className="hidden sm:inline">Tester</span>
                  </button>
                </div>

                {/* Titre & Domaine */}
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{site.title || site.name || dom}</h3>
                    <a
                      href={`https://${dom}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 mt-0.5"
                    >
                      <span>https://{dom}</span>
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>

                  {site.inMaintenance && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold">
                      TRAVAUX ACTIFS
                    </span>
                  )}
                </div>

                {/* Message d'erreur spécifique avec conseils DNS si applicable */}
                {audit && !audit.success && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1 mb-4 text-xs font-mono">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{audit.error || 'Erreur lors du test'}</span>
                    </div>
                    {audit.error?.includes('DNS') && (
                      <div className="text-[11px] text-amber-400/80 pl-5">
                        💡 Conseil : Créez l'enregistrement DNS (type A ou CNAME) pointant vers votre serveur (51.210.244.46).
                      </div>
                    )}
                  </div>
                )}

                {/* Grille des 6 en-têtes HTTP SecurityHeaders */}
                {audit?.checks && (
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-gray-400">EN-TÊTES DE SÉCURITÉ CONTRÔLÉS :</span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedDetails((prev) => ({ ...prev, [dom]: !prev[dom] }))
                        }
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline"
                      >
                        {isExpanded ? 'Masquer valeurs' : 'Voir valeurs reçues'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(audit.checks).map(([key, check]) => (
                        <div
                          key={key}
                          className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between ${
                            check.present
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-500/20 text-rose-400/80'
                          }`}
                          title={check.desc}
                        >
                          <span className="truncate">{key.toUpperCase()}</span>
                          <span className="font-bold">{check.present ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dépliage des valeurs brutes */}
                    {isExpanded && (
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono animate-fade-in mt-2">
                        {Object.entries(audit.checks).map(([key, check]) => (
                          <div key={key} className="space-y-0.5 border-b border-slate-800 pb-1.5 last:border-0 last:pb-0">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-gray-300 font-bold">{check.name}</span>
                              <span className={check.present ? 'text-emerald-400' : 'text-rose-400'}>
                                {check.present ? '✓ Présent' : '✗ Absent'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500">{check.desc}</p>
                            {check.value && (
                              <div className="p-1 rounded bg-black/50 text-[10px] text-cyan-300 select-all truncate">
                                {check.value}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BOUTON OFFICIEL SECURITYHEADERS.COM (MIS EN AVANT) */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-2.5 justify-between items-center">
                <a
                  href={`https://securityheaders.com/?q=${encodeURIComponent(dom)}&followRedirects=on`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-400/60 text-cyan-200 font-bold text-xs font-mono shadow-[0_0_15px_rgba(6,182,212,0.2)] transition flex items-center justify-center gap-2 text-center"
                  title="Ouvrir le rapport d'analyse officiel sur SecurityHeaders.com"
                >
                  <span>Voir le rapport officiel sur SecurityHeaders.com</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Onglet dédié à l'édition et la synchronisation du contexte privé (project-context.md)
function ContextSyncTab({ showToast }) {
  const [content, setContent] = useState('');
  const [lastModified, setLastModified] = useState('');
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const fetchContextData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/context');
      if (res.ok) {
        const data = await res.json();
        setContent(data.content || '');
        setLastModified(data.lastModified || '');
        setTargets(data.targets || []);
      }
    } catch (err) {
      console.error('Erreur chargement contexte:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContextData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/context/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success) {
        setLastModified(data.lastModified);
        showToast('Fichier contexte enregistré sur le serveur.');
      } else {
        showToast(data.error || 'Erreur lors de l’enregistrement');
      }
    } catch {
      showToast('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
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
        body: JSON.stringify({ content }),
      });

      const res = await fetch('/api/context/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSyncResult(data);
      if (data.success) {
        showToast(`Synchronisé avec succès sur ${data.syncedCount} projet(s).`);
      }
    } catch {
      showToast('Erreur lors de la synchronisation');
    } finally {
      setSyncing(false);
    }
  };

  const enabledCount = targets.filter((t) => t.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Contexte Privé &amp; Synchronisation</h2>
          <p className="text-xs text-gray-400 mt-1">
            Gérez le fichier de configuration opérationnel (project-context.md) et synchronisez-le sur l'ensemble de vos projets en un clic.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer le fichier'}
          </button>
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={syncing || loading || enabledCount === 0}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            {syncing ? 'Synchronisation...' : `Synchroniser sur les sites (${enabledCount})`}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-gray-400 bg-slate-950 rounded-2xl border border-slate-800">
          Chargement du fichier contexte...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Editeur de texte (2 colonnes) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-gray-400 border-b border-slate-800 pb-2">
                <span>Fichier source : project-context.md</span>
                <span>
                  {lastModified ? `Mis à jour le ${new Date(lastModified).toLocaleString('fr-FR')}` : ''}
                </span>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={26}
                spellCheck={false}
                className="w-full p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-gray-200 font-mono leading-relaxed focus:outline-none focus:border-cyan-500 resize-y"
                placeholder="Contenu du fichier project-context.md..."
              />

              <div className="flex justify-between items-center text-[11px] font-mono text-gray-500">
                <span>{content.split('\n').length} lignes • {content.length} caractères</span>
                <button
                  type="button"
                  onClick={fetchContextData}
                  className="text-gray-400 hover:text-white underline"
                >
                  Recharger depuis le serveur
                </button>
              </div>
            </div>
          </div>

          {/* Liste des cibles de synchronisation (1 colonne) */}
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

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {targets.map((target) => (
                  <label
                    key={target.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      target.enabled
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={Boolean(target.enabled)}
                        onChange={() => handleToggleTarget(target.id)}
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-xs font-medium">{target.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">/{target.folder}</span>
                  </label>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncing || enabledCount === 0}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
              >
                {syncing ? 'Synchronisation en cours...' : 'Lancer la synchronisation'}
              </button>
            </div>

            {/* Rapport du dernier résultat de synchronisation */}
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
    </div>
  );
}


