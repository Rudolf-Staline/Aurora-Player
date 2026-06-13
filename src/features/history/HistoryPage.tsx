import React from 'react';
import { History, Trash2, Clock, Radio } from 'lucide-react';
import { useHistoryStore } from '../../store/useHistoryStore';
import { TrackList } from '../music/TrackList';
import { type Track } from '../../store/usePlayerStore';
import { audioEngine } from '../../core/audio_engine';
import { toast } from 'react-hot-toast';

export const HistoryPage: React.FC = () => {
  const { history, clearHistory } = useHistoryStore();

  const handlePlayHistory = (track: Track) => {
    if (!track.url) {
      toast.error('Impossible de lire ce titre : URL absente de l’historique.');
      return;
    }
    audioEngine.playAndStart(track);
  };

  const tracks: Track[] = history.map((entry, index) => ({
    id: `${entry.trackId}-${index}`,
    title: entry.title,
    artist: entry.artist,
    album: entry.source === 'podcast' ? 'Podcast Episode' : (entry.source === 'drive' ? 'Google Drive' : 'Local File'),
    artworkUrl: entry.artworkUrl,
    url: entry.url || '',
    duration: entry.duration,
  }));

  const driveCount = history.filter(item => item.source === 'drive').length;
  const podcastCount = history.filter(item => item.source === 'podcast').length;

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card-strong relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-accent-primary/[0.05] blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border-premium bg-bg-secondary px-3 py-1 eyebrow">
              <History size={14} /> Historique
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-text-primary md:text-6xl">
              Ce que tu as écouté, <span className="text-gradient-aurora">sans perdre le fil</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Reprends un morceau, un épisode ou un fichier Drive depuis ton activité récente.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:w-[28rem]">
            <div className="rounded-3xl border-premium bg-bg-secondary p-4">
              <p className="text-3xl font-semibold text-text-primary">{history.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Total</p>
            </div>
            <div className="rounded-3xl border-premium bg-bg-secondary p-4">
              <p className="text-3xl font-semibold text-text-primary">{driveCount}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Drive</p>
            </div>
            <div className="rounded-3xl border-premium bg-bg-secondary p-4">
              <p className="text-3xl font-semibold text-text-primary">{podcastCount}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Podcasts</p>
            </div>
          </div>
        </div>
      </section>

      {history.length === 0 ? (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/[0.06] text-text-muted">
            <Clock size={38} />
          </div>
          <h2 className="text-2xl font-black text-text-primary">Aucun historique</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">Écoute de la musique ou un podcast : les dernières lectures apparaîtront ici.</p>
        </section>
      ) : (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Reprendre</p>
              <h2 className="text-2xl font-black text-text-primary">Lectures récentes</h2>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Supprimer tout l’historique d’écoute ?')) {
                  clearHistory();
                  toast.success('Historique supprimé');
                }
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-accent-rose/20 bg-accent-rose/10 px-4 py-2 text-sm font-bold text-accent-rose transition-colors hover:bg-accent-rose/20"
            >
              <Trash2 size={16} /> Vider l’historique
            </button>
          </div>
          <TrackList tracks={tracks} onPlayContext={handlePlayHistory} />
        </section>
      )}

      {history.length > 0 && (
        <div className="surface-card flex items-center gap-3 rounded-3xl p-4 text-sm text-text-muted">
          <Radio size={18} className="text-accent-cyan" />
          L’historique garde les URL de lecture connues. Certains fichiers Drive peuvent demander une reconnexion si le token a expiré.
        </div>
      )}
    </div>
  );
};
