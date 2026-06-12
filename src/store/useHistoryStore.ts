import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud } from '../utils/auroraSync';

export interface HistoryEntry {
  trackId: string;
  title: string;
  artist: string;
  artworkUrl?: string;
  url?: string;
  playedAt: string;
  duration: number;
  source: 'local' | 'drive' | 'podcast';
}

interface HistoryState {
  history: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'playedAt'>) => void;
  clearHistory: () => void;
  syncHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      history: [],
      addEntry: (entry) => {
        set((state) => {
          const newEntry: HistoryEntry = { ...entry, playedAt: new Date().toISOString() };
          const newHistory = [newEntry, ...state.history].slice(0, 500); // Keep last 500
          
          // Debounced save
          setTimeout(() => saveToCloud('aurora_history.json', newHistory), 2000);
          
          return { history: newHistory };
        });
      },
      clearHistory: () => {
        set({ history: [] });
        saveToCloud('aurora_history.json', []);
      },
      syncHistory: async () => {
          // Placeholder for cloud load
      }
    }),
    {
      name: 'aurora-history',
    }
  )
);
