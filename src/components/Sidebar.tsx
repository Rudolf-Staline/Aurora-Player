import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Music, Podcast, Video, Settings, Library, Heart, Bell, ListMusic, Cloud, LogOut, Clock, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { SyncStatus } from './SyncStatus';
import { useAuthStore } from '../store/useAuthStore';

const navItems = [
  { path: '/music', label: 'Musique', icon: <Music size={18} />, hint: 'Local & mixes' },
  { path: '/podcasts', label: 'Podcasts', icon: <Podcast size={18} />, hint: 'Découvrir' },
  { path: '/video', label: 'Vidéo', icon: <Video size={18} />, hint: 'Player' },
];

const libraryItems = [
  { path: '/local-files', label: 'Fichiers locaux', icon: <Library size={18} /> },
  { path: '/drive', label: 'Google Drive', icon: <Cloud size={18} /> },
  { path: '/playlists', label: 'Playlists', icon: <ListMusic size={18} /> },
  { path: '/subscriptions', label: 'Abonnements', icon: <Bell size={18} /> },
  { path: '/history', label: 'Historique', icon: <Clock size={18} /> },
  { path: '/favorites', label: 'Favoris', icon: <Heart size={18} /> },
];

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuthStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      {isOpen && (
        <div 
          className="absolute inset-0 z-30 bg-black/60 backdrop-blur-md md:hidden" 
          onClick={onClose}
        />
      )}
      
      <aside className={`surface-card relative z-40 flex h-full w-[18rem] shrink-0 flex-col overflow-hidden rounded-[2rem] p-4 transition-transform duration-300 md:translate-x-0 md:flex ${isOpen ? 'absolute inset-y-0 left-0 translate-x-0' : 'absolute inset-y-0 left-0 hidden -translate-x-full md:static md:flex'}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent-cyan/12 to-transparent" />

        <div className="relative mb-6 flex items-center gap-3 px-1 pt-1">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-violet shadow-lg glow-cyan">
            <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-accent-cyan">Studio</p>
            <h1 className="truncate text-xl font-black tracking-tight text-text-primary">Omed Player</h1>
          </div>
        </div>

        <div className="surface-card-strong aurora-ring mb-5 rounded-3xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-accent-cyan">
              <Radio size={19} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Mode</p>
              <p className="text-sm font-bold text-text-primary">Audio concentré</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
          <div>
            <h2 className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">Explorer</h2>
            <motion.ul 
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {navItems.map((item) => (
                <motion.li key={item.path} variants={itemVariants}>
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => 
                      `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition-all ${
                        isActive 
                          ? 'bg-white/12 text-text-primary shadow-lg shadow-black/20 ring-1 ring-white/10' 
                          : 'text-text-muted hover:bg-white/7 hover:text-text-primary'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${isActive ? 'bg-gradient-to-br from-accent-cyan to-accent-violet text-bg-primary glow-cyan' : 'bg-white/5 text-text-muted group-hover:text-accent-cyan'}`}>
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{item.label}</span>
                          <span className="block truncate text-[11px] font-medium text-text-muted">{item.hint}</span>
                        </span>
                      </>
                    )}
                  </NavLink>
                </motion.li>
              ))}
            </motion.ul>
          </div>

          <div>
            <h2 className="mb-3 px-2 text-[11px] font-black uppercase tracking-[0.24em] text-text-muted">Bibliothèque</h2>
            <motion.ul 
              className="space-y-1.5"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {libraryItems.map((item) => (
                <motion.li key={item.path} variants={itemVariants}>
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => 
                      `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        isActive 
                          ? 'bg-white/12 text-accent-cyan ring-1 ring-white/10' 
                          : 'text-text-muted hover:bg-white/7 hover:text-text-primary'
                      }`
                    }
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </nav>

        <div className="relative mt-4">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-full rounded-3xl bg-white/[0.06] p-3 text-left transition-all hover:bg-white/[0.09]"
          >
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-11 w-11 shrink-0 rounded-2xl bg-white/10 object-cover" />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Settings size={18} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-text-primary">{user?.name || 'Utilisateur'}</p>
                <p className="truncate text-xs text-text-muted">{user?.email || 'email@gmail.com'}</p>
              </div>
            </div>
          </button>

          {showProfileMenu && (
            <div className="surface-card absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-3xl p-1 shadow-2xl">
              <button 
                onClick={() => { navigate('/settings'); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-text-primary transition-colors hover:bg-white/10"
              >
                <Settings size={16} /> Paramètres
              </button>
              <button 
                onClick={() => { logout(); setShowProfileMenu(false); }}
                className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-accent-rose transition-colors hover:bg-accent-rose/10"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-3xl bg-black/15 p-3 ring-1 ring-white/10">
          <SyncStatus />
        </div>
      </aside>
    </>
  );
};
