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

  let bundle = {};

  // 1. Charger depuis le dossier local ai-context/
  const localAiDir = path.join(__dirname, '../ai-context');
  if (fs.existsSync(localAiDir)) {
    const files = fs.readdirSync(localAiDir);
    for (const f of files) {
      if (f === 'GEMINI.md') continue;
      bundle[f] = fs.readFileSync(path.join(localAiDir, f), 'utf8');
    }
  }

  // Fallback si bundle vide
  if (Object.keys(bundle).length === 0) {
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

  if (Object.keys(bundle).length === 0) {
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

      // 2. Ecriture des fichiers dans ai-context/
      const aiContextDir = path.join(projectPath, 'ai-context');
      fs.mkdirSync(aiContextDir, { recursive: true });

      for (const [filename, content] of Object.entries(bundle)) {
        if (filename === 'GEMINI.md') continue;
        fs.writeFileSync(path.join(aiContextDir, filename), content, 'utf8');
      }

      // 3. Nettoyer les fichiers orphelins a la racine du projet
      const rootContext = path.join(projectPath, 'project-context.md');
      if (fs.existsSync(rootContext)) fs.unlinkSync(rootContext);
      const rootAgent = path.join(projectPath, 'AGENTS.md');
      if (fs.existsSync(rootAgent)) fs.unlinkSync(rootAgent);
      const rootGemini = path.join(projectPath, 'GEMINI.md');
      if (fs.existsSync(rootGemini)) fs.unlinkSync(rootGemini);

      // 4. Nettoyer les anciens dossiers obsoletes
      const legacySync = path.join(projectPath, 'sync');
      if (fs.existsSync(legacySync)) fs.rmSync(legacySync, { recursive: true, force: true });
      const legacyAgents = path.join(projectPath, '.agents');
      if (fs.existsSync(legacyAgents)) fs.rmSync(legacyAgents, { recursive: true, force: true });

      syncedCount++;
      console.log(`  OK [ai-context/(project-context.md + AGENTS.md)] : ${targetName}`);
    } catch (e) {
      console.error(`  ERR sur ${targetName}:`, e.message);
    }
  }

  console.log(`\n[Sync Local Termine] ${syncedCount} projets locaux synchronises avec succes.`);
}

syncLocal();
