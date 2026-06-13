import React from 'react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { TrackList } from '../music/TrackList';
import { Heart, Sparkles } from 'lucide-react';
import { audioEngine } from '../../core/audio_engine';

export const FavoritesPage: React.FC = () => {
  const { localTracks } = usePlayerStore();
  const { trackIds: favorites, episodeIds } = useFavoritesStore();
  const favoriteTracks = localTracks.filter(track => favorites.includes(track.id));

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-rose/20 blur-3xl" />
        <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-accent-violet/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-rose">
              <Heart size={14} fill="currentColor" /> Collection personnelle
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
              Tes favoris, gardés au même <span className="text-gradient-aurora">endroit</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Retrouve rapidement les titres que tu as aimés. Les épisodes podcast favoris sont comptés ici et seront reliés à une vue dédiée plus tard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-72">
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-3xl font-black text-text-primary">{favorites.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Titres</p>
            </div>
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-3xl font-black text-text-primary">{episodeIds.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Épisodes</p>
            </div>
          </div>
        </div>
      </section>

      {favoriteTracks.length > 0 ? (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          <div className="mb-5 flex items-end justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Lecture rapide</p>
              <h2 className="text-2xl font-black text-text-primary">Titres favoris</h2>
            </div>
            <Sparkles className="text-accent-violet" size={22} />
          </div>
          <TrackList tracks={favoriteTracks} onPlayContext={(track: Track) => audioEngine.playAndStart(track)} />
        </section>
      ) : (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-accent-rose/10 text-accent-rose">
            <Heart size={36} />
          </div>
          <h2 className="text-2xl font-black text-text-primary">Aucun favori pour l’instant</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">
            Ajoute un cœur à un titre ou à un épisode : il apparaîtra ici pour un accès rapide.
          </p>
        </section>
      )}
    </div>
  );
};
