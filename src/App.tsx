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
  initial: { opacity: 0, y: 16, scale: 0.985, filter: 'blur(8px)' },
  in: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
  out: { opacity: 0, y: -12, scale: 0.992, filter: 'blur(8px)' }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.28
};

const themeTokens: Record<string, { cyan: string; violet: string; bg: string; glow: string }> = {
  sunset: { cyan: '#fb923c', violet: '#f472b6', bg: '#12070b', glow: '0 18px 65px rgba(251,146,60,0.24)' },
  forest: { cyan: '#34d399', violet: '#facc15', bg: '#03120d', glow: '0 18px 65px rgba(52,211,153,0.24)' },
  ocean: { cyan: '#38bdf8', violet: '#60a5fa', bg: '#04111f', glow: '0 18px 65px rgba(56,189,248,0.24)' },
  neon: { cyan: '#fde047', violet: '#f472b6', bg: '#08070a', glow: '0 18px 65px rgba(253,224,71,0.22)' },
  midnight: { cyan: '#818cf8', violet: '#2dd4bf', bg: '#020617', glow: '0 18px 65px rgba(129,140,248,0.24)' },
  peach: { cyan: '#fb7185', violet: '#fdba74', bg: '#17080d', glow: '0 18px 65px rgba(251,113,133,0.24)' },
  aurora: { cyan: '#7dd3fc', violet: '#c084fc', bg: '#050712', glow: '0 18px 65px rgba(125,211,252,0.24)' },
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
