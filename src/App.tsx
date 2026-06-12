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
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  in: { opacity: 1, y: 0, filter: 'blur(0px)' },
  out: { opacity: 0, y: -10, filter: 'blur(4px)' }
};

const pageTransition = {
  type: 'tween' as const,
  ease: 'easeOut' as const,
  duration: 0.25
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
    
    // Apply exact CSS variables directly to the root element per requirements
    const root = document.documentElement;
    if (theme === 'sunset') {
      root.style.setProperty('--accent-cyan', '#FF7B00');
      root.style.setProperty('--accent-violet', '#F472B6');
      root.style.setProperty('--bg-primary', '#110A0A');
      root.style.setProperty('--glow-cyan', '0 0 20px rgba(255,123,0,0.3)');
    } else if (theme === 'forest') {
      root.style.setProperty('--accent-cyan', '#10B981');
      root.style.setProperty('--accent-violet', '#FBBF24');
      root.style.setProperty('--bg-primary', '#080F0A');
      root.style.setProperty('--glow-cyan', '0 0 20px rgba(16,185,129,0.3)');
    } else {
      // Aurora (default)
      root.style.setProperty('--accent-cyan', '#00E5FF');
      root.style.setProperty('--accent-violet', '#A855F7');
      root.style.setProperty('--bg-primary', '#0A0A14');
      root.style.setProperty('--glow-cyan', '0 0 20px rgba(0,229,255,0.3)');
    }
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
      <Toaster position="bottom-center" />
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
          {/* Fallback for unhandled routes */}
          <Route path="*" element={<AnimatedRoute><div className="text-text-muted mt-8 text-center">Page Not Found or Not Implemented Yet</div></AnimatedRoute>} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
