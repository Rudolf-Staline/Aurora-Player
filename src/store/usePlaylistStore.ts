import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './usePlayerStore';
import { usePlayerStore } from './usePlayerStore';
import { audioEngine } from '../core/audio_engine';
import { toast } from 'react-hot-toast';
import { saveToCloud, loadFromCloud } from '../utils/auroraSync';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  coverUrl?: string;
}

interface PlaylistState {
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => void;
  deletePlaylist: (id: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderTracks: (playlistId: string, newOrder: Track[]) => void;
  playPlaylist: (id: string) => void;
  syncFromCloud: () => Promise<void>;
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],

      createPlaylist: (name, description) => {
        set((state) => {
          const newPlaylist: Playlist = {
            id: `playlist-${Date.now()}`,
            name,
            description,
            tracks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          return { playlists: [...state.playlists, newPlaylist] };
        });
      },

      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
        }));
      },

      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const alreadyExists = p.tracks.some(t => t.id === track.id);
              if (alreadyExists) {
                toast.error(`"${track.title}" is already in this playlist.`);
                return p;
              }
              return { 
                ...p, 
                tracks: [...p.tracks, track],
                updatedAt: new Date().toISOString(),
                coverUrl: p.coverUrl || track.artworkUrl
              };
            }
            return p;
          }),
        }));
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
         set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              const newTracks = p.tracks.filter(t => t.id !== trackId);
              return { 
                ...p, 
                tracks: newTracks,
                updatedAt: new Date().toISOString(),
                // Recompute coverUrl if we deleted the first track and there was one
                coverUrl: newTracks.length > 0 ? newTracks[0].artworkUrl : undefined
              };
            }
            return p;
          }),
        }));
      },

      reorderTracks: (playlistId, newOrder) => {
         set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id === playlistId) {
              return { 
                ...p, 
                tracks: newOrder,
                updatedAt: new Date().toISOString(),
                coverUrl: newOrder.length > 0 ? newOrder[0].artworkUrl : p.coverUrl
              };
            }
            return p;
          }),
        }));
      },

      playPlaylist: (id) => {
         const playlist = get().playlists.find(p => p.id === id);
         if (!playlist || playlist.tracks.length === 0) return;
         
         const player = usePlayerStore.getState();
         player.setQueue(playlist.tracks);
         audioEngine.playAndStart(playlist.tracks[0]);
      },
      
      syncFromCloud: async () => {
         try {
             const data = await loadFromCloud('aurora_playlists.json');
             if (data && Array.isArray(data)) {
                 // Simple strategy: cloud replaces local if loaded successfully
                 // In a production app you'd merge based on updatedAt timestamps
                 set({ playlists: data });
             }
         } catch (e) {
             console.error("Failed to load playlists from cloud", e);
         }
      }
    }),
    {
      name: 'aurora-playlists',
    }
  )
);

// Auto-save to cloud on changes
let saveTimeout: ReturnType<typeof setTimeout>;
usePlaylistStore.subscribe((state, prevState) => {
   if (state.playlists !== prevState.playlists && state.playlists.length > 0) {
       clearTimeout(saveTimeout);
       saveTimeout = setTimeout(() => {
           saveToCloud('aurora_playlists.json', state.playlists);
       }, 2000);
   }
});
