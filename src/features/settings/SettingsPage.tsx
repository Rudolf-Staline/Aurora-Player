import React from 'react';
import { useSettingsStore, type ThemeType, type DensityType } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { LogOut, Sparkles, Palette, SlidersHorizontal, Accessibility, KeyRound, UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { 
    theme, 
    density, 
    animationsEnabled, 
    geminiApiKey,
    setTheme, 
    setDensity, 
    setAnimationsEnabled,
    setGeminiApiKey
  } = useSettingsStore();
  const { user, logout } = useAuthStore();

  const themes: { id: ThemeType; name: string; description: string; colors: string[] }[] = [
    { id: 'aurora', name: 'Aurora', description: 'Champagne nocturne', colors: ['bg-[#d8c9a3]', 'bg-[#b08b57]'] },
    { id: 'sunset', name: 'Sunset', description: 'Cuivre chaleureux', colors: ['bg-[#c79a6b]', 'bg-[#a8704a]'] },
    { id: 'forest', name: 'Forest', description: 'Patine sourde', colors: ['bg-[#9fae8f]', 'bg-[#c7b486]'] },
    { id: 'ocean', name: 'Ocean', description: 'Acier profond', colors: ['bg-[#8a99a8]', 'bg-[#b3bcc6]'] },
    { id: 'neon', name: 'Onyx', description: 'Contraste affirmé', colors: ['bg-[#d8c9a3]', 'bg-[#7a7a7e]'] },
    { id: 'midnight', name: 'Midnight', description: 'Obsidienne minimale', colors: ['bg-[#9b9bb0]', 'bg-[#7e8b87]'] },
    { id: 'peach', name: 'Peach', description: 'Rose oxydé', colors: ['bg-[#c08a7d]', 'bg-[#caa285]'] },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-20">
      <section className="surface-card-strong shadow-deep relative overflow-hidden rounded-[2rem] p-6 md:p-9">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-accent-primary/[0.06] blur-3xl" />
        <div className="relative">
          <div className="eyebrow mb-6 inline-flex items-center gap-2 text-accent-primary">
            <SlidersHorizontal size={13} /> Paramètres
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text-primary md:text-5xl">
            Ajustez Omed à votre façon d’écouter.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-text-muted">
            Compte Google, intelligence IA, apparence, densité et animations : tout ce qui façonne votre expérience est réuni dans une console unique.
          </p>
        </div>
      </section>

      <section className="surface-card shadow-deep rounded-[2rem] p-6 md:p-8">
        <div className="mb-6 flex items-center gap-4 border-b border-premium pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl surface-secondary border-premium text-accent-primary">
            <UserCircle size={22} />
          </div>
          <div>
            <p className="eyebrow text-accent-primary">Compte</p>
            <h2 className="text-xl font-semibold text-text-primary">Compte Google</h2>
            <p className="text-sm text-text-muted">Connexion, synchronisation et session active</p>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-16 w-16 rounded-2xl object-cover border-premium-strong" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl surface-secondary border-premium text-2xl font-semibold text-text-primary">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-text-primary">{user?.name}</p>
              <p className="truncate text-sm text-text-muted">{user?.email}</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-text-muted/70">Session locale active</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={async () => {
                const toastId = toast.loading('Synchronisation avec Google Drive...');
                await usePlaylistStore.getState().syncFromCloud();
                toast.success('Synchronisation terminée', { id: toastId });
              }}
              className="btn-primary rounded-2xl px-5 py-3 text-sm font-semibold"
            >
              Synchroniser
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-3 text-sm font-semibold text-danger transition-colors hover:bg-danger/15"
            >
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-violet/10 text-accent-violet">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary">Intelligence IA</h2>
            <p className="text-sm text-text-muted">Résumés, recommandations et features intelligentes</p>
          </div>
        </div>
        <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-text-primary">
            <KeyRound size={16} className="text-accent-cyan" /> Gemini API Key
          </label>
          <p className="mb-4 text-xs leading-5 text-text-muted">
            Ajoute une clé pour activer les recommandations réelles et les résumés. Tu peux en créer une depuis Google AI Studio.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input 
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              placeholder="Colle ta clé Gemini ici..."
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
            />
            {geminiApiKey && (
              <button 
                onClick={() => {
                  setGeminiApiKey('');
                  toast.success('Clé API supprimée');
                }}
                className="rounded-2xl border border-accent-rose/20 bg-accent-rose/10 px-4 py-3 text-sm font-bold text-accent-rose transition-colors hover:bg-accent-rose/20"
              >
                Effacer
              </button>
            )}
          </div>
          {!geminiApiKey && !import.meta.env.VITE_GEMINI_API_KEY && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-accent-rose/20 bg-accent-rose/10 p-3 text-xs text-accent-rose">
              <div className="h-2 w-2 rounded-full bg-accent-rose" />
              Mode mock actif : ajoute une clé pour utiliser l’IA réelle.
            </div>
          )}
          {geminiApiKey && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-accent-cyan/20 bg-accent-cyan/10 p-3 text-xs text-accent-cyan">
              <div className="h-2 w-2 rounded-full bg-accent-cyan" />
              Services IA actifs avec ta clé locale.
            </div>
          )}
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan">
            <Palette size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary">Apparence</h2>
            <p className="text-sm text-text-muted">Thème, densité et confort de lecture</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`rounded-3xl border p-4 text-left transition-all ${theme === t.id ? 'border-accent-cyan/60 bg-accent-cyan/10 shadow-lg glow-cyan' : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'}`}
            >
              <div className="mb-4 flex -space-x-2">
                <div className={`h-8 w-8 rounded-full ring-2 ring-bg-primary ${t.colors[0]}`} />
                <div className={`h-8 w-8 rounded-full ring-2 ring-bg-primary ${t.colors[1]}`} />
              </div>
              <p className="font-black text-text-primary">{t.name}</p>
              <p className="mt-1 text-xs text-text-muted">{t.description}</p>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
          <p className="mb-3 text-sm font-bold text-text-primary">Densité de l’interface</p>
          <div className="flex w-fit rounded-2xl bg-white/[0.05] p-1">
            {(['compact', 'normal', 'comfortable'] as DensityType[]).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition-colors ${density === d ? 'bg-white/[0.12] text-accent-cyan' : 'text-text-muted hover:text-text-primary'}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-text-primary">
            <Accessibility size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary">Accessibilité</h2>
            <p className="text-sm text-text-muted">Réduire ou activer les effets visuels</p>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
          <div>
            <p className="text-sm font-bold text-text-primary">Animations</p>
            <p className="mt-1 text-xs text-text-muted">Transitions de pages et effets de mouvement.</p>
          </div>
          <button
            onClick={() => setAnimationsEnabled(!animationsEnabled)}
            className={`relative h-7 w-14 rounded-full transition-colors ${animationsEnabled ? 'bg-accent-cyan' : 'bg-white/20'}`}
            aria-label="Activer les animations"
          >
            <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${animationsEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      </section>
    </div>
  );
};
