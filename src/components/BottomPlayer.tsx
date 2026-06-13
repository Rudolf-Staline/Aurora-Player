import React, { useCallback, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2, Repeat, Shuffle, Heart, ListMusic, Music2 } from 'lucide-react';
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

  if (!currentTrack) {
    return (
      <motion.div
        initial={animationsEnabled ? { y: 24, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none fixed bottom-4 right-4 z-50 hidden md:block"
      >
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border-premium bg-bg-elevated/95 px-4 py-3 text-text-muted shadow-deep backdrop-blur-md">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary text-[#161310]">
            <Music2 size={16} />
          </span>
          <div className="pr-1">
            <p className="eyebrow">Player en veille</p>
            <p className="text-xs">Choisis un titre pour afficher les contrôles.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={animationsEnabled ? { y: 72, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 32 }}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 md:inset-x-5"
    >
      <div className="pointer-events-auto mx-auto flex max-w-[980px] items-center gap-3 rounded-[1.5rem] border-premium-strong bg-bg-elevated/96 p-2 shadow-deep backdrop-blur-xl">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[1.05rem] border-premium bg-bg-secondary">
          {currentTrack.artworkUrl ? (
            <img src={currentTrack.artworkUrl} alt={currentTrack.album} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-secondary text-accent-primary">
              <Music2 size={18} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-[1.1]">
          <p className="eyebrow">
            {isPlaying ? 'Lecture' : 'En pause'}
          </p>
          <h4 className="line-clamp-1 text-sm font-semibold tracking-[-0.01em] text-text-primary">
            {currentTrack.title}
          </h4>
          <p className="line-clamp-1 text-xs text-text-muted">{currentTrack.artist}</p>
        </div>

        <div className="hidden min-w-[260px] flex-col gap-2 md:flex">
          <div className="flex items-center justify-center gap-2">
            <button onClick={toggleShuffle} className={`rounded-full p-2 transition-colors ${isShuffle ? 'text-accent-primary' : 'text-text-muted hover:bg-white/[0.05] hover:text-text-primary'}`} aria-label="Shuffle">
              <Shuffle size={16} />
            </button>
            <button onClick={playPrevious} className="rounded-full p-2 text-text-primary transition-colors hover:bg-white/[0.05]" aria-label="Titre précédent">
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button onClick={handlePlayPause} className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-primary text-[#161310] shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-[filter] hover:brightness-105" aria-label="Lecture pause">
              {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={playNext} className="rounded-full p-2 text-text-primary transition-colors hover:bg-white/[0.05]" aria-label="Titre suivant">
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button onClick={toggleRepeatMode} className={`relative rounded-full p-2 transition-colors ${repeatMode !== 'none' ? 'text-accent-primary' : 'text-text-muted hover:bg-white/[0.05] hover:text-text-primary'}`} aria-label="Répétition">
              <Repeat size={16} />
              {repeatMode === 'one' && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-secondary text-[9px] font-bold text-[#161310]">1</span>}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-9 text-right font-mono text-[10px] text-text-muted">{formatTime(currentTime)}</span>
            <div className="relative h-1 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/[0.08]" onClick={handleProgressClick}>
              <div className="absolute left-0 top-0 h-full rounded-full bg-accent-primary" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="w-9 font-mono text-[10px] text-text-muted">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <button onClick={handlePlayPause} className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary text-[#161310] md:hidden" aria-label="Lecture pause mobile">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={() => toggleFavorite(currentTrack.id)} className={`hidden rounded-full p-2 transition-colors sm:block ${favorites.includes(currentTrack.id) ? 'text-danger' : 'text-text-muted hover:bg-white/[0.05] hover:text-danger'}`} aria-label="Ajouter aux favoris">
            <Heart size={17} fill={favorites.includes(currentTrack.id) ? 'currentColor' : 'none'} />
          </button>
          <button className={`relative rounded-full p-2 transition-colors ${showQueue ? 'text-accent-primary' : 'text-text-muted hover:bg-white/[0.05] hover:text-text-primary'}`} onClick={() => setShowQueue(!showQueue)} aria-label="Afficher la file">
            <ListMusic size={17} />
            {queue.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-accent-secondary px-1.5 py-0.5 text-[10px] font-bold text-[#161310]">{queue.length}</span>}
          </button>
          <div className="hidden items-center gap-2 lg:flex">
            <Volume2 size={16} className="text-text-muted" />
            <div className="relative h-1 w-20 cursor-pointer rounded-full bg-white/[0.08]" onClick={handleVolumeClick}>
              <div className="absolute left-0 top-0 h-full rounded-full bg-accent-primary" style={{ width: `${volume * 100}%` }} />
            </div>
          </div>
          <button className="hidden rounded-full p-2 text-text-muted transition-colors hover:bg-white/[0.05] hover:text-text-primary xl:block" aria-label="Agrandir">
            <Maximize2 size={17} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQueue && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.18 }} className="pointer-events-auto absolute bottom-full right-0 mb-3">
            <QueuePanel onClose={() => setShowQueue(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
