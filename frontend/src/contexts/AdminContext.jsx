/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminContext = createContext(null);

const STORAGE_SESSION_KEY = 'azim_private_session';
const STORAGE_ACCOUNTS_KEY = 'azim_private_accounts';
const STORAGE_SITES_KEY = 'azim_registered_sites';
const STORAGE_PROJECTS_KEY = 'azim_portfolio_projects';

const DEFAULT_ADMIN_KEYS = ['azim404', 'admin404', 'azim2026'];
const DEFAULT_ADMIN_IDENTIFIERS = ['admin', 'azim404', 'sb.kherarfa@gmail.com', 'sofiane'];

const DEFAULT_SITES = {
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio Vitrine',
    domain: 'sofiane-kherarfa.azim404.com',
    inMaintenance: false,
    scope: 'ALL',
    targetPages: '',
    title: 'Atelier en cours de rénovation',
    message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants.",
    updatedAt: new Date().toISOString(),
  },
  azim404: {
    id: 'azim404',
    name: 'Portail Principal Azim404',
    domain: 'azim404.com',
    inMaintenance: false,
    scope: 'ALL',
    targetPages: '',
    title: 'Portail en cours de maintenance',
    message: "Je prépare de nouvelles passerelles et des outils d'infrastructure sur Azim404. On se retrouve très vite !",
    updatedAt: new Date().toISOString(),
  },
};

