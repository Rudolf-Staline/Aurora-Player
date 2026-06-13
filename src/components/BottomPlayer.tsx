import React, { useCallback, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Repeat, Shuffle, Heart, ListMusic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/usePlayerStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { audioEngine } from '../core/audio_engine';
import { QueuePanel } from './QueuePanel';

import { useSettingsStore } from '../store/useSettingsStore';

export const BottomPlayer: React.FC = () => {
  const { currentTrack, isPlaying, progress, currentTime, duration, volume, repeatMode, isShuffle, playNext, playPrevious, toggleShuffle, toggleRepeatMode, queue } = usePlayerStore();
  const { trackIds: favorites, toggleTrackFavorite: toggleFavorite } = useFavoritesStore();
  const { animationsEnabled } = useSettingsStore();
  const [showQueue, setShowQueue] = useState(false);

  const formatTime = (timeInSeconds: number) => {
    if (!Number.isFinite(timeInSeconds) || timeInSeconds <= 0) return '0:00';
    const mins = Math.floor(timeInSeconds / 60);
    const secs = Math.floor(timeInSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (!currentTrack) return;
    audioEngine.togglePlay();
  };

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!currentTrack || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = clickX / rect.width;
      audioEngine.seek(percent * duration);
    },
    [currentTrack, duration]
  );

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newVolume = Math.max(0, Math.min(1, clickX / rect.width));
    audioEngine.setVolume(newVolume);
  }, []);

  return (
    <motion.div 
      initial={animationsEnabled ? { y: 120, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
      className="pointer-events-none fixed inset-x-3 bottom-3 z-50 md:left-[20rem] md:right-4"
    >
      <div className="pointer-events-auto surface-card-strong aurora-ring mx-auto flex max-w-[1220px] flex-col gap-3 rounded-[2rem] p-3 md:flex-row md:items-center md:gap-5 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white/10 shadow-lg shadow-black/30 md:h-16 md:w-16">
            {currentTrack?.artworkUrl ? (
              <img src={currentTrack.artworkUrl} alt={currentTrack.album} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-cyan/25 to-accent-violet/25">
                <div className="h-7 w-7 rounded-full border border-white/30" />
              </div>
            )}
            {isPlaying && <div className="absolute inset-x-3 bottom-2 h-1 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet" />}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-accent-cyan">
              {isPlaying ? 'Lecture en cours' : 'Prêt à jouer'}
            </p>
            <h4 className="line-clamp-1 text-sm font-black text-text-primary md:text-base">
              {currentTrack?.title || 'Aucun titre sélectionné'}
            </h4>
            <p className="line-clamp-1 text-xs text-text-muted">
              {currentTrack?.artist || 'Choisis un morceau, un podcast ou un fichier Drive'}
            </p>
          </div>

          {currentTrack && (
            <button 
              onClick={() => toggleFavorite(currentTrack.id)}
              className={`hidden h-10 w-10 items-center justify-center rounded-2xl transition-all sm:flex ${favorites.includes(currentTrack.id) ? 'bg-accent-rose/15 text-accent-rose' : 'bg-white/5 text-text-muted hover:text-accent-rose'}`}
              aria-label="Ajouter aux favoris"
            >
              <Heart size={18} fill={favorites.includes(currentTrack.id) ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-[1.15] flex-col items-center gap-3">
          <div className="flex items-center gap-3 md:gap-5">
            <button 
              onClick={toggleShuffle}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${isShuffle ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:bg-white/10 hover:text-text-primary'}`}
              aria-label="Shuffle"
            >
              <Shuffle size={18} />
            </button>
            <button 
              onClick={playPrevious}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-text-primary transition-all hover:bg-white/10 hover:text-accent-cyan"
              aria-label="Titre précédent"
            >
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button 
              onClick={handlePlayPause}
              disabled={!currentTrack}
              className={`command-button flex h-14 w-14 items-center justify-center rounded-full text-bg-primary transition-transform ${currentTrack ? 'hover:scale-105 active:scale-95' : 'cursor-not-allowed opacity-45'}`}
              aria-label="Lecture pause"
            >
              {isPlaying ? (
                <Pause size={23} fill="currentColor" />
              ) : (
                <Play size={23} fill="currentColor" className="ml-1" />
              )}
            </button>
            <button 
              onClick={playNext}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-text-primary transition-all hover:bg-white/10 hover:text-accent-cyan"
              aria-label="Titre suivant"
            >
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button 
              onClick={toggleRepeatMode}
              className={`relative flex h-10 w-10 items-center justify-center rounded-2xl transition-all ${repeatMode !== 'none' ? 'bg-accent-cyan/15 text-accent-cyan' : 'text-text-muted hover:bg-white/10 hover:text-text-primary'}`}
              aria-label="Répétition"
            >
              <Repeat size={18} />
              {repeatMode === 'one' && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-cyan text-[9px] font-black text-bg-primary">1</span>}
            </button>
          </div>

          <div className="flex w-full max-w-xl items-center gap-3">
            <span className="w-10 text-right font-mono text-[11px] text-text-muted">{formatTime(currentTime)}</span>
            <div 
              className="relative h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10"
              onClick={handleProgressClick}
            >
              <div 
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet shadow-[0_0_20px_rgba(125,211,252,0.35)]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="w-10 font-mono text-[11px] text-text-muted">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
          <button 
            className={`relative flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${showQueue ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-primary'}`}
            onClick={() => setShowQueue(!showQueue)}
            aria-label="Afficher la file"
          >
            <ListMusic size={18} />
            {queue.length > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-accent-cyan px-1.5 py-0.5 text-[10px] font-black text-bg-primary">
                {queue.length}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-3 lg:flex">
            <Volume2 size={18} className="text-text-muted" />
            <div 
              className="relative h-2 w-28 cursor-pointer rounded-full bg-white/10"
              onClick={handleVolumeClick}
            >
              <div 
                className="absolute left-0 top-0 h-full rounded-full bg-text-primary"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>

          <button className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-text-muted transition-all hover:text-text-primary xl:flex" aria-label="Agrandir">
            <Maximize2 size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQueue && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute bottom-full right-0 mb-4"
          >
            <QueuePanel onClose={() => setShowQueue(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
