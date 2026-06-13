import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../../store/useAuthStore';
import { Cloud, Headphones, Loader2, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const googleLogin = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        await login(tokenResponse);
      } catch {
        setError('Connexion échouée. Réessaie.');
        setLoading(false);
      }
    },
    onError: () => {
        setError('Connexion échouée. Réessaie.');
        setLoading(false);
    }
  });

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-bg-primary p-4 text-text-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-18rem] h-[40rem] w-[52rem] -translate-x-1/2 rounded-full bg-accent-primary/[0.06] blur-[140px]" />
      </div>

      <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border-premium-strong surface-secondary shadow-deep lg:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card-strong relative min-h-[560px] overflow-hidden p-8 md:p-12">
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-accent-primary/25 bg-bg-secondary">
                <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="eyebrow">Omed</p>
                <p className="text-xl font-semibold text-text-primary">Player Studio</p>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="mb-4 inline-flex rounded-full border-premium bg-bg-elevated px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent-primary">
                Music · Podcasts · Drive
              </p>
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.03em] text-text-primary md:text-7xl">
                Ton espace audio, <span className="text-gradient-aurora">propre et synchronisé</span>.
              </h1>
              <p className="mt-6 text-base leading-7 text-text-muted md:text-lg">
                Connecte ton compte Google pour retrouver ta bibliothèque, tes playlists, tes favoris et tes contenus Drive dans une interface pensée pour écouter longtemps.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: <Cloud size={18} />, label: 'Drive sync' },
                { icon: <Headphones size={18} />, label: 'Player premium' },
                { icon: <ShieldCheck size={18} />, label: 'Données privées' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border-premium bg-bg-secondary p-4">
                  <div className="mb-3 text-accent-primary">{item.icon}</div>
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <p className="eyebrow">Connexion</p>
              <h2 className="mt-2 text-3xl font-semibold text-text-primary">Entrer dans Omed</h2>
              <p className="mt-3 text-sm leading-6 text-text-muted">
                Une seule connexion suffit pour activer la synchronisation et accéder aux fichiers Google Drive.
              </p>
            </div>

            <button
              onClick={() => googleLogin()}
              disabled={loading}
              className="command-button flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Se connecter avec Google
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 w-full rounded-2xl border border-accent-rose/20 bg-accent-rose/10 p-4 text-sm text-accent-rose">
                {error}
              </div>
            )}

            <p className="mt-6 text-center text-xs leading-5 text-text-muted">
              Omed utilise Google uniquement pour l'authentification, Drive et la synchronisation de tes données applicatives.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
