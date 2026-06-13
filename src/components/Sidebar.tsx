import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Music, Podcast, Video, Settings, Heart, Bell, ListMusic, Cloud, LogOut, Clock } from 'lucide-react';
import { SyncStatus } from './SyncStatus';
import { useAuthStore } from '../store/useAuthStore';

const navItems = [
  { path: '/music', label: 'Musique', icon: <Music size={18} /> },
  { path: '/podcasts', label: 'Podcasts', icon: <Podcast size={18} /> },
  { path: '/video', label: 'Vidéo', icon: <Video size={18} /> },
];

const libraryItems = [
  { path: '/drive', label: 'Google Drive', icon: <Cloud size={17} /> },
  { path: '/playlists', label: 'Playlists', icon: <ListMusic size={17} /> },
  { path: '/subscriptions', label: 'Abonnements', icon: <Bell size={17} /> },
  { path: '/favorites', label: 'Favoris', icon: <Heart size={17} /> },
  { path: '/history', label: 'Historique', icon: <Clock size={17} /> },
];

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const primaryLinkClass = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-bg-elevated text-text-primary'
      : 'text-text-muted hover:bg-white/[0.04] hover:text-text-primary'
  }`;

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`z-40 flex h-full w-[17rem] shrink-0 flex-col overflow-hidden border-r border-line bg-bg-secondary px-4 py-5 transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'fixed inset-y-0 left-0 translate-x-0' : 'fixed inset-y-0 left-0 -translate-x-full md:translate-x-0'
        }`}
      >
        {/* 1 — Identité */}
        <button onClick={() => navigate('/music')} className="mb-8 flex items-center gap-3 px-1 text-left">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-accent-primary/25 bg-bg-elevated">
            <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="eyebrow">Premium Audio</p>
            <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-text-primary">Omed Player</h1>
          </div>
        </button>

        <nav className="min-h-0 flex-1 space-y-8 overflow-y-auto pr-1">
          {/* 2 — Navigation principale */}
          <div>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-text-muted/70">Explorer</h2>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className={primaryLinkClass}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent-primary" />}
                        <span className={isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-accent-primary'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* 3 — Bibliothèque */}
          <div>
            <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.26em] text-text-muted/70">Bibliothèque</h2>
            <ul className="space-y-1">
              {libraryItems.map((item) => (
                <li key={item.path}>
                  <NavLink to={item.path} className={primaryLinkClass}>
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent-primary" />}
                        <span className={isActive ? 'text-accent-primary' : 'text-text-muted group-hover:text-accent-primary'}>
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* 4 — Profil utilisateur */}
        <div className="relative mt-5">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full rounded-2xl border border-line bg-bg-elevated p-3 text-left transition-colors hover:border-accent-primary/30"
          >
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-primary text-[#161310] text-sm font-bold">
                  {user?.name?.[0] || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{user?.name || 'Utilisateur'}</p>
                <p className="truncate text-xs text-text-muted">{user?.email || 'email@gmail.com'}</p>
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="surface-card absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-2xl p-1">
              <button
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-white/[0.05]"
              >
                <Settings size={16} /> Paramètres
              </button>
              <button
                onClick={() => { logout(); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-left text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>

        {/* 5 — SyncStatus */}
        <div className="mt-3">
          <SyncStatus />
        </div>
      </aside>
    </>
  );
};
