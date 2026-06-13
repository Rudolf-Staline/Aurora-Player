import { create } from 'zustand';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl?: string;
  url: string;
  duration?: number;
}

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
  queue: Track[];
  localTracks: Track[];
  repeatMode: 'none' | 'all' | 'one';
  isShuffle: boolean;
  
  // Actions
  playTrack: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleRepeatMode: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (newOrder: Track[]) => void;
  clearQueue: () => void;
  setQueue: (tracks: Track[]) => void;
  setLocalTracks: (tracks: Track[]) => void;
}

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const getRandomTrack = (tracks: Track[], currentTrackId?: string): Track | null => {
  if (tracks.length === 0) return null;
  if (tracks.length === 1) return tracks[0];

  const candidates = tracks.filter((track) => track.id !== currentTrackId);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? tracks[0];
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  progress: 0,
  currentTime: 0,
  duration: 0,
  queue: [],
  localTracks: [],
  repeatMode: 'none',
  isShuffle: false,

  playTrack: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0, progress: 0 }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  setVolume: (volume) => set({ volume: clamp(volume, 0, 1) }),
  setProgress: (progress) => set({ progress: clamp(progress, 0, 1) }),
  setCurrentTime: (time) => set({ currentTime: Math.max(0, Number.isFinite(time) ? time : 0) }),
  setDuration: (duration) => set({ duration: Math.max(0, Number.isFinite(duration) ? duration : 0) }),
  addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
  removeFromQueue: (trackId) => set((state) => ({ queue: state.queue.filter(t => t.id !== trackId) })),
  reorderQueue: (newOrder) => set({ queue: newOrder }),
  clearQueue: () => set({ queue: [] }),
  setQueue: (tracks) => set({ queue: tracks }),
  setLocalTracks: (tracks) => set({ localTracks: tracks }),
  playNext: () => {
    const { currentTrack, queue, localTracks, isShuffle, repeatMode, playTrack, removeFromQueue, pause } = get();
    
    if (repeatMode === 'one' && currentTrack) {
      playTrack(currentTrack);
      return;
    }

    // Play from explicit queue first
    if (queue.length > 0) {
      const nextFromQueue = queue[0];
      removeFromQueue(nextFromQueue.id);
      playTrack(nextFromQueue);
      return;
    }

    if (!currentTrack || localTracks.length === 0) {
      pause();
      return;
    }

    if (isShuffle) {
      const randomTrack = getRandomTrack(localTracks, currentTrack.id);
      if (randomTrack) playTrack(randomTrack);
      return;
    }

    const currentIndex = localTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) {
      playTrack(localTracks[0]);
      return;
    }

    let nextIndex = currentIndex + 1;
    
    if (nextIndex >= localTracks.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        pause();
        return;
      }
    }
    playTrack(localTracks[nextIndex]);
  },
  playPrevious: () => {
    const { currentTrack, localTracks, currentTime, playTrack } = get();
    if (!currentTrack || localTracks.length === 0) return;

    // If we've played more than 3 seconds, previous restarts the current track
    if (currentTime > 3) {
      playTrack(currentTrack);
      return;
    }

    const currentIndex = localTracks.findIndex(t => t.id === currentTrack.id);
    if (currentIndex === -1) {
      playTrack(localTracks[0]);
      return;
    }

    const prevIndex = currentIndex === 0 ? localTracks.length - 1 : currentIndex - 1;
    playTrack(localTracks[prevIndex]);
  },
  toggleShuffle: () => set((state) => ({ isShuffle: !state.isShuffle })),
  toggleRepeatMode: () => set((state) => {
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),
}));
