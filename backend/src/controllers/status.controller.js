import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATUS_FILE = path.join(DATA_DIR, 'site_status.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'portfolio_projects.json');

const VALID_BYPASS_KEYS = ['azim404', 'admin404', 'azim2026', 'admin'];

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

// Helper pour trouver un site de manière ultra précise (sans faux positifs de sous-domaines)
export function findMatchingSite(sites, domainOrId) {
  if (!sites || !domainOrId) return null;
  const clean = String(domainOrId)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0]; // enleve le port

  const sitesList = Object.values(sites).filter(Boolean);

  // 1. Domaine exact (ex: cxb.azim404.com === cxb.azim404.com)
  let found = sitesList.find((s) => {
    const sDomain = (s.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0];
    return sDomain === clean;
  });
  if (found) return found;

  // 2. ID exact (ex: "cxb" === "cxb")
  found = sitesList.find((s) => (s.id || '').toLowerCase() === clean);
  if (found) return found;

  // 3. WWW exact (www.domaine.com <-> domaine.com)
  found = sitesList.find((s) => {
    const sDomain = (s.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0];
    return clean === `www.${sDomain}` || sDomain === `www.${clean}`;
  });
  if (found) return found;

  // 4. Correspondance par sous-domaine spécifique (ex: clean "cxb.azim404.com" -> sub "cxb")
  // NE JAMAIS faire matcher le domaine racine "azim404.com" pour un sous-domaine !
  const parts = clean.split('.');
  if (parts.length > 2) {
    const sub = parts[0];
    if (sub && sub !== 'www') {
      found = sitesList.find((s) => {
        const sId = (s.id || '').toLowerCase();
        const sDomain = (s.domain || '').toLowerCase().replace(/^https?:\/\//, '');
        return sId === sub || sDomain.startsWith(`${sub}.`);
      });
      if (found) return found;
    }
  }

  return null;
}

// Verification de dérogation administrateur (Cookie ou Paramètre URL)
function isBypassActive(req) {
  // 1. Cookie azim_maintenance_bypass=true
  const cookieHeader = req.headers['cookie'] || '';
  if (cookieHeader.includes('azim_maintenance_bypass=true')) {
    return true;
  }

  // 2. Query param directe (?admin_bypass=azim404)
  const query = req.query || {};
  const bypassParam = query.admin_bypass || query.azim_admin_bypass || query.bypass;
  if (bypassParam && VALID_BYPASS_KEYS.includes(String(bypassParam).toLowerCase().trim())) {
    return true;
  }

  // 3. Nginx X-Original-URI forwarded query string
  const origUri = req.headers['x-original-uri'] || '';
  if (origUri.includes('?')) {
    const qs = origUri.split('?')[1] || '';
    const params = new URLSearchParams(qs);
    const p = params.get('admin_bypass') || params.get('azim_admin_bypass') || params.get('bypass');
    if (p && VALID_BYPASS_KEYS.includes(String(p).toLowerCase().trim())) {
      return true;
    }
  }

  return false;
}

// GET /api/site-status
export const getAllStatus = (req, res) => {
  const sites = readStatusFile();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, sites, status: sites });
};

// GET /api/site-status/check
// Utilisé par le module Nginx auth_request pour intercepter n'importe quel site du VPS
export const checkMaintenanceStatus = (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Si Sofiane a sa clé ou son cookie bypass actif -> 200 OK immédiat
  if (isBypassActive(req)) {
    return res.status(200).send('BYPASS_ACTIVE');
  }

  const rawHost =
    req.query.domain ||
    req.headers['x-original-host'] ||
    req.headers['x-forwarded-host'] ||
    (req.headers['host'] && !/localhost|127\.0\.0\.1/i.test(req.headers['host']) ? req.headers['host'] : '') ||
    '';

  const sites = readStatusFile();
  const matched = findMatchingSite(sites, rawHost);

  if (matched && matched.inMaintenance) {
    const rawUri =
      req.headers['x-original-uri'] ||
      req.headers['x-forwarded-uri'] ||
      req.url ||
      '/';

    const cleanPath = rawUri.split('?')[0].toLowerCase();

    // Verification du ciblage de pages
    if (matched.scope === 'SPECIFIC' && matched.targetPages) {
      const paths = matched.targetPages
        .split(',')
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);

      const isTargeted = paths.some((p) => cleanPath.startsWith(p));
      if (!isTargeted) {
        return res.status(200).send('OK_NOT_TARGETED');
      }
    }

    // Le site est bien en travaux pour le visiteur public
    return res.status(403).send('MAINTENANCE_ACTIVE');
  }

  return res.status(200).send('OK');
};

