import React from 'react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { TrackList } from '../music/TrackList';
import { Heart } from 'lucide-react';
import { audioEngine } from '../../core/audio_engine';

export const FavoritesPage: React.FC = () => {
  const { localTracks } = usePlayerStore();
  const { trackIds: favorites, episodeIds } = useFavoritesStore();
  const favoriteTracks = localTracks.filter(track => favorites.includes(track.id));

  return (
    <div className="space-y-10 pb-10">
      <section className="surface-card-strong shadow-deep relative overflow-hidden rounded-[2.25rem] p-8 md:p-12">
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-2">
              <Heart size={13} fill="currentColor" className="text-danger" /> Collection personnelle
            </p>
            <h1 className="max-w-3xl text-[clamp(2.5rem,5vw,4.5rem)] font-semibold leading-[0.95] tracking-tight text-text-primary">
              Tes favoris, au même endroit.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-text-muted">
              Retrouve les titres que tu as aimés. Les épisodes favoris sont comptés ici et seront reliés à une vue dédiée plus tard.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-72">
            <div className="surface-secondary rounded-2xl border-premium p-5">
              <p className="text-3xl font-semibold text-text-primary">{favorites.length}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">Titres</p>
            </div>
            <div className="surface-secondary rounded-2xl border-premium p-5">
              <p className="text-3xl font-semibold text-text-primary">{episodeIds.length}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">Épisodes</p>
            </div>
          </div>
        </div>
      </section>

      {favoriteTracks.length > 0 ? (
        <section className="surface-card rounded-[2.25rem] p-5 md:p-7">
          <div className="mb-6 flex items-end justify-between border-b border-premium pb-5">
            <div>
              <p className="eyebrow">Lecture rapide</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">Titres favoris</h2>
            </div>
          </div>
          <TrackList tracks={favoriteTracks} onPlayContext={(track: Track) => audioEngine.playAndStart(track)} />
        </section>
      ) : (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2.25rem] p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border-premium bg-white/[0.03] text-danger">
            <Heart size={34} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Aucun favori pour l’instant</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">
            Ajoute un cœur à un titre ou à un épisode : il apparaîtra ici pour un accès rapide.
          </p>
        </section>
      )}
    </div>
  );
};
