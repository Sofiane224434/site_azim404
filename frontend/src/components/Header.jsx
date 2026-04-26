// components/Header.jsx
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

function Header() {
  const { i18n } = useTranslation();
  const currentLanguage = (i18n.resolvedLanguage || i18n.language || 'fr').slice(0, 2);

  const handleLanguageChange = (event) => {
    i18n.changeLanguage(event.target.value);
  };

  return (
    <header className="bg-slate-900 text-white shadow-lg border-b border-indigo-900">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <span className="text-2xl font-black tracking-tight">
          AZIM<span className="text-indigo-400">404</span>
        </span>
        <div className="flex gap-4 items-center">
          <select
            value={currentLanguage}
            onChange={handleLanguageChange}
            className="text-sm bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition font-mono text-white border border-slate-600"
            title="Changer de langue"
          >
            {languages.map((language) => (
              <option key={language.code} value={language.code} className="text-black">
                {language.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
export default Header;
