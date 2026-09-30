import { useState } from 'react';
export default function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const PRO_EMAIL = 'sb.kherarfa@gmail.com';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(PRO_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: 'loading', message: '' });

    try {
      const response = await fetch('/api/email/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({
          state: 'success',
          message: 'Votre message a bien été envoyé ! Je vous répondrai dans les plus brefs délais.',
        });
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error('Erreur API');
      }
    } catch {
      // Fallback direct mailto to guarantee delivery
      const mailtoUrl = `mailto:${PRO_EMAIL}?subject=${encodeURIComponent(
        `[Contact Azim404] Message de ${formData.name || 'Visiteur'}`
      )}&body=${encodeURIComponent(
        `Nom: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      window.location.href = mailtoUrl;
      setStatus({
        state: 'success',
        message: 'Votre client de messagerie a été ouvert avec votre message pré-rempli pour envoi.',
      });
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-28 relative bg-[#030712] overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-4xl relative z-10">
        <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-cyan-500/25 shadow-[0_0_35px_rgba(6,182,212,0.15)]">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
              Me Contacter
            </h2>
            <p className="text-gray-400 text-sm sm:text-base">
              Une question, un projet ou une collaboration ? N'hésitez pas à me joindre directement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
            {/* Direct Email Card */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/20">
                <div className="text-xs font-mono uppercase text-cyan-400 mb-1">
                  Email Professionnel
                </div>
                <div className="text-white font-semibold text-sm sm:text-base break-all mb-3">
                  {PRO_EMAIL}
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${PRO_EMAIL}`}
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs text-center transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    ✉️ Écrire
                  </a>
                  <button
                    onClick={handleCopyEmail}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-200 text-xs font-medium transition-colors"
                  >
                    {copied ? '✓ Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-gray-400 space-y-2">
                <div className="text-white font-medium">Portfolio & Projets :</div>
                <div>
                  Retrouvez toutes mes réalisations sur{' '}
                  <a
                    href="https://sofiane-kherarfa.azim404.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    sofiane-kherarfa.azim404.com
                  </a>
                  .
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="md:col-span-3 space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">
                  Votre Nom ou Société
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex : Alexandre Dupont"
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">
                  Votre Adresse Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="alexandre@exemple.com"
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-400 mb-1.5">
                  Votre Message
                </label>
                <textarea
                  required
                  rows="4"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Décrivez votre demande..."
                  className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-sm resize-none"
                />
              </div>

              {status.message && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono ${
                    status.state === 'success'
                      ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/70 border border-red-500/40 text-red-300'
                  }`}
                >
                  {status.message}
                </div>
              )}

              <button
                type="submit"
                disabled={status.state === 'loading'}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
              >
                <span>{status.state === 'loading' ? 'Envoi...' : 'Envoyer le Message'}</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
