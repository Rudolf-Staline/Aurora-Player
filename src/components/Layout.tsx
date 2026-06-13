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
        <div className="soft-grid absolute inset-0 opacity-55" />
      </div>

      <div className="relative z-30 flex items-center justify-between border-b border-black/10 bg-bg-primary/85 px-4 py-3 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/15 bg-[#171717]">
            <img src="/app-logo.png" alt="Omed Logo" className="h-full w-full object-cover grayscale" />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-text-muted">Editorial</p>
            <h1 className="text-lg font-black tracking-[-0.04em] text-text-primary">Omed Player</h1>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#fbf7f0] text-text-primary transition-transform active:scale-95"
          aria-label="Ouvrir la navigation"
        >
          {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 gap-5 overflow-hidden p-3 md:p-5">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <main className="min-w-0 flex-1 overflow-y-auto rounded-[2.5rem] border border-black/10 bg-[#f8f2ea]/70 p-3 shadow-[0_30px_80px_rgba(23,23,23,0.08)] backdrop-blur-sm sm:p-5 lg:p-7 pb-40">
          <div className="mx-auto w-full max-w-[1540px]">
            {children}
          </div>
        </main>
      </div>
      <BottomPlayer />
    </div>
  );
};
