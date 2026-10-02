import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  dbGetPortfolioProjects,
  dbSavePortfolioProjects,
  dbDeletePortfolioProject,
  dbGetContextTargets,
  dbSaveContextTargets,
} from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STATUS_FILE = path.join(DATA_DIR, 'site_status.json');

const DEFAULT_PROJECTS = [
  {
    id: 'fansite',
    title: 'Fansite Malaisie',
    description: 'Site vitrine complet dédié à la Malaisie, présentant culture, paysages, guides touristiques et formalités.',
    technologies: ['HTML5', 'TailwindCSS', 'JavaScript'],
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&h=400&fit=crop',
    link: 'https://fansite.azim404.com/',
    domain: 'fansite.azim404.com',
    badge: 'En ligne',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'novakult',
    title: 'Novakult',
    description: 'Médiathèque culturelle en ligne pour gérer, filtrer et explorer un catalogue de médias variés avec persistance SQL.',
    technologies: ['PHP MVC', 'MySQL', 'Docker'],
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&h=400&fit=crop',
    link: 'https://novakult.azim404.com/',
    domain: 'novakult.azim404.com',
    badge: 'Backend & SQL',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'kulturdb',
    title: 'KulturDB',
    description: 'Application interactive et médiathèque culturelle connectée avec catalogue, fiches détaillées et favoris.',
    technologies: ['React', 'Node.js', 'Docker'],
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop',
    link: 'https://kulturdb.azim404.com/',
    domain: 'kulturdb.azim404.com',
    badge: 'En ligne',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'marsai',
    title: 'MarsAI',
    description: 'Interface web moderne dédiée aux interactions et modèles d\'intelligence artificielle.',
    technologies: ['React', 'API REST', 'Node.js'],
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    link: 'https://marsai.azim404.com/',
    domain: 'marsai.azim404.com',
    badge: 'IA & Web',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'wikisguessr',
    title: 'WikisGuessr',
    description: 'Jeu multijoueur interactif de déduction géographique basé sur Wikipédia avec salons et classements en direct.',
    technologies: ['React', 'Socket.IO', 'Express'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&h=400&fit=crop',
    link: 'https://wikisguessr.azim404.com/',
    domain: 'wikisguessr.azim404.com',
    badge: 'Multi-joueur',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'cars-x-battle',
    title: 'Cars X Battle',
    description: 'Plateforme compétitive automobile avec classements, votes et gestion de duels entre véhicules légendaires.',
    technologies: ['React', 'Node.js', 'MySQL'],
    image: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&h=400&fit=crop',
    link: 'https://cxb.azim404.com/',
    domain: 'cxb.azim404.com',
    badge: 'Fullstack SQL',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'gashooter',
    title: 'GaShooter',
    description: 'Jeu d\'action 2D rétro arcade développé en Canvas/WebGL avec sound design rétro et système de high scores.',
    technologies: ['Canvas API', 'JavaScript ES6+', 'Audio API'],
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop',
    link: 'https://gashooter.azim404.com/',
    domain: 'gashooter.azim404.com',
    badge: 'Jeu Arcade',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'discord-dashboard',
    title: 'Discord Bot Dashboard',
    description: 'Panneau de configuration web pour serveurs Discord avec gestion des permissions et logs d\'activité.',
    technologies: ['React', 'Discord API', 'TailwindCSS'],
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
    link: 'https://discord.azim404.com/',
    domain: 'discord.azim404.com',
    badge: 'En ligne',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
];

async function loadProjects() {
  const projects = await dbGetPortfolioProjects();
  if (!projects || projects.length === 0) {
    await dbSavePortfolioProjects(DEFAULT_PROJECTS);
    return DEFAULT_PROJECTS;
  }
  return projects;
}

function registerInStatusFile(project) {
  try {
    if (!fs.existsSync(STATUS_FILE)) return;
    const raw = fs.readFileSync(STATUS_FILE, 'utf-8');
    const sites = JSON.parse(raw);
    const cleanDomain = (project.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!cleanDomain) return;

    if (!sites[project.id]) {
      sites[project.id] = {
        id: project.id,
        name: project.title,
        domain: cleanDomain,
        inMaintenance: Boolean(project.inMaintenance),
        scope: 'ALL',
        targetPages: '',
        title: 'Atelier en cours de rénovation',
        message: "Salut, c'est Sofiane ! Je peaufine actuellement de nouvelles fonctionnalités...",
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(STATUS_FILE, JSON.stringify(sites, null, 2), 'utf-8');
    }
  } catch (e) {
    // silencieux
  }
}

// GET /api/portfolio-projects
export const getProjects = async (req, res) => {
  const projects = await loadProjects();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, projects });
};

// POST /api/portfolio-projects/save
export const saveProject = async (req, res) => {
  const { id, title, description, technologies, badge, link, image, domain, visibleOnPortfolio, inMaintenance, allowContextSync, folderName } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Titre du projet obligatoire' });
  }

  const projects = await loadProjects();
  const cleanId = (id || title.toLowerCase().replace(/[^a-z0-9_-]/gi, '_') || Date.now().toString()).trim();

  const techArray = Array.isArray(technologies)
    ? technologies
    : typeof technologies === 'string'
    ? technologies.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const existingIndex = projects.findIndex((p) => p.id === cleanId || p.id === id);

  const cleanDomain = (
    domain ||
    (link ? new URL(link.startsWith('http') ? link : `https://${link}`).hostname : `${cleanId}.azim404.com`)
  )
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');

  const updatedProject = {
    id: cleanId,
    title: title.trim(),
    description: (description || '').trim(),
    technologies: techArray,
    badge: (badge || 'En ligne').trim(),
    link: (link || `https://${cleanDomain}/`).trim(),
    image: image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
    domain: cleanDomain,
    visibleOnPortfolio: visibleOnPortfolio !== undefined ? Boolean(visibleOnPortfolio) : true,
    inMaintenance: Boolean(inMaintenance),
    allowContextSync: allowContextSync !== false,
    folderName: (folderName || cleanId).trim(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = { ...projects[existingIndex], ...updatedProject };
  } else {
    projects.push(updatedProject);
  }

  await dbSavePortfolioProjects(projects);
  registerInStatusFile(updatedProject);

  // Enregistrement automatique dans la liste des cibles de synchronisation du contexte privé si autorisé
  if (allowContextSync !== false) {
    try {
      const folder = (folderName || cleanId).trim().replace(/[^a-zA-Z0-9._-]/g, '_');
      const currentTargets = await dbGetContextTargets();
      const existingIdx = currentTargets.findIndex(
        (t) => t.id === cleanId || t.folder.toLowerCase() === folder.toLowerCase()
      );
      if (existingIdx >= 0) {
        currentTargets[existingIdx].name = title.trim();
        currentTargets[existingIdx].folder = folder;
        if (typeof allowContextSync === 'boolean') {
          currentTargets[existingIdx].enabled = allowContextSync;
        }
      } else {
        currentTargets.push({
          id: cleanId,
          name: title.trim(),
          folder: folder,
          enabled: true,
        });
      }
      await dbSaveContextTargets(currentTargets);
    } catch (e) {
      console.warn('[Sync Targets Auto-Register Error]', e.message);
    }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, project: updatedProject, projects });
};

// POST /api/portfolio-projects/toggle-visibility
export const toggleVisibility = async (req, res) => {
  const { id, visible } = req.body || {};
  const projects = await loadProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Projet introuvable' });
  }

  project.visibleOnPortfolio = typeof visible === 'boolean' ? visible : !project.visibleOnPortfolio;
  await dbSavePortfolioProjects(projects);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, project, projects });
};

// DELETE /api/portfolio-projects/:id
export const deleteProject = async (req, res) => {
  const { id } = req.params;
  await dbDeletePortfolioProject(id);
  const filtered = await loadProjects();

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({ success: true, message: 'Projet retiré avec succès', projects: filtered });
};
