import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPath = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';
const baseLocalDir = process.env.LOCAL_PROJECTS_DIR || (fs.existsSync(defaultPath) ? defaultPath : path.resolve(__dirname, '..', '..'));

const API_URL = process.env.AZIM_API_URL || 'https://azim404.com/api/context/bundle';

async function syncLocal() {
  console.log(`[Sync Local] Recuperation du dossier contexte...`);

  let bundle = null;

  // 1. Essayer d'abord la source locale azim404 pour propager instantanément les modifications
  const localAiContext = path.join(__dirname, '../ai-context/project-context.md');
  const localSync = path.join(__dirname, '../sync/project-context.md');
  const localRoot = path.join(__dirname, '../project-context.md');

  if (fs.existsSync(localAiContext)) {
    bundle = { 'project-context.md': fs.readFileSync(localAiContext, 'utf8') };
  } else if (fs.existsSync(localRoot)) {
    bundle = { 'project-context.md': fs.readFileSync(localRoot, 'utf8') };
  } else if (fs.existsSync(localSync)) {
    bundle = { 'project-context.md': fs.readFileSync(localSync, 'utf8') };
  }

  // 2. Si non trouve en local, interroger l'API distante
  if (!bundle || Object.keys(bundle).length === 0) {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.bundle) {
          bundle = data.bundle;
        }
      }
    } catch (err) {
      console.warn(`[Sync Local] Appel distant non joignable (${err.message}).`);
    }
  }

  if (!bundle || Object.keys(bundle).length === 0) {
    console.error('[Sync Local] Impossible de recuperer les fichiers du contexte.');
    process.exit(1);
  }

  // Recuperation dynamique des cibles autorisees
  let targetFolders = [];
  try {
    const contextRes = await fetch(API_URL.replace('/bundle', ''));
    if (contextRes.ok) {
      const cData = await contextRes.json();
      if (cData.targets && Array.isArray(cData.targets)) {
        targetFolders = cData.targets.filter((t) => t.enabled).map((t) => t.folder || t.id);
      }
    }
  } catch {}

  if (!targetFolders || targetFolders.length === 0) {
    targetFolders = [
      'cars-x-battle',
      'gashooter',
      'wikisguessr',
      'KulturDB',
      'portfolio',
      'fansite',
      'mediatheque-tln',
      'discord',
      'nexus-v',
      'azim-bot',
      'mars-ai',
      'azim404',
    ];
  }

  console.log(`[Sync Local] Cibles autorisees detectees (${targetFolders.length}) :`, targetFolders);

  let syncedCount = 0;
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
      // 1. Protection .gitignore
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

      // 2. Migration et ecriture dans ai-context/
      const aiContextDir = path.join(projectPath, 'ai-context');
      fs.mkdirSync(aiContextDir, { recursive: true });

      // Si l'ancien dossier sync/ contenait des fichiers personnalises, les recuperer
      const legacySync = path.join(projectPath, 'sync');
      if (fs.existsSync(legacySync)) {
        try {
          const syncFiles = fs.readdirSync(legacySync);
          for (const sFile of syncFiles) {
            if (sFile !== 'AGENTS.md' && sFile !== 'GEMINI.md') {
              const src = path.join(legacySync, sFile);
              const dest = path.join(aiContextDir, sFile);
              if (!fs.existsSync(dest)) {
                fs.copyFileSync(src, dest);
              }
            }
          }
          fs.rmSync(legacySync, { recursive: true, force: true });
        } catch {}
      }

      // Ecrire le bundle a jour dans ai-context/
      for (const [filename, content] of Object.entries(bundle)) {
        if (filename === 'GEMINI.md' || filename === 'AGENTS.md') continue;
        fs.writeFileSync(path.join(aiContextDir, filename), content, 'utf8');
      }

      // 3. Ecriture de project-context.md a la racine du projet
      if (bundle['project-context.md']) {
        fs.writeFileSync(path.join(projectPath, 'project-context.md'), bundle['project-context.md'], 'utf8');
      }

      // 4. Nettoyage des residus obsoletes
      const legacyAgents = path.join(projectPath, '.agents');
      if (fs.existsSync(legacyAgents)) fs.rmSync(legacyAgents, { recursive: true, force: true });
      const rootAgent = path.join(projectPath, 'AGENTS.md');
      if (fs.existsSync(rootAgent)) fs.unlinkSync(rootAgent);
      const rootGemini = path.join(projectPath, 'GEMINI.md');
      if (fs.existsSync(rootGemini)) fs.unlinkSync(rootGemini);

      syncedCount++;
      console.log(`  OK [ai-context/ + project-context.md] : ${targetName}`);
    } catch (e) {
      console.error(`  ERR sur ${targetName}:`, e.message);
    }
  }

  console.log(`\n[Sync Local Termine] ${syncedCount} projets locaux synchronises avec succes.`);
}

syncLocal();
