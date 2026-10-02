import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseLocalDir = 'c:\\Users\\Sofia\\OneDrive\\Desktop\\git commit';

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
    const fallbackPath = path.join(__dirname, '../agent/project-context.md');
    if (fs.existsSync(fallbackPath)) {
      console.log('[Sync Local] Utilisation du fichier de contexte local azim404/agent/project-context.md');
      bundle = { 'project-context.md': fs.readFileSync(fallbackPath, 'utf8') };
    }
  }

  if (!bundle || Object.keys(bundle).length === 0) {
    console.error('[Sync Local] Impossible de récupérer les fichiers du contexte.');
    process.exit(1);
  }

  const fileNames = Object.keys(bundle);
  console.log(`[Sync Local] ${fileNames.length} fichier(s) prêt(s) à être synchronisé(s) :`, fileNames);

  const targets = [
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

  let syncedCount = 0;

  for (const targetName of targets) {
    const projectPath = path.join(baseLocalDir, targetName);
    if (!fs.existsSync(projectPath)) continue;

    try {
      // 1. Protection .gitignore
      const gitignorePath = path.join(projectPath, '.gitignore');
      let gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
      const rules = ['.env', 'agent/', 'shared-context/', 'project-context.md', '*contexte*prive*.md'];
      const missing = rules.filter((r) => !gitignore.includes(r));
      if (missing.length > 0) {
        fs.appendFileSync(gitignorePath, '\n# Private Context Rules\n' + missing.join('\n') + '\n', 'utf8');
      }

      // 2. Écriture dans agent/
      const agentDir = path.join(projectPath, 'agent');
      fs.mkdirSync(agentDir, { recursive: true });

      for (const [filename, content] of Object.entries(bundle)) {
        fs.writeFileSync(path.join(agentDir, filename), content, 'utf8');
        if (filename === 'project-context.md') {
          fs.writeFileSync(path.join(projectPath, 'project-context.md'), content, 'utf8');
        }
      }

      syncedCount++;
      console.log(`  ✓ Synchronisé et sécurisé : ${targetName}`);
    } catch (e) {
      console.error(`  ✗ Erreur sur ${targetName}:`, e.message);
    }
  }

  console.log(`\n[Sync Local Terminé] ${syncedCount} projets locaux synchronisés avec succès.`);
}

syncLocal();
