const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../portfolio/frontend/src/components/Projects.jsx');

const code = `import React, { useState, useEffect } from 'react';

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
    id: 'moviedb',
    title: 'MovieDB',
    description: "Application interactive de cinéma connectée à l'API TMDB avec recherche temps réel, fiches détaillées et favoris.",
    technologies: ['React', 'API TMDB', 'Tailwind CSS'],
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=400&fit=crop',
    link: 'https://moviedb.azim404.com/',
    domain: 'moviedb.azim404.com',
    badge: 'API & Streaming',
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
  {
    id: 'marsai',
    title: 'MarsAI',
    description: "Interface web moderne dédiée aux interactions et modèles d'intelligence artificielle.",
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
    description: "Jeu interactif inspiré de GeoGuessr : devinez le sujet encyclopédique à partir d'indices progressifs générés.",
    technologies: ['React', 'Node.js', 'MySQL', 'Docker'],
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    link: 'https://wikisguessr.azim404.com/',
    domain: 'wikisguessr.azim404.com',
    badge: 'Jeu Interactif',
    visibleOnPortfolio: true,
    inMaintenance: false,
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
    visibleOnPortfolio: true,
    inMaintenance: false,
  },
];

const Projects = () => {
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);

  useEffect(() => {
    // Requete fraiche sans cache
    fetch(\`https://azim404.com/api/portfolio-projects?_t=\${Date.now()}\`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
        }
      })
      .catch(() => {
        // Fallback
      });
  }, []);

  // Filtre les projets visibles sur le portfolio public
  const visibleProjects = projects.filter((p) => p.visibleOnPortfolio !== false);

  return (
    <section id="projects" className="py-20 sm:py-24 relative bg-[#030712]">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Mes Réalisations
          </h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Projets web, applications interactives et services déployés en production
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {visibleProjects.map((project) => {
            const isUnderMaintenance = Boolean(project.inMaintenance) || (project.badge && project.badge.toLowerCase().includes('travaux'));

            return (
              <div
                key={project.id || project.title}
                className="glass-panel rounded-2xl overflow-hidden flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.08)] hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] group relative"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-slate-900">
                    <img
                      src={project.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop'}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Badge en haut à droite */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      {isUnderMaintenance ? (
                        <div className="px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/60 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-lg flex items-center gap-1.5 animate-pulse">
                          <span>🚧</span>
                          <span>En travaux</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-full bg-black/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-md">
                          {project.badge || 'En ligne'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors mb-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(project.technologies || []).map((tech) => (
                        <span
                          key={tech}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-900 text-cyan-300/90 border border-slate-700/80 font-mono"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  {isUnderMaintenance ? (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono text-xs text-center flex items-center justify-center gap-2">
                      <span>🚧 Accès temporairement suspendu pour travaux</span>
                    </div>
                  ) : (
                    <a
                      href={project.link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 hover:border-cyan-400 font-semibold text-xs text-center transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Visiter l'application</span>
                      <span>↗</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
`;

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated portfolio Projects.jsx with visibleOnPortfolio filtering and inMaintenance card badges');
