// backend/src/config/db.js
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'azim404',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
};

let pool = null;
let isDbReady = false;

// Fallback JSON paths
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const PROJECTS_JSON = path.join(DATA_DIR, 'portfolio_projects.json');
const MAINTENANCE_JSON = path.join(DATA_DIR, 'maintenance_overrides.json');
const TARGETS_JSON = path.join(DATA_DIR, 'context_sync_targets.json');
const ACCOUNTS_JSON = path.join(DATA_DIR, 'private_accounts.json');

export async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    console.log('[DB] Connecté à MySQL avec succès');

    // Vérification / Création des tables via schema
    const schemaPath = path.join(__dirname, '../../schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      const statements = sqlContent
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use') && !s.toLowerCase().startsWith('create database'));

      for (const statement of statements) {
        try {
          await conn.query(statement);
        } catch (stmtErr) {
          // Table or index may already exist
        }
      }
    }

    conn.release();
    isDbReady = true;

    // Migration initiale automatique depuis les fichiers JSON si les tables sont vides
    await seedFromExistingJson();
    return true;
  } catch (err) {
    console.warn(`[DB] MySQL non disponible (${err.message}). Utilisation du mode SQL/JSON de secours.`);
    isDbReady = false;
    return false;
  }
}

async function seedFromExistingJson() {
  if (!isDbReady) return;

  try {
    // 1. Projets portfolio
    const [existingProjects] = await pool.query('SELECT COUNT(*) as count FROM portfolio_projects');
    if (existingProjects[0]?.count === 0 && fs.existsSync(PROJECTS_JSON)) {
      const projects = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
      for (const p of projects) {
        await pool.query(
          `INSERT INTO portfolio_projects (id, title, description, technologies, image, link, domain, badge, is_displayed)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE title = VALUES(title), domain = VALUES(domain)`,
          [
            p.id,
            p.title,
            p.description || '',
            JSON.stringify(p.technologies || []),
            p.image || '',
            p.link || '',
            p.domain || '',
            p.badge || 'En ligne',
            p.is_displayed !== false ? 1 : 0,
          ]
        );
      }
      console.log(`[DB Migration] ${projects.length} projets importés dans MySQL.`);
    }

    // 2. Dérogations de maintenance
    const [existingMaint] = await pool.query('SELECT COUNT(*) as count FROM maintenance_overrides');
    if (existingMaint[0]?.count === 0 && fs.existsSync(MAINTENANCE_JSON)) {
      const maint = JSON.parse(fs.readFileSync(MAINTENANCE_JSON, 'utf8'));
      for (const [dom, cfg] of Object.entries(maint)) {
        await pool.query(
          `INSERT INTO maintenance_overrides (domain, is_maintenance, page_target, bypass_ips, custom_message)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE is_maintenance = VALUES(is_maintenance)`,
          [
            dom,
            cfg.is_maintenance ? 1 : 0,
            cfg.page_target || '*',
            (cfg.bypass_ips || []).join(','),
            cfg.custom_message || '',
          ]
        );
      }
    }

    // 3. Cibles de synchronisation
    const [existingTargets] = await pool.query('SELECT COUNT(*) as count FROM context_sync_targets');
    if (existingTargets[0]?.count === 0 && fs.existsSync(TARGETS_JSON)) {
      const targets = JSON.parse(fs.readFileSync(TARGETS_JSON, 'utf8'));
      for (const t of targets) {
        await pool.query(
          `INSERT INTO context_sync_targets (id, name, folder, enabled)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), folder = VALUES(folder)`,
          [t.id, t.name, t.folder, t.enabled ? 1 : 0]
        );
      }
    }

    // 4. Comptes privés
    const [existingAccounts] = await pool.query('SELECT COUNT(*) as count FROM private_accounts');
    if (existingAccounts[0]?.count === 0 && fs.existsSync(ACCOUNTS_JSON)) {
      const accounts = JSON.parse(fs.readFileSync(ACCOUNTS_JSON, 'utf8'));
      for (const acc of accounts) {
        await pool.query(
          `INSERT INTO private_accounts (identifier, password_hash, role, display_name)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE role = VALUES(role)`,
          [acc.identifier, acc.password || acc.password_hash || '', acc.role || 'admin', acc.displayName || acc.display_name || '']
        );
      }
    }
  } catch (err) {
    console.error('[DB Migration Error]', err.message);
  }
}

export async function query(sql, params = []) {
  if (!isDbReady) {
    throw new Error('DATABASE_NOT_READY');
  }
  const [results] = await pool.execute(sql, params);
  return results;
}

export function isReady() {
  return isDbReady;
}

// -------------------------------------------------------------
// Méthodes de haut niveau avec SQL en priorité et fallback automatique
// -------------------------------------------------------------

