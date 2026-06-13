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
    { id: 'aurora', name: 'Aurora', description: 'Bleu violet premium', colors: ['bg-[#7dd3fc]', 'bg-[#c084fc]'] },
    { id: 'sunset', name: 'Sunset', description: 'Chaud et énergique', colors: ['bg-[#fb923c]', 'bg-[#f472b6]'] },
    { id: 'forest', name: 'Forest', description: 'Calme et organique', colors: ['bg-[#34d399]', 'bg-[#facc15]'] },
    { id: 'ocean', name: 'Ocean', description: 'Froid et concentré', colors: ['bg-[#38bdf8]', 'bg-[#60a5fa]'] },
    { id: 'neon', name: 'Cyberpunk', description: 'Contraste fort', colors: ['bg-[#fde047]', 'bg-[#f472b6]'] },
    { id: 'midnight', name: 'Midnight', description: 'Sombre et minimal', colors: ['bg-[#818cf8]', 'bg-[#2dd4bf]'] },
    { id: 'peach', name: 'Peach', description: 'Rose doux', colors: ['bg-[#fb7185]', 'bg-[#fdba74]'] },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-20">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-accent-violet/15 blur-3xl" />
        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
            <SlidersHorizontal size={14} /> Paramètres
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
            Ajuste Omed à ta façon <span className="text-gradient-aurora">d’écouter</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
            Compte Google, intelligence IA, apparence, densité et animations : tout ce qui influence l’expérience est rassemblé ici.
          </p>
        </div>
      </section>

      <section className="surface-card rounded-[2rem] p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-cyan/10 text-accent-cyan">
            <UserCircle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary">Compte Google</h2>
            <p className="text-sm text-text-muted">Connexion, synchronisation et session active</p>
          </div>
        </div>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-16 w-16 rounded-2xl bg-white/10 object-cover shadow-lg" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black text-text-primary">
                {user?.name?.[0] || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-lg font-black text-text-primary">{user?.name}</p>
              <p className="truncate text-sm text-text-muted">{user?.email}</p>
              <p className="mt-2 font-mono text-xs text-text-muted/70">Session locale active</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button 
              onClick={async () => {
                const toastId = toast.loading('Synchronisation avec Google Drive...');
                await usePlaylistStore.getState().syncFromCloud();
                toast.success('Synchronisation terminée', { id: toastId });
              }}
              className="command-button rounded-2xl px-5 py-3 text-sm font-black"
            >
              Synchroniser
            </button>
            <button 
              onClick={logout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent-rose/20 bg-accent-rose/10 px-5 py-3 text-sm font-bold text-accent-rose transition-colors hover:bg-accent-rose/20"
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
                className={`rounded-xl px-4 py-2 text-sm font-bold capitalize transition-colors ${density === d ? 'bg-white/12 text-accent-cyan' : 'text-text-muted hover:text-text-primary'}`}
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
