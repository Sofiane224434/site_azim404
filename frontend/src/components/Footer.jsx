import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const PRO_EMAIL = 'sb.kherarfa@gmail.com';

  return (
    <footer className="w-full bg-black text-white mt-auto">
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee]" />

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="text-center md:text-left">
            <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight inline-flex items-center">
              <span>{t('footer.welcome')}&nbsp;</span>
              <span className="inline-flex items-center select-none">
                <img
                  src="/images/logo_transparent.png"
                  alt="A"
                  className="h-[1.12em] w-auto object-contain inline-block -mr-1"
                />
                <span>zim</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  .404
                </span>
              </span>
            </p>
            <p className="text-gray-400 text-xs sm:text-sm mt-1 max-w-md">
              Point d'accès digital et portail d'administration de Sofiane Kherarfa.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Sofiane224434"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Sofiane224434"
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-gray-300 hover:text-cyan-300"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>

            <a
              href={`mailto:${PRO_EMAIL}`}
              className="px-5 py-2.5 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500 hover:text-slate-950 font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] text-sm"
            >
              ✉️ {PRO_EMAIL}
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold tracking-wide text-gray-300 uppercase">
            <a href="#home" className="hover:text-cyan-300 transition-colors">
              {t('nav.home')}
            </a>
            <a href="#contact" className="hover:text-cyan-300 transition-colors">
              {t('nav.contact')}
            </a>
            <a
              href="https://sofiane-kherarfa.azim404.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-200 transition-colors"
            >
              {t('nav.portfolio_site')} ↗
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 text-center text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span>{t('footer.copyright', { year: currentYear })}</span>
            <span className="text-slate-800">•</span>
            <Link
              to="/admin"
              className="text-xs text-gray-500 hover:text-cyan-300 font-mono transition-colors flex items-center gap-1 p-1 hover:underline"
              title="Accès Console Admin & Espace Privé"
            >
              <span>🔒</span>
              <span>Administration</span>
            </Link>
          </div>
          <span className="font-semibold text-gray-400 text-sm">
            Sofiane Kherarfa
          </span>
        </div>
      </div>
    </footer>
  );
}
