import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATUS_FILE = path.join(DATA_DIR, 'site_status.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'portfolio_projects.json');

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

function readStatusFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATUS_FILE)) {
      fs.writeFileSync(STATUS_FILE, JSON.stringify(DEFAULT_SITES, null, 2), 'utf-8');
      return DEFAULT_SITES;
    }
    const raw = fs.readFileSync(STATUS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SITES, ...parsed };
  } catch (error) {
    console.error('Erreur lecture site_status.json:', error);
    return DEFAULT_SITES;
  }
}

function writeStatusFile(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur ecriture site_status.json:', error);
    return false;
  }
}

// Synchronise l'état de maintenance dans portfolio_projects.json si le projet y existe
function syncProjectMaintenance(id, domain, inMaintenance) {
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return;
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const projects = JSON.parse(raw);
    if (!Array.isArray(projects)) return;

    let modified = false;
    for (const proj of projects) {
      if (
        proj.id === id ||
        (proj.domain && proj.domain.toLowerCase() === domain?.toLowerCase())
      ) {
        proj.inMaintenance = inMaintenance;
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
    }
  } catch (e) {
    // silencieux
  }
}

// GET /api/site-status
export const getAllStatus = (req, res) => {
  const sites = readStatusFile();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, sites, status: sites });
};

// GET /api/site-status/lookup?domain=...
// ou GET /api/site-status/:site
export const getSiteStatus = (req, res) => {
  const { site } = req.params;
  const rawDomain = req.query.domain || site || '';
  const cleanDomain = rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')
    .split('/')[0]; // juste le hostname

  const sites = readStatusFile();

  // Recherche par domaine exact, par sous-domaine ou par ID
  const matched = Object.values(sites).find((s) => {
    if (!s) return false;
    const sDomain = (s.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const sId = (s.id || '').toLowerCase();
    return sDomain === cleanDomain || sId === cleanDomain || cleanDomain.endsWith(sDomain);
  });

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (matched) {
    return res.json({ success: true, site: matched.id, ...matched });
  }

  // Ne jamais planter : renvoie un statut en ligne par défaut si non enregistré
  return res.json({
    success: true,
    site: cleanDomain,
    inMaintenance: false,
    scope: 'ALL',
    targetPages: '',
    title: 'Atelier en cours de rénovation',
    message: '',
  });
};

// POST /api/site-status/save
export const saveSite = (req, res) => {
  const { id, name, domain, scope, targetPages, title, message, inMaintenance } = req.body;

  const cleanDomain = (domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const cleanId = (id || cleanDomain.replace(/[^a-z0-9_-]/gi, '_') || Date.now().toString()).trim().toLowerCase();

  if (!cleanDomain && !cleanId) {
    return res.status(400).json({ success: false, error: 'Identifiant ou domaine obligatoire' });
  }

  const sites = readStatusFile();
  const existing = sites[cleanId] || {};

  const updatedSite = {
    id: cleanId,
    name: (name || cleanDomain || cleanId).trim(),
    domain: cleanDomain || existing.domain || `${cleanId}.azim404.com`,
    inMaintenance: typeof inMaintenance === 'boolean' ? inMaintenance : Boolean(existing.inMaintenance),
    scope: scope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL',
    targetPages: (targetPages || '').trim(),
    title: (title || existing.title || 'Atelier en cours de rénovation').trim(),
    message: (message || existing.message || DEFAULT_SITES.portfolio.message).trim(),
    updatedAt: new Date().toISOString(),
  };

  sites[cleanId] = updatedSite;
  writeStatusFile(sites);

  // Synchronise aussi le projet portfolio
  syncProjectMaintenance(cleanId, updatedSite.domain, updatedSite.inMaintenance);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, site: updatedSite, sites });
};

// POST /api/site-status/toggle
// Permet de basculer la maintenance en 1 clic de n'importe quel site ou projet (l'auto-crée s'il n'existe pas encore)
export const toggleSiteStatus = (req, res) => {
  const { site, id, inMaintenance, message, title, scope, targetPages, domain, name } = req.body;
  const siteKey = (id || site || '').trim().toLowerCase();
  const cleanDomain = (domain || siteKey)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const sites = readStatusFile();
  let currentSite =
    sites[siteKey] ||
    Object.values(sites).find(
      (s) => (s.domain && s.domain.toLowerCase() === cleanDomain) || s.id.toLowerCase() === siteKey
    );

  // Si le site n'existe pas encore dans site_status.json, ON LE CRÉE AUTOMATIQUEMENT
  if (!currentSite) {
    const finalId = siteKey || cleanDomain.replace(/[^a-z0-9_-]/gi, '_') || Date.now().toString();
    currentSite = {
      id: finalId,
      name: name || cleanDomain || finalId,
      domain: cleanDomain || `${finalId}.azim404.com`,
      inMaintenance: false,
      scope: scope || 'ALL',
      targetPages: targetPages || '',
      title: title || 'Atelier en cours de rénovation',
      message: message || DEFAULT_SITES.portfolio.message,
      updatedAt: new Date().toISOString(),
    };
    sites[finalId] = currentSite;
  }

  const nextState = typeof inMaintenance === 'boolean' ? inMaintenance : !currentSite.inMaintenance;

  currentSite.inMaintenance = nextState;
  if (message && message.trim()) currentSite.message = message.trim();
  if (title && title.trim()) currentSite.title = title.trim();
  if (scope) currentSite.scope = scope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL';
  if (targetPages !== undefined) currentSite.targetPages = (targetPages || '').trim();
  if (cleanDomain) currentSite.domain = cleanDomain;
  currentSite.updatedAt = new Date().toISOString();

  sites[currentSite.id] = currentSite;
  writeStatusFile(sites);

  // Synchronise portfolio_projects.json
  syncProjectMaintenance(currentSite.id, currentSite.domain, nextState);

  console.log(`[STATUS] Site '${currentSite.id}' (${currentSite.domain}) -> maintenance: ${nextState}`);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, site: currentSite.id, status: currentSite, sites, all: sites });
};

// DELETE /api/site-status/:id
export const deleteSite = (req, res) => {
  const { id } = req.params;
  const cleanId = (id || '').trim().toLowerCase();

  const protectedSites = ['portfolio', 'azim404'];
  if (protectedSites.includes(cleanId)) {
    return res.status(400).json({ success: false, error: 'Ce site principal ne peut pas être supprimé' });
  }

  const sites = readStatusFile();
  if (!sites[cleanId]) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }

  delete sites[cleanId];
  writeStatusFile(sites);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, message: 'Site supprimé de l’admin', sites });
};
