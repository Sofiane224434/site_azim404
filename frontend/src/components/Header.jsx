import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../contexts/AdminContext.jsx';

const languages = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2);

  const handleLanguageChange = (code) => {
    i18n.changeLanguage(code);
  };

  const navLinks = [
    { href: '#home', label: t('nav.home') },
    { href: '#contact', label: t('nav.contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-black/85 backdrop-blur-md border-b border-cyan-500/20 transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 h-20 flex justify-between items-center">
        {/* Brand Logo integrated directly as the letter "A" */}
        <a href="#home" className="group flex items-center">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors flex items-center select-none">
            <img
              src="/images/logo_transparent.png"
              alt="A"
              className="h-[1.15em] w-auto object-contain inline-block -mr-1 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform"
            />
            <span>zim</span>
            <span className="text-cyan-400 select-none">.</span>
            <span>404</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-gray-300 hover:text-cyan-300 text-sm font-semibold tracking-wide transition-colors duration-200 py-1 uppercase after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-cyan-400 after:rounded-full after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-300 after:shadow-[0_0_8px_#22d3ee]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Buttons & Language Switcher */}
        <div className="hidden md:flex items-center gap-3">
          {/* Bouton d'accès Administration visible, élégant et explicite */}
          <button
            onClick={() => navigate('/admin')}
            className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all flex items-center gap-2 ${
              isAdmin
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:bg-cyan-900'
                : 'bg-slate-900/90 border-slate-700 text-gray-200 hover:text-white hover:border-cyan-400 hover:bg-slate-800 shadow-sm'
            }`}
            title="Accéder au panneau d'administration"
          >
            <span className="text-sm">🔒</span>
            <span>{isAdmin ? 'Console Admin' : 'Administration'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isAdmin ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
          </button>

          <a
            href="https://sofiane-kherarfa.azim404.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] font-medium flex items-center gap-1.5"
          >
            <span>{t('nav.portfolio_site')}</span>
            <span className="text-xs">↗</span>
          </a>

          <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-slate-700/80 text-xs font-semibold">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  currentLanguage === lang.code
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
                type="button"
              >
                {lang.label}
              </button>
            ))}
          </div>

          <a
            href="https://github.com/Sofiane224434"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Sofiane224434"
            className="text-gray-400 hover:text-cyan-300 transition-colors p-1.5 rounded-lg hover:bg-cyan-950/50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5"
            title="Administration"
          >
            <span>🔒</span>
            <span>Admin</span>
          </button>

          <div className="flex bg-slate-900 p-0.5 rounded border border-slate-700 text-xs">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`px-2 py-0.5 rounded ${
                  currentLanguage === lang.code
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-gray-400'
                }`}
                type="button"
              >
                {lang.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-300 hover:text-cyan-400 focus:outline-none"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-cyan-500/20 px-6 py-6 space-y-4 backdrop-blur-xl">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block font-semibold text-lg text-gray-200 hover:text-cyan-300 py-1 transition-colors uppercase tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/admin');
              }}
              className="w-full text-center py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center gap-2 text-sm shadow-md"
            >
              <span>🔒</span>
              <span>{isAdmin ? 'Console Administration' : 'Connexion Administration'}</span>
            </button>
            <a
              href="https://sofiane-kherarfa.azim404.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              {t('nav.portfolio_site')} ↗
            </a>
            <a
              href="https://github.com/Sofiane224434"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-2 rounded-lg bg-slate-900 border border-slate-700 text-gray-300 hover:text-white transition"
            >
              GitHub Sofiane224434
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
