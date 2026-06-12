import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  trackIds: string[];
  episodeIds: string[];
  podcastIds: number[];
  updatedAt: string;
  toggleTrackFavorite: (id: string) => void;
  toggleEpisodeFavorite: (id: string) => void;
  loadFromCloud: () => Promise<void>;
  saveToCloud: () => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      trackIds: [],
      episodeIds: [],
      podcastIds: [],
      updatedAt: new Date().toISOString(),

      toggleTrackFavorite: (id) => {
        set((state) => {
          const isFav = state.trackIds.includes(id);
          const newFavs = isFav ? state.trackIds.filter(fid => fid !== id) : [...state.trackIds, id];
          return { trackIds: newFavs, updatedAt: new Date().toISOString() };
        });
      },

      toggleEpisodeFavorite: (id) => {
        set((state) => {
          const isFav = state.episodeIds.includes(id);
          const newFavs = isFav ? state.episodeIds.filter(fid => fid !== id) : [...state.episodeIds, id];
          return { episodeIds: newFavs, updatedAt: new Date().toISOString() };
        });
      },

      loadFromCloud: async () => {
         // Placeholder for Drive sync load
      },

      saveToCloud: async () => {
         // Placeholder for Drive sync save
      }
    }),
    {
      name: 'aurora_favorites',
    }
  )
);
