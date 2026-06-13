import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { BottomPlayer } from './BottomPlayer';
import { Menu, X, Music, Podcast, Video, Cloud, ListMusic, Heart, Clock, Settings, LogOut, Search } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { SyncStatus } from './SyncStatus';

const primaryNav = [
  { path: '/music', label: 'Accueil', icon: <Music size={17} /> },
  { path: '/podcasts', label: 'Podcasts', icon: <Podcast size={17} /> },
  { path: '/drive', label: 'Drive', icon: <Cloud size={17} /> },
  { path: '/playlists', label: 'Playlists', icon: <ListMusic size={17} /> },
  { path: '/video', label: 'Vidéo', icon: <Video size={17} /> },
];

const secondaryNav = [
  { path: '/favorites', label: 'Favoris', icon: <Heart size={16} /> },
  { path: '/history', label: 'Historique', icon: <Clock size={16} /> },
  { path: '/settings', label: 'Réglages', icon: <Settings size={16} /> },
];

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-bg-elevated text-accent-primary border border-accent-primary/30'
      : 'text-text-muted hover:bg-white/[0.04] hover:text-text-primary'
  }`;

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-bg-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[28rem] w-[44rem] -translate-x-1/2 rounded-full bg-accent-primary/[0.04] blur-3xl" />
      </div>

      <header className="relative z-40 mx-3 mt-3 rounded-[1.75rem] surface-secondary shadow-deep md:mx-5 md:mt-5">
        <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 md:px-5">
          <button onClick={() => navigate('/music')} className="flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-accent-primary/25 bg-bg-elevated">
              <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="eyebrow">Premium Audio</p>
              <h1 className="text-xl font-semibold tracking-[-0.03em] text-text-primary">Omed Player</h1>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-full border-premium bg-black/20 p-1 lg:flex">
            {primaryNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="hidden items-center gap-2 rounded-full border-premium bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-text-primary xl:inline-flex">
              <Search size={16} /> Recherche
            </button>
            <div className="hidden w-52 xl:block">
              <SyncStatus />
            </div>
            <button onClick={() => navigate('/settings')} className="flex items-center gap-3 rounded-full border-premium bg-bg-elevated px-3 py-2 transition-colors hover:border-accent-primary/40">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary text-[#161310] text-sm font-bold">{user?.name?.[0] || 'U'}</span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-semibold text-text-primary xl:block">{user?.name || 'Utilisateur'}</span>
            </button>
            <button onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-full border-premium bg-bg-elevated text-text-muted transition-colors hover:border-danger/40 hover:text-danger" aria-label="Déconnexion">
              <LogOut size={17} />
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-full border-premium bg-bg-elevated text-text-primary transition-transform active:scale-95 lg:hidden"
            aria-label="Ouvrir la navigation"
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <div className="hidden border-t border-line px-4 py-2 md:block lg:hidden">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="relative z-50 mx-3 mt-2 rounded-[1.75rem] surface-card p-3 lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-line pt-3">
            <SyncStatus />
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden p-3 pt-4 md:p-5 md:pt-5">
        <main className="h-full overflow-y-auto rounded-[2rem] surface-secondary p-3 sm:p-5 lg:p-7 pb-36">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
};