// Projets
export async function dbGetPortfolioProjects() {
  if (isDbReady) {
    try {
      const rows = await query('SELECT * FROM portfolio_projects ORDER BY sort_order ASC, created_at ASC');
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        technologies: typeof r.technologies === 'string' ? JSON.parse(r.technologies || '[]') : r.technologies || [],
        image: r.image,
        link: r.link,
        domain: r.domain,
        badge: r.badge,
        is_displayed: Boolean(r.is_displayed),
      }));
    } catch (e) {
      console.warn('[DB] Erreur lecture portfolio_projects SQL:', e.message);
    }
  }

  // Fallback JSON
  if (fs.existsSync(PROJECTS_JSON)) {
    return JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8'));
  }
  return [];
}

export async function dbSavePortfolioProjects(projects) {
  // Sync to JSON backup file
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROJECTS_JSON, JSON.stringify(projects, null, 2), 'utf8');

  if (isDbReady) {
    try {
      for (let i = 0; i < projects.length; i++) {
        const p = projects[i];
        await query(
          `INSERT INTO portfolio_projects (id, title, description, technologies, image, link, domain, badge, is_displayed, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             title = VALUES(title),
             description = VALUES(description),
             technologies = VALUES(technologies),
             image = VALUES(image),
             link = VALUES(link),
             domain = VALUES(domain),
             badge = VALUES(badge),
             is_displayed = VALUES(is_displayed),
             sort_order = VALUES(sort_order)`,
          [
            p.id,
            p.title,
            p.description || '',
            JSON.stringify(p.technologies || []),
            p.image || '',
            p.link || '',
            p.domain || '',
            p.badge || 'En ligne',
            p.is_displayed !== false ? 1 : 0,
            i,
          ]
        );
      }
    } catch (e) {
      console.error('[DB] Erreur écriture portfolio_projects SQL:', e.message);
    }
  }
}

export async function dbDeletePortfolioProject(id) {
  if (isDbReady) {
    try {
      await query('DELETE FROM portfolio_projects WHERE id = ?', [id]);
    } catch (e) {
      console.error('[DB] Erreur suppression portfolio_projects SQL:', e.message);
    }
  }

  if (fs.existsSync(PROJECTS_JSON)) {
    const list = JSON.parse(fs.readFileSync(PROJECTS_JSON, 'utf8')).filter((p) => p.id !== id);
    fs.writeFileSync(PROJECTS_JSON, JSON.stringify(list, null, 2), 'utf8');
  }
}

// Cibles de synchronisation
export async function dbGetContextTargets(defaultTargets = []) {
  if (isDbReady) {
    try {
      const rows = await query('SELECT * FROM context_sync_targets ORDER BY name ASC');
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          folder: r.folder,
          enabled: Boolean(r.enabled),
          last_synced_at: r.last_synced_at,
        }));
      }
    } catch (e) {
      console.warn('[DB] Erreur lecture context_sync_targets SQL:', e.message);
    }
  }

  if (fs.existsSync(TARGETS_JSON)) {
    return JSON.parse(fs.readFileSync(TARGETS_JSON, 'utf8'));
  }
  return defaultTargets;
}

export async function dbSaveContextTargets(targets) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TARGETS_JSON, JSON.stringify(targets, null, 2), 'utf8');

  if (isDbReady) {
    try {
      for (const t of targets) {
        await query(
          `INSERT INTO context_sync_targets (id, name, folder, enabled)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), folder = VALUES(folder), enabled = VALUES(enabled)`,
          [t.id, t.name, t.folder, t.enabled ? 1 : 0]
        );
      }
    } catch (e) {
      console.error('[DB] Erreur écriture context_sync_targets SQL:', e.message);
    }
  }
}

// Fichiers du contexte
export async function dbGetContextFile(filename = 'project-context.md') {
  if (isDbReady) {
    try {
      const rows = await query('SELECT * FROM context_files WHERE filename = ?', [filename]);
      if (rows.length > 0) {
        return {
          filename: rows[0].filename,
          content: rows[0].content,
          sizeBytes: rows[0].size_bytes,
          lastModified: rows[0].last_modified,
        };
      }
    } catch (e) {
      console.warn('[DB] Erreur lecture context_files SQL:', e.message);
    }
  }
  return null;
}

export async function dbSaveContextFile(filename, content) {
  if (isDbReady) {
    try {
      const id = filename.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      await query(
        `INSERT INTO context_files (id, filename, content, size_bytes)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE content = VALUES(content), size_bytes = VALUES(size_bytes), last_modified = CURRENT_TIMESTAMP`,
        [id, filename, content, Buffer.byteLength(content, 'utf8')]
      );
    } catch (e) {
      console.error('[DB] Erreur écriture context_files SQL:', e.message);
    }
  }
}

export default {
  initDatabase,
  query,
  isReady,
  dbGetPortfolioProjects,
  dbSavePortfolioProjects,
  dbDeletePortfolioProject,
  dbGetContextTargets,
  dbSaveContextTargets,
  dbGetContextFile,
  dbSaveContextFile,
};
