import React from 'react';

const Hero = () => {
  return (
    <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="container mx-auto px-6 text-center py-20">
        <div className="mb-8">
          <div className="inline-block p-8 rounded-2xl bg-white/10 backdrop-blur-sm mb-8">
            <h1 className="text-8xl md:text-9xl font-black text-white tracking-tight">
              AZIM<span className="text-indigo-400">404</span>
            </h1>
          </div>
        </div>
        
        <p className="text-2xl md:text-3xl text-gray-300 mb-12 font-light">
          Innovation & Développement Digital
        </p>
        
        <div className="max-w-md mx-auto">
          <a 
            href="https://sofiane-kherarfa.azim404.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-indigo-500 hover:bg-indigo-600 text-white text-xl font-semibold px-12 py-5 rounded-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-indigo-500/50"
          >
            Découvrir le Portfolio →
          </a>
          <p className="text-gray-400 mt-4 text-sm">
            Portfolio de Sofiane Kherarfa - Développeur Full Stack
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
