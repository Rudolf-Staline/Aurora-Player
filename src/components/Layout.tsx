import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { BottomPlayer } from './BottomPlayer';
import { Menu, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-bg-primary text-text-primary">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-22rem] h-[42rem] w-[42rem] rounded-full bg-accent-cyan/15 blur-[130px]" />
        <div className="absolute right-[-18rem] top-12 h-[38rem] w-[38rem] rounded-full bg-accent-violet/15 blur-[120px]" />
        <div className="soft-grid absolute inset-0 opacity-60" />
      </div>

      <div className="relative z-30 flex items-center justify-between px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-violet shadow-lg glow-cyan">
            <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-accent-cyan">Studio</p>
            <h1 className="text-lg font-black tracking-tight text-text-primary">Omed Player</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="surface-card flex h-11 w-11 items-center justify-center rounded-2xl text-text-primary transition-transform active:scale-95"
          aria-label="Ouvrir la navigation"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 gap-4 overflow-hidden px-3 pb-3 md:p-4">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto rounded-[2rem] border border-white/10 bg-black/20 p-4 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-6 lg:p-8 pb-40">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
          </div>
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
};