export function AdminProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accounts, setAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [sites, setSites] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SITES_KEY);
      return stored ? { ...DEFAULT_SITES, ...JSON.parse(stored) } : DEFAULT_SITES;
    } catch {
      return DEFAULT_SITES;
    }
  });

  const [portfolioProjects, setPortfolioProjects] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROJECTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync sites from backend
  const refreshSites = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/site-status', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        const incoming = data.sites || data.status;
        if (incoming && typeof incoming === 'object') {
          const merged = { ...DEFAULT_SITES, ...incoming };
          setSites(merged);
          localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('API site-status non joignable, utilisation des données locales');
    } finally {
      setIsLoading(false);
    }
    return sites;
  }, [sites]);

  // Sync accounts from backend
  const refreshAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/private-accounts');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
          localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(data.accounts));
        }
      }
    } catch (e) {
      // offline fallback
    }
  }, []);

  // Sync portfolio projects from backend
  const refreshPortfolioProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolio-projects');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.projects)) {
          setPortfolioProjects(data.projects);
          localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(data.projects));
          return data.projects;
        }
      }
    } catch (e) {
      // offline
    }
    return portfolioProjects;
  }, [portfolioProjects]);

  useEffect(() => {
    refreshSites();
    refreshAccounts();
    refreshPortfolioProjects();
  }, [refreshSites, refreshAccounts, refreshPortfolioProjects]);

  // 1-Click Toggle Maintenance
  const toggleSiteMaintenance = async (siteId, inMaintenance, patchData = {}) => {
    const existing = sites[siteId] || {};
    const nextState = typeof inMaintenance === 'boolean' ? inMaintenance : !existing.inMaintenance;

    const updated = {
      ...existing,
      ...patchData,
      inMaintenance: nextState,
      updatedAt: new Date().toISOString(),
    };

    const nextSites = {
      ...sites,
      [siteId]: updated,
    };

    setSites(nextSites);
    localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(nextSites));

    try {
      const res = await fetch('/api/site-status/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: siteId,
          site: siteId,
          inMaintenance: nextState,
          ...patchData,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const remoteSites = data.sites || data.all;
        if (remoteSites) {
          setSites(remoteSites);
          localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(remoteSites));
        }
      }
    } catch (e) {
      console.warn('Erreur envoi toggle backend:', e);
    }

    return updated;
  };

  // Add or Update Site
  const saveSiteConfig = async (siteData) => {
    const cleanDomain = (siteData.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const cleanId = (siteData.id || cleanDomain.replace(/[^a-z0-9_-]/gi, '_')).trim().toLowerCase();

    if (!cleanDomain) {
      return { success: false, error: 'Nom de domaine obligatoire' };
    }

    const updated = {
      id: cleanId,
      name: siteData.name || cleanDomain,
      domain: cleanDomain,
      inMaintenance: Boolean(siteData.inMaintenance),
      scope: siteData.scope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL',
      targetPages: (siteData.targetPages || '').trim(),
      title: (siteData.title || 'Atelier en cours de rénovation').trim(),
      message: (siteData.message || DEFAULT_SITES.portfolio.message).trim(),
      updatedAt: new Date().toISOString(),
    };

    const nextSites = {
      ...sites,
      [cleanId]: updated,
    };

    setSites(nextSites);
    localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(nextSites));

    try {
      const res = await fetch('/api/site-status/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sites) {
          setSites(data.sites);
          localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(data.sites));
        }
      }
    } catch (e) {
      console.warn('Erreur sauvegarde site backend:', e);
    }

    return { success: true, site: updated };
  };

  // Delete Site
  const removeSite = async (siteId) => {
    if (['portfolio', 'azim404'].includes(siteId)) {
      return { success: false, error: 'Impossible de supprimer un site principal' };
    }

    const nextSites = { ...sites };
    delete nextSites[siteId];
    setSites(nextSites);
    localStorage.setItem(STORAGE_SITES_KEY, JSON.stringify(nextSites));

    try {
      await fetch(`/api/site-status/${siteId}`, { method: 'DELETE' });
    } catch (e) {
      // offline
    }

    return { success: true };
  };

  // Save / Update Portfolio Project
  const savePortfolioProject = async (projectData) => {
    try {
      const res = await fetch('/api/portfolio-projects/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setPortfolioProjects(data.projects);
          localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(data.projects));
          return { success: true, project: data.project };
        }
      }
    } catch (e) {
      // offline fallback
      const cleanId = (projectData.id || Date.now().toString()).trim();
      const updatedList = [...portfolioProjects];
      const idx = updatedList.findIndex((p) => p.id === cleanId);
      if (idx >= 0) {
        updatedList[idx] = { ...updatedList[idx], ...projectData };
      } else {
        updatedList.push({ ...projectData, id: cleanId });
      }
      setPortfolioProjects(updatedList);
      localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updatedList));
      return { success: true, project: projectData };
    }
    return { success: false, error: 'Erreur sauvegarde projet' };
  };

  // Delete Portfolio Project
  const deletePortfolioProject = async (id) => {
    const updated = portfolioProjects.filter((p) => p.id !== id);
    setPortfolioProjects(updated);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updated));

    try {
      await fetch(`/api/portfolio-projects/${id}`, { method: 'DELETE' });
    } catch (e) {
      // offline
    }
    return { success: true };
  };

  // Update own credentials (identifiant & mot de passe)
  const updateMyCredentials = async ({ newIdentifier, newPassword, name }) => {
    const cleanNewId = (newIdentifier || '').trim().toLowerCase();
    const cleanPass = (newPassword || '').trim();

    if (!cleanNewId && !cleanPass) {
      return { success: false, message: 'Rien à mettre à jour' };
    }

    // Check if new identifier is taken
    if (cleanNewId && cleanNewId !== user?.identifier?.toLowerCase()) {
      if (DEFAULT_ADMIN_IDENTIFIERS.includes(cleanNewId) && user?.role !== 'admin') {
        return { success: false, message: 'Cet identifiant est réservé à l’administrateur' };
      }
      if (accounts.some((a) => a.identifier.toLowerCase() === cleanNewId)) {
        return { success: false, message: 'Cet identifiant est déjà utilisé' };
      }
    }

    // If master admin
    if (user?.role === 'admin') {
      const updatedUser = {
        ...user,
        identifier: cleanNewId || user.identifier,
        name: name || user.name,
      };
      if (cleanPass) {
        localStorage.setItem('azim_admin_custom_key', cleanPass);
      }
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    }

    // If private member account
    try {
      const res = await fetch('/api/private-accounts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentIdentifier: user?.identifier,
          newIdentifier: cleanNewId || user?.identifier,
          newPassword: cleanPass,
          name: name || user?.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          ...user,
          identifier: data.account.identifier,
          name: data.account.name,
        };
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
        refreshAccounts();
        return { success: true, user: updatedUser };
      } else {
        const err = await res.json();
        return { success: false, message: err.error || 'Erreur lors de la mise à jour' };
      }
    } catch {
      // offline fallback
      const updatedAccounts = accounts.map((acc) => {
        if (acc.identifier.toLowerCase() === user?.identifier?.toLowerCase()) {
          return {
            ...acc,
            identifier: cleanNewId || acc.identifier,
            password: cleanPass || acc.password,
            name: name || acc.name,
          };
        }
        return acc;
      });
      setAccounts(updatedAccounts);
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

      const updatedUser = {
        ...user,
        identifier: cleanNewId || user.identifier,
        name: name || user.name,
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    }
  };

  const login = async (identifier, password) => {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    const envKey = import.meta.env.VITE_ADMIN_KEY;
    const customAdminKey = localStorage.getItem('azim_admin_custom_key');
    const validAdminPass = [
      ...DEFAULT_ADMIN_KEYS,
      ...(envKey ? [envKey] : []),
      ...(customAdminKey ? [customAdminKey] : []),
    ];

    const isMasterAdmin =
      DEFAULT_ADMIN_IDENTIFIERS.includes(trimmedId) && validAdminPass.includes(trimmedPass);

    if (isMasterAdmin) {
      const sessionUser = {
        identifier: trimmedId,
        name: 'Sofiane (Admin)',
        role: 'admin',
        loginTime: Date.now(),
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    const existingAccount = accounts.find(
      (acc) =>
        acc.identifier.toLowerCase() === trimmedId &&
        (acc.password === trimmedPass || !acc.password)
    );

    if (existingAccount) {
      const sessionUser = {
        identifier: existingAccount.identifier,
        name: existingAccount.name || existingAccount.identifier,
        role: 'member',
        permissions: existingAccount.permissions || 'Accès Privé',
        loginTime: Date.now(),
      };
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true, user: sessionUser };
    }

    return { success: false, message: 'Identifiant ou mot de passe incorrect' };
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_SESSION_KEY);
    setUser(null);
  };

  const createAccount = async (accountData) => {
    const trimmedId = (accountData.identifier || '').trim().toLowerCase();
    if (!trimmedId || !accountData.password) {
      return { success: false, message: 'Identifiant et mot de passe requis' };
    }

    if (DEFAULT_ADMIN_IDENTIFIERS.includes(trimmedId)) {
      return { success: false, message: 'Cet identifiant est réservé à l’administrateur' };
    }

    if (accounts.some((acc) => acc.identifier.toLowerCase() === trimmedId)) {
      return { success: false, message: 'Un compte avec cet identifiant existe déjà' };
    }

    const newAccount = {
      id: Date.now().toString(),
      identifier: trimmedId,
      name: accountData.name || trimmedId,
      password: accountData.password,
      permissions: accountData.permissions || 'Accès Privé',
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };

    const updated = [newAccount, ...accounts];
    setAccounts(updated);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));

    try {
      await fetch('/api/private-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
    } catch (e) {
      // offline
    }

    return { success: true, account: newAccount };
  };

  const deleteAccount = async (id) => {
    const updated = accounts.filter((acc) => acc.id !== id && acc.identifier !== id);
    setAccounts(updated);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));

    try {
      await fetch(`/api/private-accounts/${id}`, { method: 'DELETE' });
    } catch (e) {
      // offline
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        accounts,
        sites,
        siteStatus: sites,
        portfolioProjects,
        isLoading,
        refreshSites,
        toggleSiteMaintenance,
        saveSiteConfig,
        removeSite,
        savePortfolioProject,
        deletePortfolioProject,
        refreshPortfolioProjects,
        updateMyCredentials,
        login,
        logout,
        createAccount,
        deleteAccount,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin doit être utilisé à l’intérieur de AdminProvider');
  }
  return context;
}
