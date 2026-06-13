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

const themeTokens: Record<string, { cyan: string; violet: string; bg: string; glow: string }> = {
  aurora: { cyan: '#171717', violet: '#9b6b43', bg: '#f4efe7', glow: '0 18px 44px rgba(23,23,23,0.10)' },
  sunset: { cyan: '#171717', violet: '#b85c38', bg: '#f7eee4', glow: '0 18px 44px rgba(184,92,56,0.12)' },
  forest: { cyan: '#15261d', violet: '#657a52', bg: '#eef2e8', glow: '0 18px 44px rgba(21,38,29,0.10)' },
  ocean: { cyan: '#123244', violet: '#5b6f7a', bg: '#edf3f4', glow: '0 18px 44px rgba(18,50,68,0.10)' },
  neon: { cyan: '#171717', violet: '#b08a36', bg: '#f5f0df', glow: '0 18px 44px rgba(176,138,54,0.12)' },
  midnight: { cyan: '#f4efe7', violet: '#b89b72', bg: '#111111', glow: '0 18px 44px rgba(244,239,231,0.08)' },
  peach: { cyan: '#171717', violet: '#b76e65', bg: '#f8eee9', glow: '0 18px 44px rgba(183,110,101,0.12)' },
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
    root.style.setProperty('--accent-cyan', tokens.cyan);
    root.style.setProperty('--accent-violet', tokens.violet);
    root.style.setProperty('--bg-primary', tokens.bg);
    root.style.setProperty('--glow-cyan', tokens.glow);
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
