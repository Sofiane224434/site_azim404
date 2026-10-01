import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATUS_FILE = path.join(DATA_DIR, 'site_status.json');

const DEFAULT_SITES = {
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio Vitrine',
    domain: 'sofiane-kherarfa.azim404.com',
    inMaintenance: false,
    scope: 'ALL', // 'ALL' ou 'SPECIFIC'
    targetPages: '', // ex: '/projets, /contact'
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

    // Migration des anciens formats (sans id, domain, etc.)
    const migrated = {};
    for (const [key, value] of Object.entries({ ...DEFAULT_SITES, ...parsed })) {
      migrated[key] = {
        id: value.id || key,
        name: value.name || (key === 'portfolio' ? 'Portfolio Vitrine' : key === 'azim404' ? 'Portail Azim404' : key),
        domain: value.domain || (key === 'portfolio' ? 'sofiane-kherarfa.azim404.com' : key === 'azim404' ? 'azim404.com' : `${key}.azim404.com`),
        inMaintenance: Boolean(value.inMaintenance),
        scope: value.scope || 'ALL',
        targetPages: value.targetPages || '',
        title: value.title || (key === 'portfolio' ? 'Atelier en cours de rénovation' : 'Maintenance technique'),
        message: value.message || DEFAULT_SITES.portfolio.message,
        updatedAt: value.updatedAt || new Date().toISOString(),
      };
    }
    return migrated;
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

// GET /api/site-status
export const getAllStatus = (req, res) => {
  const sites = readStatusFile();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, sites, status: sites });
};

// GET /api/site-status/lookup?domain=...
// ou GET /api/site-status/:key
export const getSiteStatus = (req, res) => {
  const { site } = req.params;
  const domainQuery = (req.query.domain || '').trim().toLowerCase();
  const sites = readStatusFile();

  // Recherche par domaine si paramètre query
  if (domainQuery) {
    const matched = Object.values(sites).find(
      (s) => s.domain && (s.domain.toLowerCase() === domainQuery || domainQuery.endsWith(s.domain.toLowerCase()))
    );
    if (matched) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.json({ success: true, site: matched.id, ...matched });
    }
  }

  // Recherche par ID ou nom ou domaine direct
  const cleanKey = (site || '').trim().toLowerCase();
  let found = sites[cleanKey];

  if (!found) {
    found = Object.values(sites).find(
      (s) => (s.domain && s.domain.toLowerCase() === cleanKey) || s.id.toLowerCase() === cleanKey
    );
  }

  if (!found) {
    return res.status(404).json({ success: false, error: 'Site non trouvé' });
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, site: found.id, ...found });
};

// POST /api/site-status/save
// Ajoute ou met à jour la configuration complète d'un site
export const saveSite = (req, res) => {
  const { id, name, domain, scope, targetPages, title, message, inMaintenance } = req.body;

  const cleanDomain = (domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  const cleanId = (id || cleanDomain.replace(/[^a-z0-9_-]/gi, '_') || Date.now().toString()).trim().toLowerCase();

  if (!cleanDomain) {
    return res.status(400).json({ success: false, error: 'Le nom de domaine est obligatoire' });
  }

  const sites = readStatusFile();
  const existing = sites[cleanId] || {};

  const updatedSite = {
    id: cleanId,
    name: (name || cleanDomain).trim(),
    domain: cleanDomain,
    inMaintenance: typeof inMaintenance === 'boolean' ? inMaintenance : Boolean(existing.inMaintenance),
    scope: scope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL',
    targetPages: (targetPages || '').trim(),
    title: (title || existing.title || 'Site en cours de maintenance').trim(),
    message: (message || existing.message || DEFAULT_SITES.portfolio.message).trim(),
    updatedAt: new Date().toISOString(),
  };

  sites[cleanId] = updatedSite;
  writeStatusFile(sites);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, site: updatedSite, sites });
};

// POST /api/site-status/toggle
export const toggleSiteStatus = (req, res) => {
  const { site, id, inMaintenance, message, title, scope, targetPages } = req.body;
  const siteKey = (id || site || '').trim().toLowerCase();

  const sites = readStatusFile();
  const currentSite = sites[siteKey] || Object.values(sites).find((s) => s.domain.toLowerCase() === siteKey);

  if (!currentSite) {
    return res.status(404).json({ success: false, error: `Site '${siteKey}' inconnu` });
  }

  const updatedSite = {
    ...currentSite,
    inMaintenance: typeof inMaintenance === 'boolean' ? inMaintenance : !currentSite.inMaintenance,
    message: typeof message === 'string' && message.trim() ? message.trim() : currentSite.message,
    title: typeof title === 'string' && title.trim() ? title.trim() : currentSite.title,
    scope: scope ? (scope === 'SPECIFIC' ? 'SPECIFIC' : 'ALL') : currentSite.scope,
    targetPages: typeof targetPages === 'string' ? targetPages.trim() : currentSite.targetPages,
    updatedAt: new Date().toISOString(),
  };

  sites[currentSite.id] = updatedSite;
  writeStatusFile(sites);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, site: currentSite.id, status: updatedSite, sites, all: sites });
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
  res.json({ success: true, message: 'Site supprimé avec succès', sites });
};
