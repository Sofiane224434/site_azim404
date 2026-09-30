/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

const STORAGE_SESSION_KEY = 'azim_private_session';
const STORAGE_ACCOUNTS_KEY = 'azim_private_accounts';

const DEFAULT_ADMIN_KEYS = ['azim404', 'admin404', 'azim2026'];
const DEFAULT_ADMIN_IDENTIFIERS = ['admin', 'azim404', 'sb.kherarfa@gmail.com', 'sofiane'];

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

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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

    // 2. Check Private Accounts created from Admin panel
    const existingAccount = accounts.find(
      (acc) =>
        acc.identifier.toLowerCase() === trimmedId &&
        acc.password === trimmedPass
    );

    if (existingAccount) {
      const sessionUser = {
        identifier: existingAccount.identifier,
        name: existingAccount.name || existingAccount.identifier,
        role: 'member',
        permissions: existingAccount.permissions || 'standard',
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

  const createAccount = (accountData) => {
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
    return { success: true, account: newAccount };
  };

  const deleteAccount = (id) => {
    const updated = accounts.filter((acc) => acc.id !== id && acc.identifier !== id);
    setAccounts(updated);
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleModal = () => setIsModalOpen((prev) => !prev);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        accounts,
        isModalOpen,
        openModal,
        closeModal,
        toggleModal,
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
