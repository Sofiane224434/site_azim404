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
      let bundle = {};

      // Priorite au dossier local ai-context/
      const localAiDir = path.join(__dirname, '../ai-context');
      if (fs.existsSync(localAiDir)) {
        const files = fs.readdirSync(localAiDir);
        for (const f of files) {
          if (f === 'GEMINI.md') continue;
          bundle[f] = fs.readFileSync(path.join(localAiDir, f), 'utf8');
        }
      }

      if (Object.keys(bundle).length === 0) {
        try {
          const bundleRes = await fetch(API_URL);
          if (bundleRes.ok) {
            const bData = await bundleRes.json();
            if (bData.success && bData.bundle) bundle = bData.bundle;
          }
        } catch {}
      }

      if (Object.keys(bundle).length === 0) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Impossible de recuperer les fichiers' }));
      }

      // Recuperer les cibles
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
      const availableEntries = fs.existsSync(baseLocalDir) ? fs.readdirSync(baseLocalDir) : [];

      for (const targetName of targetFolders) {
        let projectPath = path.join(baseLocalDir, targetName);
        if (!fs.existsSync(projectPath)) {
          const match = availableEntries.find((e) => e.toLowerCase() === targetName.toLowerCase());
          if (match) {
            projectPath = path.join(baseLocalDir, match);
          } else {
            continue;
          }
        }

        try {
          const gitignorePath = path.join(projectPath, '.gitignore');
          let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
          const rules = [
            '.env',
            '.env.local',
            '.env.*.local',
            'ai-context/',
            'sync/',
            '.agents/',
            'project-context.md',
            'shared-context/',
            '*contexte*prive*.md',
            '/AGENTS.md',
            '/GEMINI.md',
          ];
          const missing = rules.filter((r) => !gitignore.includes(r));
          if (missing.length > 0) {
            fs.appendFileSync(gitignorePath, '\n# Private Context Rules\n' + missing.join('\n') + '\n', 'utf8');
          }

          const aiContextDir = path.join(projectPath, 'ai-context');
          fs.mkdirSync(aiContextDir, { recursive: true });

          for (const [filename, content] of Object.entries(bundle)) {
            if (filename === 'GEMINI.md') continue;
            fs.writeFileSync(path.join(aiContextDir, filename), content, 'utf8');
          }

          // Nettoyer les fichiers orphelins a la racine du projet
          const rootContext = path.join(projectPath, 'project-context.md');
          if (fs.existsSync(rootContext)) fs.unlinkSync(rootContext);
          const rootAgent = path.join(projectPath, 'AGENTS.md');
          if (fs.existsSync(rootAgent)) fs.unlinkSync(rootAgent);
          const rootGemini = path.join(projectPath, 'GEMINI.md');
          if (fs.existsSync(rootGemini)) fs.unlinkSync(rootGemini);

          // Nettoyer les anciens dossiers obsoletes
          const legacySync = path.join(projectPath, 'sync');
          if (fs.existsSync(legacySync)) fs.rmSync(legacySync, { recursive: true, force: true });
          const legacyAgents = path.join(projectPath, '.agents');
          if (fs.existsSync(legacyAgents)) fs.rmSync(legacyAgents, { recursive: true, force: true });

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
