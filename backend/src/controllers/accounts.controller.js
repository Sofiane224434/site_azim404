import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'private_accounts.json');

function readAccountsFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const raw = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Erreur lecture private_accounts.json:', error);
    return [];
  }
}

function writeAccountsFile(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur ecriture private_accounts.json:', error);
    return false;
  }
}

export const getAccounts = (req, res) => {
  const accounts = readAccountsFile();
  // Return accounts list (safe representation)
  const safeList = accounts.map(({ id, identifier, name, permissions, createdAt }) => ({
    id,
    identifier,
    name,
    permissions,
    createdAt,
  }));
  res.json({ success: true, accounts: safeList });
};

export const createAccount = (req, res) => {
  const { identifier, password, name, permissions } = req.body;
  const trimmedId = (identifier || '').trim().toLowerCase();
  const trimmedPass = (password || '').trim();

  if (!trimmedId || !trimmedPass) {
    return res.status(400).json({ success: false, error: 'Identifiant et mot de passe requis' });
  }

  const reserved = ['admin', 'azim404', 'sb.kherarfa@gmail.com', 'sofiane'];
  if (reserved.includes(trimmedId)) {
    return res.status(400).json({ success: false, error: 'Cet identifiant est réservé' });
  }

  const accounts = readAccountsFile();
  if (accounts.some((a) => a.identifier.toLowerCase() === trimmedId)) {
    return res.status(409).json({ success: false, error: 'Identifiant déjà existant' });
  }

  const newAcc = {
    id: Date.now().toString(),
    identifier: trimmedId,
    name: name || trimmedId,
    password: trimmedPass,
    permissions: permissions || 'Accès Privé',
    createdAt: new Date().toLocaleDateString('fr-FR'),
  };

  accounts.unshift(newAcc);
  writeAccountsFile(accounts);

  res.status(201).json({
    success: true,
    account: {
      id: newAcc.id,
      identifier: newAcc.identifier,
      name: newAcc.name,
      permissions: newAcc.permissions,
      createdAt: newAcc.createdAt,
    },
  });
};

export const deleteAccount = (req, res) => {
  const { id } = req.params;
  const accounts = readAccountsFile();
  const filtered = accounts.filter((a) => a.id !== id && a.identifier !== id);
  writeAccountsFile(filtered);
  res.json({ success: true, message: 'Compte supprimé' });
};
