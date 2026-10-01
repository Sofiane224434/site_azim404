/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AdminContext = createContext(null);

const STORAGE_SESSION_KEY = 'azim_private_session';
const STORAGE_ACCOUNTS_KEY = 'azim_private_accounts';
const STORAGE_STATUS_KEY = 'azim_site_status';

const DEFAULT_ADMIN_KEYS = ['azim404', 'admin404', 'azim2026'];
const DEFAULT_ADMIN_IDENTIFIERS = ['admin', 'azim404', 'sb.kherarfa@gmail.com', 'sofiane'];

const DEFAULT_STATUS = {
  portfolio: {
    inMaintenance: false,
    message: "Le site est actuellement en cours de mise à jour et d'optimisation. Nous serons de retour très prochainement.",
    updatedAt: new Date().toISOString(),
  },
  azim404: {
    inMaintenance: false,
    message: "Maintenance technique planifiée sur le portail Azim404.",
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

  const [siteStatus, setSiteStatus] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_STATUS_KEY);
      return stored ? { ...DEFAULT_STATUS, ...JSON.parse(stored) } : DEFAULT_STATUS;
    } catch {
      return DEFAULT_STATUS;
    }
  });

  const [isStatusLoading, setIsStatusLoading] = useState(false);

  // Fetch Site Status from API
  const refreshSiteStatus = useCallback(async () => {
    try {
      setIsStatusLoading(true);
      const res = await fetch('/api/site-status', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.status) {
          const merged = { ...DEFAULT_STATUS, ...data.status };
          setSiteStatus(merged);
          localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('API site-status non joignable, utilisation statut local');
    } finally {
      setIsStatusLoading(false);
    }
    return siteStatus;
  }, [siteStatus]);

  // Fetch accounts from API
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

  useEffect(() => {
    refreshSiteStatus();
    refreshAccounts();
  }, [refreshSiteStatus, refreshAccounts]);

  // 1-Click Maintenance Toggle
  const toggleSiteMaintenance = async (siteKey, inMaintenance, message) => {
    const prevSite = siteStatus[siteKey] || {};
    const nextMaintenance = typeof inMaintenance === 'boolean' ? inMaintenance : !prevSite.inMaintenance;
    const nextMsg = typeof message === 'string' && message.trim() ? message.trim() : prevSite.message;

    const updatedSite = {
      ...prevSite,
      inMaintenance: nextMaintenance,
      message: nextMsg,
      updatedAt: new Date().toISOString(),
    };

    const nextAll = {
      ...siteStatus,
      [siteKey]: updatedSite,
    };

    // Instant local state update for zero latency
    setSiteStatus(nextAll);
    localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(nextAll));

    // Async push to backend API
    try {
      const res = await fetch('/api/site-status/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: siteKey,
          inMaintenance: nextMaintenance,
          message: nextMsg,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.all) {
          setSiteStatus(data.all);
          localStorage.setItem(STORAGE_STATUS_KEY, JSON.stringify(data.all));
        }
      }
    } catch (e) {
      console.warn('Erreur envoi toggle backend, enregistré en local:', e);
    }

    return updatedSite;
  };

  const login = async (identifier, password) => {
    const trimmedId = (identifier || '').trim().toLowerCase();
    const trimmedPass = (password || '').trim();

    // 1. Check Master Admin Credentials
    const envKey = import.meta.env.VITE_ADMIN_KEY;
    const validAdminPass = envKey ? [...DEFAULT_ADMIN_KEYS, envKey] : DEFAULT_ADMIN_KEYS;

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

    // 2. Check Private Accounts
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

    // 3. Optional Backend API fallback
    try {
      const apiRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedId, password: trimmedPass }),
      });
      if (apiRes.ok) {
        const data = await apiRes.json();
        const sessionUser = {
          identifier: data.user.email,
          name: data.user.firstname || data.user.email,
          role: 'member',
          token: data.token,
          loginTime: Date.now(),
        };
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true, user: sessionUser };
      }
    } catch {
      // Backend not running or unreachable
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

    // Try backend persistence
    try {
      await fetch('/api/private-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount),
      });
    } catch (e) {
      // offline fallback
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
        siteStatus,
        isStatusLoading,
        refreshSiteStatus,
        toggleSiteMaintenance,
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
