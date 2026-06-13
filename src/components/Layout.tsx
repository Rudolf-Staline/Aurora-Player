import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BottomPlayer } from './BottomPlayer';
import { Sidebar } from './Sidebar';
import { Menu, Settings } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-bg-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-[28rem] w-[44rem] rounded-full bg-accent-primary/[0.04] blur-3xl" />
      </div>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Slim mobile top bar */}
        <header className="flex items-center justify-between gap-3 border-b border-line bg-bg-secondary px-4 py-3 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-premium bg-bg-elevated text-text-primary active:scale-95"
            aria-label="Ouvrir la navigation"
          >
            <Menu size={20} />
          </button>
          <button onClick={() => navigate('/music')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-accent-primary/25 bg-bg-elevated">
              <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-semibold tracking-[-0.02em] text-text-primary">Omed Player</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-premium bg-bg-elevated text-text-muted active:scale-95"
            aria-label="Réglages"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <Settings size={18} />
            )}
          </button>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 pb-36 sm:p-5 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>

      <BottomPlayer />
    </div>
  );
};