// GET /api/site-status/lookup?domain=...
// ou GET /api/site-status/:site
export const getSiteStatus = (req, res) => {
  const { site } = req.params;
  const rawDomain = req.query.domain || site || '';
  const sites = readStatusFile();
  const matched = findMatchingSite(sites, rawDomain);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (matched) {
    return res.json({ success: true, site: matched.id, ...matched });
  }

  // Ne jamais planter : renvoie un statut en ligne par défaut si non enregistré
  const clean = rawDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return res.json({
    success: true,
    site: clean,
    inMaintenance: false,
    scope: 'ALL',
    targetPages: '',
    title: 'Atelier en cours de rénovation',
    message: '',
  });
};

// GET /api/site-status/maintenance-screen
// Renvoie la page HTML complète et dynamique servie par Nginx en cas de maintenance
export const renderMaintenanceScreen = (req, res) => {
  const rawHost =
    req.query.domain ||
    req.headers['x-original-host'] ||
    req.headers['x-forwarded-host'] ||
    (req.headers['host'] && !/localhost|127\.0\.0\.1/i.test(req.headers['host']) ? req.headers['host'] : '') ||
    '';

  const sites = readStatusFile();
  const matched = findMatchingSite(sites, rawHost) || {
    name: rawHost || 'Sofiane Kherarfa',
    title: 'Atelier en cours de rénovation',
    message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants.",
  };

  const escapeHtml = (str) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const safeTitle = escapeHtml(matched.title || 'Atelier en cours de rénovation');
  const safeMessage = escapeHtml(matched.message || "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités et j'optimise mes projets. Le site sera de retour d'ici quelques instants.");
  const safeName = escapeHtml(matched.name || rawHost || 'Sofiane Kherarfa');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | ${safeName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #030712;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow-x: hidden;
    }
    .glow-1 {
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, rgba(6, 182, 212, 0.12) 50%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
    }
    .glow-2 {
      position: absolute;
      bottom: -80px;
      right: 5%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
    }
    .grid-bg {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
      background-size: 28px 28px;
      opacity: 0.7;
      pointer-events: none;
    }
    header {
      position: relative;
      z-index: 10;
      padding: 1.5rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
    }
    .brand-title {
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: -0.02em;
    }
    .brand-sub {
      font-size: 0.7rem;
      font-family: 'JetBrains Mono', monospace;
      color: #94a3b8;
    }
    .badge-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fcd34d;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f59e0b;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
      100% { opacity: 1; transform: scale(1); }
    }
    main {
      position: relative;
      z-index: 10;
      max-width: 680px;
      margin: auto;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .center-badge {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .avatar-bolt {
      width: 80px;
      height: 80px;
      border-radius: 24px;
      background: linear-gradient(135deg, #0f172a, #082f49);
      border: 1px solid rgba(6, 182, 212, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.2rem;
      box-shadow: 0 0 35px rgba(6, 182, 212, 0.25);
    }
    .dev-tag {
      padding: 0.3rem 0.9rem;
      border-radius: 9999px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(51, 65, 85, 0.8);
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      color: #67e8f9;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1rem;
    }
    p.lead {
      color: #cbd5e1;
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }
    .personal-card {
      background: rgba(2, 6, 23, 0.75);
      border: 1px solid rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 1.75rem;
      text-align: left;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 0.75rem;
      margin-bottom: 1rem;
    }
    .card-content {
      color: #e2e8f0;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 1.25rem;
    }
    .card-content p {
      margin-bottom: 0.5rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .btn-contact {
      flex: 1;
      min-width: 180px;
      padding: 0.75rem 1.25rem;
      background: #0891b2;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.35);
    }
    .btn-contact:hover {
      background: #06b6d4;
    }
    .btn-copy {
      padding: 0.75rem 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      color: #cbd5e1;
      border-radius: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .btn-copy:hover {
      background: #1e293b;
      color: #ffffff;
    }
    .card-footer {
      margin-top: 1rem;
      font-size: 0.75rem;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .card-footer a {
      color: #22d3ee;
      text-decoration: none;
      font-family: 'JetBrains Mono', monospace;
    }
    footer {
      position: relative;
      z-index: 10;
      padding: 1rem 2rem;
      font-size: 0.75rem;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .btn-bypass {
      background: transparent;
      border: none;
      color: #475569;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      transition: color 0.2s;
    }
    .btn-bypass:hover {
      color: #94a3b8;
    }
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    .modal-box {
      width: 100%;
      max-width: 380px;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 1.75rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .modal-title {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .modal-desc {
      font-size: 0.8rem;
      color: #94a3b8;
      line-height: 1.4;
      margin-bottom: 1.25rem;
    }
    .modal-input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      margin-bottom: 1rem;
      outline: none;
    }
    .modal-input:focus {
      border-color: #06b6d4;
    }
    .modal-btns {
      display: flex;
      gap: 0.5rem;
    }
    .btn-cancel {
      flex: 1;
      padding: 0.65rem;
      border-radius: 10px;
      background: #0f172a;
      border: 1px solid #1e293b;
      color: #94a3b8;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .btn-unlock {
      flex: 1;
      padding: 0.65rem;
      border-radius: 10px;
      background: #0891b2;
      border: none;
      color: #ffffff;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.8rem;
    }
    .error-msg {
      color: #f87171;
      font-size: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      margin-top: -0.5rem;
      margin-bottom: 0.75rem;
      display: none;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  <div class="grid-bg"></div>

  <header>
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <div>
        <div class="brand-title">${safeName}</div>
        <div class="brand-sub">Espace Créatif &amp; Développement</div>
      </div>
    </div>
    <div class="badge-status">
      <div class="pulse-dot"></div>
      <span>PAUSE TECHNIQUE</span>
    </div>
  </header>

  <main>
    <div class="center-badge">
      <div class="avatar-bolt">⚡</div>
      <div class="dev-tag">Sofiane Kherarfa • Développeur Full Stack</div>
    </div>

    <h1>${safeTitle}</h1>
    <p class="lead">${safeMessage}</p>

    <div class="personal-card">
      <div class="card-header">
        <span>● En direct de l'établi</span>
        <span style="color: #22d3ee;">Azim404 Lab</span>
      </div>
      <div class="card-content">
        <p>▹ <strong>Je retravaille l'expérience, le design et les fonctionnalités de ce site.</strong></p>
        <p>▹ Un projet à concevoir ou besoin d'échanger ? Vous pouvez m'écrire directement :</p>
      </div>

      <div class="actions">
        <a href="mailto:sb.kherarfa@gmail.com" class="btn-contact">
          <span>✉️ Écrire à Sofiane</span>
        </a>
        <button type="button" class="btn-copy" onclick="copyEmail(this)">
          <span>sb.kherarfa@gmail.com</span>
          <span id="copy-icon" style="color: #22d3ee;">⧉</span>
        </button>
      </div>

      <div class="card-footer">
        <span>Projets open-source disponibles :</span>
        <a href="https://github.com/Sofiane224434" target="_blank" rel="noopener noreferrer">github.com/Sofiane224434 ↗</a>
      </div>
    </div>
  </main>

  <footer>
    <div>© ${new Date().getFullYear()} Sofiane Kherarfa • Azim404</div>
    <button type="button" class="btn-bypass" onclick="openBypassModal()">
      <span>Accès développeur</span>
      <span>🔒</span>
    </button>
  </footer>

  <div id="bypass-modal" class="modal-overlay">
    <div class="modal-box">
      <div class="modal-title">🔑 Accès Développeur</div>
      <div class="modal-desc">Entrez votre clé administrateur pour lever la maintenance et accéder au site normalement.</div>
      <input type="password" id="bypass-input" class="modal-input" placeholder="Clé admin (ex: azim404)" autofocus>
      <div id="bypass-error" class="error-msg">Clé administrateur incorrecte</div>
      <div class="modal-btns">
        <button type="button" class="btn-cancel" onclick="closeBypassModal()">Annuler</button>
        <button type="button" class="btn-unlock" onclick="submitBypass()">Débloquer l'accès</button>
      </div>
    </div>
  </div>

  <script>
    // 1. Auto-bypass check via URL param
    (function() {
      const params = new URLSearchParams(window.location.search);
      const bypass = params.get('admin_bypass') || params.get('azim_admin_bypass') || params.get('bypass');
      const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];
      if (bypass && validKeys.includes(bypass.toLowerCase().trim())) {
        document.cookie = 'azim_maintenance_bypass=true; path=/; max-age=2592000; SameSite=Lax';
        localStorage.setItem('azim_maintenance_bypass', 'true');
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        window.location.reload();
      }
    })();

    function copyEmail(btn) {
      navigator.clipboard.writeText('sb.kherarfa@gmail.com');
      const icon = document.getElementById('copy-icon');
      if (icon) icon.innerText = '✓';
      setTimeout(() => {
        if (icon) icon.innerText = '⧉';
      }, 2500);
    }

    function openBypassModal() {
      document.getElementById('bypass-modal').style.display = 'flex';
      document.getElementById('bypass-input').focus();
    }

    function closeBypassModal() {
      document.getElementById('bypass-modal').style.display = 'none';
      document.getElementById('bypass-error').style.display = 'none';
    }

    function submitBypass() {
      const key = (document.getElementById('bypass-input').value || '').trim().toLowerCase();
      const validKeys = ['azim404', 'admin404', 'azim2026', 'admin'];
      if (validKeys.includes(key)) {
        document.cookie = 'azim_maintenance_bypass=true; path=/; max-age=2592000; SameSite=Lax';
        localStorage.setItem('azim_maintenance_bypass', 'true');
        window.location.reload();
      } else {
        document.getElementById('bypass-error').style.display = 'block';
      }
    }

    document.getElementById('bypass-input')?.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') submitBypass();
      if (e.key === 'Escape') closeBypassModal();
    });
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Retry-After', '300');
  res.status(503).send(html);
};

// POST /api/site-status/save
export const saveSite = (req, res) => {
  const { id, name, domain, scope, targetPages, title, message, inMaintenance } = req.body || {};

  const cleanDomain = (domain || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0];
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
  const { site, id, inMaintenance, message, title, scope, targetPages, domain, name } = req.body || {};
  const siteKey = (id || site || '').trim().toLowerCase();
  const cleanDomain = (domain || siteKey)
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0];

  const sites = readStatusFile();
  let currentSite =
    sites[siteKey] ||
    findMatchingSite(sites, cleanDomain) ||
    findMatchingSite(sites, siteKey);

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

// Helper pour interroger un hôte en HTTP ou HTTPS avec suivi des redirections et tolérance aux pannes
async function queryDomainRawHeaders(targetUrl, timeoutMs = 8000, maxRedirects = 3) {
  let currentUrl = targetUrl;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    let urlObj;
    try {
      urlObj = new URL(currentUrl);
    } catch {
      throw new Error('INVALID_URL');
    }

    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const res = await new Promise((resolve, reject) => {
      const req = client.request(
        urlObj,
        {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Azim404-SecurityAudit/1.0',
            'Accept': 'text/html,*/*',
            'Connection': 'close',
          },
          rejectUnauthorized: false,
          timeout: timeoutMs,
        },
        (resp) => {
          const headers = {};
          for (const [k, v] of Object.entries(resp.headers)) {
            headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
          }
          resp.resume();
          resolve({
            statusCode: resp.statusCode,
            headers,
            isHttps,
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('TIMEOUT'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    });

    // Suivi automatique des redirections 301/302/307/308 pour auditer la vraie cible finale
    if ([301, 302, 307, 308].includes(res.statusCode) && res.headers['location']) {
      let nextLocation = res.headers['location'];
      if (!nextLocation.startsWith('http')) {
        nextLocation = new URL(nextLocation, currentUrl).href;
      }
      currentUrl = nextLocation;
      redirects++;
      continue;
    }

    return res;
  }
}

// GET /api/site-status/audit-headers?domain=...
export const auditSiteHeaders = async (req, res) => {
  const rawDomain = req.query.domain || '';
  const cleanDomain = rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .split(':')[0];

  if (!cleanDomain) {
    return res.status(400).json({ success: false, error: 'Domaine manquant' });
  }

  const securityHeaderTool = [
    {
      id: 'securityheaders',
      name: 'SecurityHeaders.com',
      url: `https://securityheaders.com/?q=${encodeURIComponent(cleanDomain)}&followRedirects=on`,
      category: 'Sécurité HTTP',
      icon: '🛡️',
      desc: 'Audit officiel SecurityHeaders.com',
    },
  ];

  try {
    let result;
    // Tentative 1 : HTTPS direct
    try {
      result = await queryDomainRawHeaders(`https://${cleanDomain}`);
    } catch (httpsErr) {
      // Tentative 2 : HTTP standard si HTTPS refuse ou échoue
      try {
        result = await queryDomainRawHeaders(`http://${cleanDomain}`);
      } catch (httpErr) {
        // Nouvelle tentative avec pause courte de 400ms pour éviter les erreurs de socket transitoires
        await new Promise((r) => setTimeout(r, 400));
        try {
          result = await queryDomainRawHeaders(`https://${cleanDomain}`, 10000);
        } catch {
          throw httpsErr;
        }
      }
    }

    const headers = result.headers || {};
    const hsts = headers['strict-transport-security'];
    const xcto = headers['x-content-type-options'];
    const xfo = headers['x-frame-options'];
    const csp = headers['content-security-policy'];
    const rp = headers['referrer-policy'];
    const pp = headers['permissions-policy'];

    // Barème conforme à SecurityHeaders.com
    const checks = {
      hsts: {
        name: 'Strict-Transport-Security (HSTS)',
        present: Boolean(hsts),
        value: hsts || null,
        desc: 'Force le chiffrement HTTPS et empêche les attaques Man-in-the-middle',
        weight: 30,
      },
      xcto: {
        name: 'X-Content-Type-Options',
        present: Boolean(xcto),
        value: xcto || null,
        desc: 'Empêche le reniflage de type MIME (nosniff)',
        weight: 15,
      },
      xfo: {
        name: 'X-Frame-Options',
        present: Boolean(xfo),
        value: xfo || null,
        desc: 'Interdit l’intégration iframe malveillante (Clickjacking)',
        weight: 20,
      },
      csp: {
        name: 'Content-Security-Policy (CSP)',
        present: Boolean(csp),
        value: csp || null,
        desc: 'Restreint les sources de scripts et bloque les failles XSS',
        weight: 25,
      },
      rp: {
        name: 'Referrer-Policy',
        present: Boolean(rp),
        value: rp || null,
        desc: 'Contrôle la transmission de l’en-tête Referer lors des navigations',
        weight: 10,
      },
      pp: {
        name: 'Permissions-Policy',
        present: Boolean(pp),
        value: pp || null,
        desc: 'Désactive les fonctionnalités matérielles inutilisées (caméra, micro)',
        weight: 5,
      },
    };

    let score = 0;
    if (checks.hsts.present) score += checks.hsts.weight;
    if (checks.xcto.present) score += checks.xcto.weight;
    if (checks.xfo.present) score += checks.xfo.weight;
    if (checks.csp.present) score += checks.csp.weight;
    if (checks.rp.present) score += checks.rp.weight;
    if (checks.pp.present) score += checks.pp.weight;

    let grade = 'F';
    let gradeColor = 'text-rose-400 bg-rose-950/40 border-rose-500/40';

    if (checks.hsts.present && checks.xfo.present && checks.xcto.present && checks.csp.present) {
      grade = 'A+';
      gradeColor = 'text-emerald-300 bg-emerald-950/60 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.35)]';
    } else if (checks.hsts.present && (checks.xfo.present || checks.xcto.present)) {
      grade = 'A';
      gradeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40';
    } else if (checks.hsts.present) {
      grade = 'B';
      gradeColor = 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40';
    } else if (checks.xfo.present || checks.xcto.present) {
      grade = 'C';
      gradeColor = 'text-amber-400 bg-amber-950/40 border-amber-500/40';
    } else if (score > 10) {
      grade = 'D';
      gradeColor = 'text-orange-400 bg-orange-950/40 border-orange-500/40';
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.json({
      success: true,
      domain: cleanDomain,
      grade,
      score,
      gradeColor,
      checks,
      tools: securityHeaderTool,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    let friendlyError = `Hôte injoignable (${err.message})`;
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      friendlyError = `Nom de domaine non configuré : aucun enregistrement DNS trouvé pour "${cleanDomain}". Vérifiez la zone DNS de votre domaine.`;
    } else if (err.code === 'ECONNREFUSED') {
      friendlyError = `Connexion refusée : aucun service web actif sur le port 443/80 de "${cleanDomain}".`;
    } else if (err.message === 'TIMEOUT') {
      friendlyError = `Délai dépassé (timeout 7s) : le serveur "${cleanDomain}" ne répond pas.`;
    }

    return res.status(200).json({
      success: false,
      domain: cleanDomain,
      grade: '?',
      score: 0,
      gradeColor: 'text-gray-400 bg-slate-900 border-slate-700',
      error: friendlyError,
      tools: securityHeaderTool,
    });
  }
};

