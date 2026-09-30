import { useAdmin } from '../contexts/AdminContext.jsx';

export default function Hero() {
  const { openModal } = useAdmin();

  return (
    <section
      id="home"
      className="relative min-h-[75vh] flex items-center justify-center cosmic-bg overflow-hidden py-16 sm:py-24"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-slate-950/75 to-[#030712] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 text-center max-w-4xl">
        {/* Main Title with the Cyber Logo integrated directly as the letter "A" */}
        <div className="mb-6 flex justify-center">
          <h1 className="inline-flex items-center text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] font-black text-white tracking-tight leading-none drop-shadow-[0_10px_40px_rgba(0,0,0,0.95)]">
            <span className="relative inline-flex items-center -mr-2 sm:-mr-4 md:-mr-6 select-none">
              <img
                src="/images/logo_transparent.png"
                alt="A"
                className="h-[0.92em] w-auto object-contain drop-shadow-[0_0_35px_rgba(59,130,246,0.65)] hover:scale-105 transition-transform duration-300"
              />
            </span>
            <span className="tracking-tight">zim</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]">
              .404
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-cyan-200 mb-6 max-w-2xl mx-auto">
          Portail Privé & Passerelle Digitale
        </p>

        {/* Lead description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-300 font-light leading-relaxed mb-12">
          Espace central d'accès et d'administration de l'écosystème Azim404. Retrouvez l'ensemble de mes projets sur mon portfolio officiel ou contactez-moi directement.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={openModal}
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn-neon-primary text-base sm:text-lg group flex items-center justify-center gap-2"
          >
            <span>⚡ Accéder à la Console</span>
          </button>

          <a
            href="https://sofiane-kherarfa.azim404.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-4 rounded-xl btn-neon-secondary text-base sm:text-lg group flex items-center justify-center gap-2"
          >
            <span>Explorer le Portfolio</span>
            <span className="text-sm">↗</span>
          </a>

          <a
            href="#contact"
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-gray-300 hover:text-white border border-slate-700 text-base transition-colors"
          >
            ✉ Me Contacter
          </a>
        </div>
      </div>
    </section>
  );
}
