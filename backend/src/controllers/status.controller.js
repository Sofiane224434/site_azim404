import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATUS_FILE = path.join(DATA_DIR, 'site_status.json');

const DEFAULT_STATUS = {
  portfolio: {
    inMaintenance: false,
    message: "Le site est actuellement en cours de maintenance et d'optimisation. Nous serons de retour très prochainement.",
    updatedAt: new Date().toISOString(),
  },
  azim404: {
    inMaintenance: false,
    message: "Maintenance technique planifiée sur le portail Azim404.",
    updatedAt: new Date().toISOString(),
  },
};

function readStatusFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATUS_FILE)) {
      fs.writeFileSync(STATUS_FILE, JSON.stringify(DEFAULT_STATUS, null, 2), 'utf-8');
      return DEFAULT_STATUS;
    }
    const raw = fs.readFileSync(STATUS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATUS, ...parsed };
  } catch (error) {
    console.error('Erreur lecture site_status.json:', error);
    return DEFAULT_STATUS;
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
  const status = readStatusFile();
  res.json({ success: true, status });
};

// GET /api/site-status/:site
export const getSiteStatus = (req, res) => {
  const { site } = req.params;
  const status = readStatusFile();
  if (!status[site]) {
    return res.status(404).json({ success: false, error: 'Site inconnu' });
  }
  res.json({ success: true, site, ...status[site] });
};

// POST /api/site-status/toggle
export const toggleSiteStatus = (req, res) => {
  const { site, inMaintenance, message } = req.body;
  if (!site || !['portfolio', 'azim404'].includes(site)) {
    return res.status(400).json({ success: false, error: 'Site invalide (portfolio ou azim404)' });
  }

  const current = readStatusFile();
  const currentSite = current[site] || {};

  const updatedSite = {
    ...currentSite,
    inMaintenance: typeof inMaintenance === 'boolean' ? inMaintenance : !currentSite.inMaintenance,
    message: typeof message === 'string' && message.trim() ? message.trim() : currentSite.message,
    updatedAt: new Date().toISOString(),
  };

  const updatedStatus = {
    ...current,
    [site]: updatedSite,
  };

  writeStatusFile(updatedStatus);

  console.log(`[STATUS] Site ${site} maintenance = ${updatedSite.inMaintenance}`);
  res.json({ success: true, site, status: updatedSite, all: updatedStatus });
};
