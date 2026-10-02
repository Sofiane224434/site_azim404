import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const MASTER_CONTEXT_FILE = path.join(DATA_DIR, 'project-context.md');
const TARGETS_FILE = path.join(DATA_DIR, 'context_sync_targets.json');
const LOCAL_AGENT_FILE = path.resolve(__dirname, '../../../agent/project-context.md');
const HOST_APPS_DIR = '/host_apps';
const LOCAL_WORKSPACE_PARENT = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';

const DEFAULT_TARGETS = [
  { id: 'cars-x-battle', name: 'Cars X Battle', folder: 'cars-x-battle', enabled: true },
  { id: 'gashooter', name: 'Gashooter', folder: 'gashooter', enabled: true },
  { id: 'wikisguessr', name: 'WikisGuessr', folder: 'wikisguessr', enabled: true },
  { id: 'kulturdb', name: 'KulturDB', folder: 'kulturdb', enabled: true },
  { id: 'portfolio', name: 'Portfolio Vitrine', folder: 'portfolio', enabled: true },
  { id: 'fansite', name: 'Fansite Malaisie', folder: 'fansite', enabled: true },
  { id: 'mediatheque-tln', name: 'Mediatheque-TLN', folder: 'mediatheque-tln', enabled: true },
  { id: 'discord', name: 'Dashboard Discord', folder: 'discord', enabled: true },
  { id: 'nexus-v', name: 'Nexus-V', folder: 'nexus-v', enabled: true },
  { id: 'azim-bot', name: 'Bot Discord', folder: 'azim-bot', enabled: true },
  { id: 'mars-ai', name: 'MarsAI', folder: 'mars-ai', enabled: true },
  { id: 'azim404', name: 'Azim404 (Ce projet)', folder: 'azim404', enabled: true },
];

function readTargets() {
  try {
    if (fs.existsSync(TARGETS_FILE)) {
      const raw = fs.readFileSync(TARGETS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Erreur lecture context_sync_targets.json:', err);
  }
  return DEFAULT_TARGETS;
}

function writeTargets(targets) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Erreur ecriture context_sync_targets.json:', err);
    return false;
  }
}

function readMasterContext() {
  if (fs.existsSync(MASTER_CONTEXT_FILE)) {
    return {
      content: fs.readFileSync(MASTER_CONTEXT_FILE, 'utf-8'),
      lastModified: fs.statSync(MASTER_CONTEXT_FILE).mtime.toISOString(),
      path: MASTER_CONTEXT_FILE,
    };
  }
  if (fs.existsSync(LOCAL_AGENT_FILE)) {
    const content = fs.readFileSync(LOCAL_AGENT_FILE, 'utf-8');
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(MASTER_CONTEXT_FILE, content, 'utf-8');
    } catch {}
    return {
      content,
      lastModified: fs.statSync(LOCAL_AGENT_FILE).mtime.toISOString(),
      path: LOCAL_AGENT_FILE,
    };
  }
  return {
    content: '# Contexte Projets - Prive\n\nAucun contenu defini.',
    lastModified: new Date().toISOString(),
    path: '',
  };
}

export const getContextInfo = (req, res) => {
  const master = readMasterContext();
  const targets = readTargets();
  res.json({
    success: true,
    content: master.content,
    lastModified: master.lastModified,
    targets,
  });
};

export const saveContextContent = (req, res) => {
  const { content } = req.body || {};
  if (typeof content !== 'string') {
    return res.status(400).json({ success: false, error: 'Contenu texte obligatoire' });
  }

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MASTER_CONTEXT_FILE, content, 'utf-8');

    if (fs.existsSync(path.dirname(LOCAL_AGENT_FILE))) {
      fs.writeFileSync(LOCAL_AGENT_FILE, content, 'utf-8');
    }

    const lastModified = new Date().toISOString();
    res.json({
      success: true,
      message: 'Fichier contexte enregistre sur le serveur avec succes.',
      lastModified,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateTargets = (req, res) => {
  const { targets } = req.body || {};
  if (!Array.isArray(targets)) {
    return res.status(400).json({ success: false, error: 'Liste de cibles invalide' });
  }

  writeTargets(targets);
  res.json({ success: true, targets });
};

export const propagateContext = (req, res) => {
  const master = readMasterContext();
  const targets = readTargets();
  const enabledTargets = targets.filter((t) => t.enabled);

  const synced = [];
  const errors = [];

  for (const target of enabledTargets) {
    let targetSuccess = false;
    const folder = target.folder || target.id;

    const hostAppPath = path.join(HOST_APPS_DIR, folder);
    if (fs.existsSync(hostAppPath)) {
      try {
        const destAgentDir = path.join(hostAppPath, 'agent');
        if (!fs.existsSync(destAgentDir)) fs.mkdirSync(destAgentDir, { recursive: true });
        fs.writeFileSync(path.join(destAgentDir, 'project-context.md'), master.content, 'utf-8');
        fs.writeFileSync(path.join(hostAppPath, 'project-context.md'), master.content, 'utf-8');
        targetSuccess = true;
      } catch (err) {
        errors.push({ target: target.name, error: err.message });
      }
    }

    const localProjectPath = path.join(LOCAL_WORKSPACE_PARENT, folder);
    if (fs.existsSync(localProjectPath)) {
      try {
        const destAgentDir = path.join(localProjectPath, 'agent');
        if (!fs.existsSync(destAgentDir)) fs.mkdirSync(destAgentDir, { recursive: true });
        fs.writeFileSync(path.join(destAgentDir, 'project-context.md'), master.content, 'utf-8');
        fs.writeFileSync(path.join(localProjectPath, 'project-context.md'), master.content, 'utf-8');
        targetSuccess = true;
      } catch (err) {
        // fallback
      }
    }

    if (targetSuccess) {
      synced.push(target.name);
    } else {
      errors.push({ target: target.name, error: 'Dossier du projet introuvable' });
    }
  }

  res.json({
    success: true,
    syncedCount: synced.length,
    synced,
    errors,
    syncedAt: new Date().toISOString(),
  });
};
