import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const PROJECTS_FILE = path.join(DATA_DIR, 'portfolio_projects.json');

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
  },
  {
    id: 'moviedb',
    title: 'MovieDB',
    description: 'Application interactive de cinéma connectée à l\'API TMDB avec recherche temps réel, fiches détaillées et favoris.',
    technologies: ['React', 'API TMDB', 'Tailwind CSS'],
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop',
    link: 'https://moviedb.azim404.com/',
    domain: 'moviedb.azim404.com',
    badge: 'API & Streaming',
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
  },
  {
    id: 'wikisguessr',
    title: 'WikisGuessr',
    description: 'Jeu interactif inspiré de GeoGuessr : devinez le sujet encyclopédique à partir d\'indices progressifs générés.',
    technologies: ['React', 'Node.js', 'MySQL', 'Docker'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    link: 'https://wikisguessr.azim404.com/',
    domain: 'wikisguessr.azim404.com',
    badge: 'Jeu Interactif',
  },
  {
    id: 'cxb',
    title: 'Cars X Battle',
    description: 'Jeu multijoueur de combat automobile en arène avec gestion de comptes et statistiques en direct.',
    technologies: ['Node.js', 'Express', 'MySQL', 'Docker'],
    image: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=600&h=400&fit=crop',
    link: 'https://cxb.azim404.com/',
    domain: 'cxb.azim404.com',
    badge: 'Multijoueur',
  },
];

function readProjectsFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PROJECTS_FILE)) {
      fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2), 'utf-8');
      return DEFAULT_PROJECTS;
    }
    const raw = fs.readFileSync(PROJECTS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROJECTS;
  } catch (error) {
    console.error('Erreur lecture portfolio_projects.json:', error);
    return DEFAULT_PROJECTS;
  }
}

function writeProjectsFile(data) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erreur ecriture portfolio_projects.json:', error);
    return false;
  }
}

// GET /api/portfolio-projects
export const getProjects = (req, res) => {
  const projects = readProjectsFile();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, projects });
};

// POST /api/portfolio-projects/save
export const saveProject = (req, res) => {
  const { id, title, description, technologies, badge, link, image, domain } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Titre du projet obligatoire' });
  }

  const projects = readProjectsFile();
  const cleanId = (id || title.toLowerCase().replace(/[^a-z0-9_-]/gi, '_') || Date.now().toString()).trim();

  const techArray = Array.isArray(technologies)
    ? technologies
    : typeof technologies === 'string'
    ? technologies.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const existingIndex = projects.findIndex((p) => p.id === cleanId || p.id === id);

  const updatedProject = {
    id: cleanId,
    title: title.trim(),
    description: (description || '').trim(),
    technologies: techArray,
    badge: (badge || 'En ligne').trim(),
    link: (link || `https://${cleanId}.azim404.com/`).trim(),
    image: image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
    domain: (domain || (link ? new URL(link.startsWith('http') ? link : `https://${link}`).hostname : `${cleanId}.azim404.com`)).trim(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = { ...projects[existingIndex], ...updatedProject };
  } else {
    projects.push(updatedProject);
  }

  writeProjectsFile(projects);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, project: updatedProject, projects });
};

// DELETE /api/portfolio-projects/:id
export const deleteProject = (req, res) => {
  const { id } = req.params;
  const projects = readProjectsFile();
  const filtered = projects.filter((p) => p.id !== id);

  writeProjectsFile(filtered);

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json({ success: true, message: 'Projet retiré avec succès', projects: filtered });
};
