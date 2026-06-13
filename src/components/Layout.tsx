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
  `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black transition-all ${
    isActive
      ? 'bg-[#171717] text-[#f4efe7] shadow-[0_12px_28px_rgba(23,23,23,0.16)]'
      : 'text-text-muted hover:bg-black/[0.06] hover:text-text-primary'
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
        <div className="soft-grid absolute inset-0 opacity-45" />
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-[#c9b79e]/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#171717]/5 blur-3xl" />
      </div>

      <header className="relative z-40 mx-3 mt-3 rounded-[2rem] border border-black/10 bg-[#fbf7f0]/90 shadow-[0_20px_54px_rgba(23,23,23,0.08)] backdrop-blur-xl md:mx-5 md:mt-5">
        <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 md:px-5">
          <button onClick={() => navigate('/music')} className="flex items-center gap-3 text-left">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-[#171717] shadow-[0_14px_30px_rgba(23,23,23,0.18)]">
              <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover grayscale" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.34em] text-text-muted">Media OS</p>
              <h1 className="text-xl font-black tracking-[-0.07em] text-text-primary">Omed Player</h1>
            </div>
          </button>

          <nav className="hidden items-center gap-1 rounded-full border border-black/10 bg-black/[0.035] p-1 lg:flex">
            {primaryNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button className="hidden items-center gap-2 rounded-full border border-black/10 bg-white/40 px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:bg-white/70 hover:text-text-primary xl:inline-flex">
              <Search size={16} /> Recherche
            </button>
            <div className="hidden w-52 xl:block">
              <SyncStatus />
            </div>
            <button onClick={() => navigate('/settings')} className="flex items-center gap-3 rounded-full border border-black/10 bg-white/45 px-3 py-2 transition-colors hover:bg-white/75">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171717] text-[#f4efe7] text-sm font-black">{user?.name?.[0] || 'U'}</span>
              )}
              <span className="hidden max-w-28 truncate text-sm font-black text-text-primary xl:block">{user?.name || 'Utilisateur'}</span>
            </button>
            <button onClick={logout} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/45 text-text-muted transition-colors hover:bg-[#171717] hover:text-[#f4efe7]" aria-label="Déconnexion">
              <LogOut size={17} />
            </button>
          </div>

          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white/50 text-text-primary transition-transform active:scale-95 lg:hidden"
            aria-label="Ouvrir la navigation"
          >
            {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        <div className="hidden border-t border-black/10 px-4 py-2 md:block lg:hidden">
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
        <div className="relative z-50 mx-3 mt-2 rounded-[2rem] border border-black/10 bg-[#fbf7f0] p-3 shadow-2xl lg:hidden">
          <nav className="grid grid-cols-2 gap-2">
            {[...primaryNav, ...secondaryNav].map((item) => (
              <NavLink key={item.path} to={item.path} className={navClass}>
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3 border-t border-black/10 pt-3">
            <SyncStatus />
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-0 flex-1 overflow-hidden p-3 pt-4 md:p-5 md:pt-5">
        <main className="h-full overflow-y-auto rounded-[2.4rem] border border-black/10 bg-[#f8f2ea]/62 p-3 shadow-[0_30px_80px_rgba(23,23,23,0.08)] backdrop-blur-sm sm:p-5 lg:p-7 pb-36">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
};
