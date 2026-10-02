import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  dbGetContextTargets,
  dbSaveContextTargets,
  dbGetContextFile,
  dbSaveContextFile,
} from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_PROJECT_DIR = path.resolve(__dirname, '../../..');
const DATA_DIR = path.resolve(__dirname, '../../data');
const HOST_APPS_DIR = '/host_apps';
const LOCAL_WORKSPACE_PARENT = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';

// Dossier de synchronisation situe directement a la racine du projet ('sync')
function resolveSyncFolder() {
  const candidates = [
    path.join(ROOT_PROJECT_DIR, 'sync'),
    path.join('/host_apps/azim404', 'sync'),
    path.join('/app', 'sync'),
    path.join(DATA_DIR, 'sync'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const chosen = fs.existsSync('/host_apps/azim404')
    ? path.join('/host_apps/azim404', 'sync')
    : path.join(ROOT_PROJECT_DIR, 'sync');
  fs.mkdirSync(chosen, { recursive: true });
  return chosen;
}

const CONTEXT_FOLDER = resolveSyncFolder();

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

function initContextStorage() {
  fs.mkdirSync(CONTEXT_FOLDER, { recursive: true });

  const primaryFile = path.join(CONTEXT_FOLDER, 'project-context.md');
  if (!fs.existsSync(primaryFile)) {
    const rootContext = path.join(ROOT_PROJECT_DIR, 'project-context.md');
    if (fs.existsSync(rootContext)) {
      fs.copyFileSync(rootContext, primaryFile);
    } else {
      fs.writeFileSync(primaryFile, '# Contexte Projets - Prive\n\nConfiguration initiale.\n', 'utf8');
    }
  }
}

initContextStorage();

// Sécurité : garantit que .gitignore et .env protègent les données sensibles
function secureTargetProject(projectDir) {
  try {
    if (!fs.existsSync(projectDir)) return;

    // 1. Protection .gitignore
    const gitignorePath = path.join(projectDir, '.gitignore');
    let currentGitignore = '';
    if (fs.existsSync(gitignorePath)) {
      currentGitignore = fs.readFileSync(gitignorePath, 'utf8');
    }

    const rules = [
      '.env',
      '.env.local',
      '.env.*.local',
      'sync/',
      'agent/',
      'shared-context/',
      'project-context.md',
      '*contexte*prive*.md',
    ];

    const missingRules = rules.filter((r) => !currentGitignore.includes(r));
    if (missingRules.length > 0) {
      const appendContent = '\n# Securite Contexte Prive et Secrets\n' + missingRules.join('\n') + '\n';
      fs.appendFileSync(gitignorePath, appendContent, 'utf8');
    }

    // 2. Vérification / Initialisation .env
    const envPath = path.join(projectDir, '.env');
    if (!fs.existsSync(envPath)) {
      const envExamplePath = path.join(projectDir, '.env.example');
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
      }
    }
  } catch (err) {
    console.error(`[Securite Project] Erreur securisation ${projectDir}:`, err.message);
  }
}

// GET /api/context
export const getContextInfo = async (req, res) => {
  initContextStorage();

  const files = fs.readdirSync(CONTEXT_FOLDER).map((name) => {
    const filePath = path.join(CONTEXT_FOLDER, name);
    const stat = fs.statSync(filePath);
    return {
      filename: name,
      size: stat.size,
      lastModified: stat.mtime.toISOString(),
    };
  });

  const activeFilename = req.query.file || 'project-context.md';
  const targetFilePath = path.join(CONTEXT_FOLDER, activeFilename);

  let content = '';
  let lastModified = new Date().toISOString();

  // Essayer depuis SQL
  const sqlFile = await dbGetContextFile(activeFilename);
  if (sqlFile) {
    content = sqlFile.content;
    lastModified = sqlFile.lastModified;
  } else if (fs.existsSync(targetFilePath)) {
    content = fs.readFileSync(targetFilePath, 'utf8');
    lastModified = fs.statSync(targetFilePath).mtime.toISOString();
    // Sauvegarder dans SQL
    await dbSaveContextFile(activeFilename, content);
  }

  const targets = await dbGetContextTargets(DEFAULT_TARGETS);

  res.json({
    success: true,
    activeFile: activeFilename,
    content,
    lastModified,
    files,
    targets,
  });
};

// POST /api/context/save
export const saveContextContent = async (req, res) => {
  const { content, filename } = req.body || {};
  if (typeof content !== 'string') {
    return res.status(400).json({ success: false, error: 'Contenu texte obligatoire' });
  }

  const activeFilename = (filename || 'project-context.md').trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  const targetFilePath = path.join(CONTEXT_FOLDER, activeFilename);

  try {
    fs.mkdirSync(CONTEXT_FOLDER, { recursive: true });
    fs.writeFileSync(targetFilePath, content, 'utf8');

    // Sauvegarde miroir project-context.md
    if (activeFilename === 'project-context.md') {
      fs.writeFileSync(MASTER_CONTEXT_FILE, content, 'utf8');
      if (fs.existsSync(LOCAL_AGENT_DIR)) {
        fs.writeFileSync(path.join(LOCAL_AGENT_DIR, 'project-context.md'), content, 'utf8');
      }
    }

    // Sauvegarde en base de données SQL
    await dbSaveContextFile(activeFilename, content);

    const lastModified = new Date().toISOString();
    res.json({
      success: true,
      filename: activeFilename,
      message: `Fichier ${activeFilename} enregistré avec succès en base SQL et stockage persistant.`,
      lastModified,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/context/targets
export const updateTargets = async (req, res) => {
  const { targets } = req.body || {};
  if (!Array.isArray(targets)) {
    return res.status(400).json({ success: false, error: 'Liste de cibles invalide' });
  }

  await dbSaveContextTargets(targets);
  res.json({ success: true, targets });
};

// POST /api/context/sync
// Synchronise le dossier complet vers tous les projets cibles (VPS + local si accessible)
export const propagateContext = async (req, res) => {
  initContextStorage();

  const filesInContext = fs.readdirSync(CONTEXT_FOLDER);
  const targets = await dbGetContextTargets(DEFAULT_TARGETS);
  const enabledTargets = targets.filter((t) => t.enabled);

  const synced = [];
  const errors = [];
  const securedProjects = [];

  for (const target of enabledTargets) {
    let targetSuccess = false;
    const folder = target.folder || target.id;

    // 1. Traitement VPS
    const hostAppPath = path.join(HOST_APPS_DIR, folder);
    if (fs.existsSync(hostAppPath)) {
      try {
        // Sécurisation .gitignore et .env avant toute écriture de données sensibles
        secureTargetProject(hostAppPath);
        securedProjects.push(target.name);

        const destSyncDir = path.join(hostAppPath, 'sync');
        fs.mkdirSync(destSyncDir, { recursive: true });

        for (const file of filesInContext) {
          const src = path.join(CONTEXT_FOLDER, file);
          const dest = path.join(destSyncDir, file);
          fs.copyFileSync(src, dest);
          if (file === 'project-context.md') {
            fs.copyFileSync(src, path.join(hostAppPath, 'project-context.md'));
          }
        }
        targetSuccess = true;
      } catch (err) {
        errors.push({ target: target.name, error: err.message });
      }
    }

    // 2. Traitement Local (si accessible)
    const localProjectPath = path.join(LOCAL_WORKSPACE_PARENT, folder);
    if (fs.existsSync(localProjectPath)) {
      try {
        secureTargetProject(localProjectPath);
        const destSyncDir = path.join(localProjectPath, 'sync');
        fs.mkdirSync(destSyncDir, { recursive: true });

        for (const file of filesInContext) {
          const src = path.join(CONTEXT_FOLDER, file);
          const dest = path.join(destSyncDir, file);
          fs.copyFileSync(src, dest);
          if (file === 'project-context.md') {
            fs.copyFileSync(src, path.join(localProjectPath, 'project-context.md'));
          }
        }
        targetSuccess = true;
      } catch (err) {
        // silencieux
      }
    }

    if (targetSuccess) {
      synced.push(target.name);
    } else {
      errors.push({ target: target.name, error: 'Dossier introuvable sur le système' });
    }
  }

  res.json({
    success: true,
    syncedCount: synced.length,
    synced,
    securedProjects,
    errors,
    syncedAt: new Date().toISOString(),
  });
};

// GET /api/context/bundle
// Exporte tous les fichiers du dossier pour synchronisation locale via CLI
export const getContextBundle = async (req, res) => {
  initContextStorage();

  const filesInContext = fs.readdirSync(CONTEXT_FOLDER);
  const bundle = {};

  for (const file of filesInContext) {
    const filePath = path.join(CONTEXT_FOLDER, file);
    bundle[file] = fs.readFileSync(filePath, 'utf8');
  }

  res.json({
    success: true,
    fileCount: Object.keys(bundle).length,
    bundle,
    generatedAt: new Date().toISOString(),
  });
};

// POST /api/context/targets/add
// Permet d'ajouter un nouveau projet à la liste de synchronisation
export const addTarget = async (req, res) => {
  const { name, folder, enabled = true } = req.body || {};
  if (!name || !folder) {
    return res.status(400).json({ success: false, error: 'Nom et dossier du projet obligatoires' });
  }

  const cleanFolder = folder.trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  const cleanId = cleanFolder.toLowerCase();

  const targets = await dbGetContextTargets(DEFAULT_TARGETS);
  const existingIdx = targets.findIndex((t) => t.id === cleanId || t.folder.toLowerCase() === cleanFolder.toLowerCase());

  if (existingIdx >= 0) {
    targets[existingIdx].name = name.trim();
    targets[existingIdx].folder = cleanFolder;
    targets[existingIdx].enabled = Boolean(enabled);
  } else {
    targets.push({
      id: cleanId,
      name: name.trim(),
      folder: cleanFolder,
      enabled: Boolean(enabled),
    });
  }

  await dbSaveContextTargets(targets);
  res.json({
    success: true,
    message: `Projet "${name}" configuré avec succès pour la synchronisation.`,
    targets,
  });
};

// DELETE /api/context/targets/:id
export const deleteTarget = async (req, res) => {
  const { id } = req.params;
  const targets = await dbGetContextTargets(DEFAULT_TARGETS);
  const filtered = targets.filter((t) => t.id !== id && t.folder !== id);
  await dbSaveContextTargets(filtered);
  res.json({ success: true, message: 'Projet retiré de la liste de synchronisation', targets: filtered });
};
