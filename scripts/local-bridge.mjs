import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPath = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';
const baseLocalDir = process.env.LOCAL_PROJECTS_DIR || (fs.existsSync(defaultPath) ? defaultPath : path.resolve(__dirname, '..', '..'));
const PORT = 5001;
const API_URL = process.env.AZIM_API_URL || 'https://azim404.com/api/context/bundle';

const server = http.createServer(async (req, res) => {
  // CORS et Private Network Access pour autoriser l'appel depuis https://azim404.com
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, service: 'azim-local-sync-bridge' }));
  }

  if (req.url === '/sync' && req.method === 'POST') {
    try {
      let bundle = null;
      try {
        const bundleRes = await fetch(API_URL);
        if (bundleRes.ok) {
          const bData = await bundleRes.json();
          if (bData.success && bData.bundle) bundle = bData.bundle;
        }
      } catch {}

      if (!bundle) {
        const fallback = path.join(__dirname, '../agent/project-context.md');
        if (fs.existsSync(fallback)) {
          bundle = { 'project-context.md': fs.readFileSync(fallback, 'utf8') };
        }
      }

      if (!bundle) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Impossible de récupérer les fichiers' }));
      }

      // Récupérer les cibles
      let targetFolders = [];
      try {
        const cRes = await fetch(API_URL.replace('/bundle', ''));
        if (cRes.ok) {
          const cd = await cRes.json();
          if (cd.targets) targetFolders = cd.targets.filter((t) => t.enabled).map((t) => t.folder || t.id);
        }
      } catch {}

      if (!targetFolders || targetFolders.length === 0) {
        targetFolders = [
          'cars-x-battle', 'gashooter', 'wikisguessr', 'KulturDB', 'portfolio',
          'fansite', 'mediatheque-tln', 'discord', 'nexus-v', 'azim-bot', 'mars-ai', 'azim404'
        ];
      }

      const synced = [];
      for (const targetName of targetFolders) {
        const projectPath = path.join(baseLocalDir, targetName);
        if (!fs.existsSync(projectPath)) continue;

        try {
          const gitignorePath = path.join(projectPath, '.gitignore');
          let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
          const rules = ['.env', 'agent/', 'shared-context/', 'project-context.md', '*contexte*prive*.md'];
          const missing = rules.filter((r) => !gitignore.includes(r));
          if (missing.length > 0) {
            fs.appendFileSync(gitignorePath, '\n# Private Context Rules\n' + missing.join('\n') + '\n', 'utf8');
          }

          const agentDir = path.join(projectPath, 'agent');
          fs.mkdirSync(agentDir, { recursive: true });

          for (const [filename, content] of Object.entries(bundle)) {
            fs.writeFileSync(path.join(agentDir, filename), content, 'utf8');
            if (filename === 'project-context.md') {
              fs.writeFileSync(path.join(projectPath, 'project-context.md'), content, 'utf8');
            }
          }

          synced.push(targetName);
        } catch {}
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, syncedCount: synced.length, synced }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: err.message }));
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route inconnue' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Bridge Local] Serveur actif sur http://127.0.0.1:${PORT}`);
});
