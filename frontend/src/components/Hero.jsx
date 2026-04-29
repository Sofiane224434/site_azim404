import React from 'react';

const Hero = () => {
  return (
    <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 text-center py-12 sm:py-20">
        <div className="mb-8">
          <div className="inline-block max-w-full p-4 sm:p-6 md:p-8 rounded-2xl bg-white/10 backdrop-blur-sm mb-8">
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tight break-words">
              AZIM<span className="text-indigo-400">404</span>
            </h1>
          </div>
        </div>

        <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 mb-12 font-light">
          Innovations & Développement Digital
        </p>

        <div className="max-w-md mx-auto">
          <a
            href="https://sofiane-kherarfa.azim404.com"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-indigo-500 hover:bg-indigo-600 text-white text-base sm:text-lg md:text-xl font-semibold px-6 sm:px-10 md:px-12 py-4 md:py-5 rounded-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-indigo-500/50"
          >
            Voir le site principal →
          </a>
          <p className="text-gray-400 mt-4 text-sm">
            Site principal de Sofiane Kherarfa - Développeur Full Stack
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
