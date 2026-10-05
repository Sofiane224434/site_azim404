import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPath = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';
const baseLocalDir = process.env.LOCAL_PROJECTS_DIR || (fs.existsSync(defaultPath) ? defaultPath : path.resolve(__dirname, '..', '..'));

const API_URL = process.env.AZIM_API_URL || 'https://azim404.com/api/context/bundle';

async function syncLocal() {
  console.log(`[Sync Local] Récupération du dossier contexte depuis ${API_URL}...`);

  let bundle = null;
  try {
    const res = await fetch(API_URL);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.bundle) {
        bundle = data.bundle;
      }
    }
  } catch (err) {
    console.warn(`[Sync Local] Appel distant non joignable (${err.message}). Utilisation du stockage local.`);
  }

  if (!bundle || Object.keys(bundle).length === 0) {
    const fallbackSync = path.join(__dirname, '../sync/project-context.md');
    const fallbackRoot = path.join(__dirname, '../project-context.md');
    if (fs.existsSync(fallbackSync)) {
      console.log('[Sync Local] Utilisation du fichier de contexte local azim404/sync/');
      bundle = { 'project-context.md': fs.readFileSync(fallbackSync, 'utf8') };
    } else if (fs.existsSync(fallbackRoot)) {
      console.log('[Sync Local] Utilisation du fichier de contexte racine project-context.md');
      bundle = { 'project-context.md': fs.readFileSync(fallbackRoot, 'utf8') };
    }
  }

  if (!bundle || Object.keys(bundle).length === 0) {
    console.error('[Sync Local] Impossible de récupérer les fichiers du contexte.');
    process.exit(1);
  }

  // Récupération dynamique des cibles autorisées depuis le site/API
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

  console.log(`[Sync Local] Cibles autorisées détectées (${targetFolders.length}) :`, targetFolders);

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
        'sync/',
        'ai-context/',
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

      // 2. Écriture dans le dossier sync/
      const syncDir = path.join(projectPath, 'sync');
      fs.mkdirSync(syncDir, { recursive: true });

      for (const [filename, content] of Object.entries(bundle)) {
        if (filename === 'GEMINI.md' || filename === 'AGENTS.md') continue;
        fs.writeFileSync(path.join(syncDir, filename), content, 'utf8');
      }

      // 3. Écriture de project-context.md à la racine du projet
      if (bundle['project-context.md']) {
        fs.writeFileSync(path.join(projectPath, 'project-context.md'), bundle['project-context.md'], 'utf8');
      }

      // 4. Nettoyage de fichiers/dossiers obsolètes
      const legacyAiContext = path.join(projectPath, 'ai-context');
      if (fs.existsSync(legacyAiContext)) fs.rmSync(legacyAiContext, { recursive: true, force: true });
      const legacyAgents = path.join(projectPath, '.agents');
      if (fs.existsSync(legacyAgents)) fs.rmSync(legacyAgents, { recursive: true, force: true });
      const rootAgent = path.join(projectPath, 'AGENTS.md');
      if (fs.existsSync(rootAgent)) fs.unlinkSync(rootAgent);
      const rootGemini = path.join(projectPath, 'GEMINI.md');
      if (fs.existsSync(rootGemini)) fs.unlinkSync(rootGemini);

      syncedCount++;
      console.log(`  ✓ Synchronisé et sécurisé (sync/ + project-context.md) : ${targetName}`);
    } catch (e) {
      console.error(`  ✗ Erreur sur ${targetName}:`, e.message);
    }
  }

  console.log(`\n[Sync Local Terminé] ${syncedCount} projets locaux synchronisés avec succès.`);
}

syncLocal();
