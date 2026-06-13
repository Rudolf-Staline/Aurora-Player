import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from './components/Layout';
import { Library } from './features/music/Library';
import { PodcastSearch } from './features/podcasts/PodcastSearch';
import { PodcastDetail } from './features/podcasts/PodcastDetail';
import { SubscriptionsPage } from './features/podcasts/SubscriptionsPage';
import { PlaylistsPage } from './features/playlists/PlaylistsPage';
import { PlaylistDetail } from './features/playlists/PlaylistDetail';
import { VideoPlayer } from './features/video/VideoPlayer';
import { SettingsPage } from './features/settings/SettingsPage';
import { FavoritesPage } from './features/music/FavoritesPage';
import { DrivePlayer } from './features/drive/DrivePlayer';
import { HistoryPage } from './features/history/HistoryPage';
import { useSettingsStore } from './store/useSettingsStore';
import { useAuthStore } from './store/useAuthStore';
import { LoginPage } from './features/auth/LoginPage';
import { Toaster } from 'react-hot-toast';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -8 }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.22
};

// Nocturne Luxe — every theme stays on a deep Obsidian ground, only the
// Champagne/Copper accent shifts subtly. No neon, no light surfaces.
const OBSIDIAN = '#0F0F10';
const DEEP_SHADOW = '0 24px 60px rgba(0,0,0,0.55)';
const themeTokens: Record<string, { primary: string; secondary: string; bg: string; glow: string }> = {
  aurora: { primary: '#C6A77B', secondary: '#9D6F49', bg: OBSIDIAN, glow: DEEP_SHADOW },
  sunset: { primary: '#CDA579', secondary: '#A66C45', bg: OBSIDIAN, glow: DEEP_SHADOW },
  forest: { primary: '#BBA877', secondary: '#7E8157', bg: OBSIDIAN, glow: DEEP_SHADOW },
  ocean: { primary: '#B7AE8E', secondary: '#6F7F84', bg: OBSIDIAN, glow: DEEP_SHADOW },
  neon: { primary: '#CDAE6E', secondary: '#A8803F', bg: OBSIDIAN, glow: DEEP_SHADOW },
  midnight: { primary: '#CBB089', secondary: '#8C6B4E', bg: OBSIDIAN, glow: DEEP_SHADOW },
  peach: { primary: '#CDA579', secondary: '#A66C45', bg: OBSIDIAN, glow: DEEP_SHADOW },
};

const AnimatedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { animationsEnabled } = useSettingsStore();
  
  if (!animationsEnabled) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

function App() {
  const location = useLocation();
  const { theme, density, animationsEnabled } = useSettingsStore();
  const { isConnected, restoreSession } = useAuthStore();

  React.useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.className = density;
    
    const root = document.documentElement;
    const tokens = themeTokens[theme] ?? themeTokens.aurora;
    root.style.setProperty('--accent-primary', tokens.primary);
    root.style.setProperty('--accent-secondary', tokens.secondary);
    root.style.setProperty('--accent-cyan', tokens.primary);
    root.style.setProperty('--accent-violet', tokens.secondary);
    root.style.setProperty('--bg-primary', tokens.bg);
    root.style.setProperty('--glow-cyan', tokens.glow);
    root.style.setProperty('--glow-violet', tokens.glow);
  }, [theme, density]);

  if (!isConnected) {
    return (
      <>
        <LoginPage />
        <Toaster position="bottom-center" />
      </>
    );
  }

  return (
    <Layout>
      <Toaster position="bottom-center" toastOptions={{ className: 'surface-card text-text-primary' }} />
      <AnimatePresence mode="wait" initial={animationsEnabled}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/music" replace />} />
          <Route path="/music" element={<AnimatedRoute><Library /></AnimatedRoute>} />
          <Route path="/podcasts" element={<AnimatedRoute><PodcastSearch /></AnimatedRoute>} />
          <Route path="/podcasts/:id" element={<AnimatedRoute><PodcastDetail /></AnimatedRoute>} />
          <Route path="/subscriptions" element={<AnimatedRoute><SubscriptionsPage /></AnimatedRoute>} />
          <Route path="/video" element={<AnimatedRoute><VideoPlayer /></AnimatedRoute>} />
          <Route path="/settings" element={<AnimatedRoute><SettingsPage /></AnimatedRoute>} />
          <Route path="/playlists" element={<AnimatedRoute><PlaylistsPage /></AnimatedRoute>} />
          <Route path="/playlists/:id" element={<AnimatedRoute><PlaylistDetail /></AnimatedRoute>} />
          <Route path="/drive" element={<AnimatedRoute><DrivePlayer /></AnimatedRoute>} />
          <Route path="/local-files" element={<Navigate to="/music" replace />} />
          <Route path="/history" element={<AnimatedRoute><HistoryPage /></AnimatedRoute>} />
          <Route path="/favorites" element={<AnimatedRoute><FavoritesPage /></AnimatedRoute>} />
          <Route path="*" element={<AnimatedRoute><div className="surface-card rounded-3xl p-10 text-center text-text-muted">Page introuvable ou pas encore disponible.</div></AnimatedRoute>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
