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
    const fallbackPath = path.join(__dirname, '../ai-context/project-context.md');
    if (fs.existsSync(fallbackPath)) {
      console.log('[Sync Local] Utilisation du fichier de contexte local azim404/ai-context/');
      bundle = { 'project-context.md': fs.readFileSync(fallbackPath, 'utf8') };
      const agentsPath = path.join(__dirname, '../ai-context/AGENTS.md');
      if (fs.existsSync(agentsPath)) {
        bundle['AGENTS.md'] = fs.readFileSync(agentsPath, 'utf8');
      }
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

  const rootAgentPointer = `# AI DIRECTIVES & INSTRUCTIONS\n\nToutes les directives prioritaires et règles de travail sont définies dans [ai-context/AGENTS.md](ai-context/AGENTS.md).\nL'IA DOIT obligatoirement charger et appliquer les directives de ce fichier dès le début de chaque tâche.\n`;

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
      const rules = ['.env', 'ai-context/project-context.md', 'shared-context/', '*contexte*prive*.md'];
      const missing = rules.filter((r) => !gitignore.includes(r));
      if (missing.length > 0) {
        fs.appendFileSync(gitignorePath, '\n# Private Context Rules\n' + missing.join('\n') + '\n', 'utf8');
      }

      // 2. Écriture dans le dossier racine ai-context/
      const contextDir = path.join(projectPath, 'ai-context');
      fs.mkdirSync(contextDir, { recursive: true });

      for (const [filename, content] of Object.entries(bundle)) {
        if (filename === 'GEMINI.md') continue;
        fs.writeFileSync(path.join(contextDir, filename), content, 'utf8');
      }

      // 3. Écriture du pointeur racine AGENTS.md
      fs.writeFileSync(path.join(projectPath, 'AGENTS.md'), rootAgentPointer, 'utf8');

      syncedCount++;
      console.log(`  ✓ Synchronisé et sécurisé (ai-context) : ${targetName}`);
    } catch (e) {
      console.error(`  ✗ Erreur sur ${targetName}:`, e.message);
    }
  }

  console.log(`\n[Sync Local Terminé] ${syncedCount} projets locaux synchronisés avec succès.`);
}

syncLocal();
