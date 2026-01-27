import React from 'react';

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">AZIM404</h1>
          
          <ul className="hidden md:flex space-x-8">
            <li>
              <a href="#home" className="text-gray-600 hover:text-gray-900 transition">
                Accueil
              </a>
            </li>
            <li>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition">
                À propos
              </a>
            </li>
            <li>
              <a href="#projects" className="text-gray-600 hover:text-gray-900 transition">
                Projets
              </a>
            </li>
            <li>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">
                Contact
              </a>
            </li>
          </ul>

          <button className="md:hidden text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
