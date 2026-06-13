import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, FolderOpen, Loader2, Music, ArrowUpRight, Disc3, Radio, Headphones, Cloud } from 'lucide-react';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';
import { toast } from 'react-hot-toast';
import { scanDirectory, getFileMetadata } from '../../utils/fileScanner';
import { TrackList } from './TrackList';
import { audioEngine } from '../../core/audio_engine';

interface AlbumData {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  mood: string;
}

const mockAlbums: AlbumData[] = [
  { id: '1', title: 'Morning Notes', artist: 'Editorial Sessions', year: 2026, mood: 'Focus', coverUrl: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?q=80&w=500&auto=format&fit=crop' },
  { id: '2', title: 'Quiet Work', artist: 'Omed Curated', year: 2026, mood: 'Deep work', coverUrl: 'https://images.unsplash.com/photo-1516280440502-31627c234b6f?q=80&w=500&auto=format&fit=crop' },
  { id: '3', title: 'Late Library', artist: 'Soft Archive', year: 2025, mood: 'Study', coverUrl: 'https://images.unsplash.com/photo-1525362081669-2b476bb628c3?q=80&w=500&auto=format&fit=crop' },
  { id: '4', title: 'Analog Walk', artist: 'Field Notes', year: 2025, mood: 'Walk', coverUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=500&auto=format&fit=crop' },
];

export const Library: React.FC = () => {
  const navigate = useNavigate();
  const { localTracks, setLocalTracks } = usePlayerStore();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');

  const handleScanFolder = async () => {
    try {
      if (!('showDirectoryPicker' in window)) {
        setError("Ton navigateur ne prend pas en charge l'accès aux dossiers locaux.");
        return;
      }
      
      const dirHandle = await (window as unknown as { showDirectoryPicker: () => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker();
      setIsScanning(true);
      setError('');
      
      const files = await scanDirectory(dirHandle);
      const newTracks: Track[] = await Promise.all(
        files.map(async (file, index) => {
          const metadata = await getFileMetadata(file);
          const url = URL.createObjectURL(file);
          return {
            id: `local-${index}-${file.name}`,
            title: metadata.title,
            artist: metadata.artist,
            album: metadata.album,
            artworkUrl: metadata.artworkUrl,
            url,
            duration: metadata.duration,
          };
        })
      );

      const existingTracks = usePlayerStore.getState().localTracks;
      const allTracksMap = new Map<string, Track>();
      existingTracks.forEach(t => allTracksMap.set(`${t.title}-${t.artist}`, t));
      newTracks.forEach(t => allTracksMap.set(`${t.title}-${t.artist}`, t));
      const merged = Array.from(allTracksMap.values());
      setLocalTracks(merged);
      
      if (newTracks.length > 0) toast.success(`${newTracks.length} titres ajoutés à la bibliothèque.`);
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Impossible de scanner le dossier.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayDemo = (album: AlbumData) => {
    const mockTrack: Track = {
      id: `demo-${album.id}`,
      title: `${album.title} — excerpt`,
      artist: album.artist,
      album: album.title,
      artworkUrl: album.coverUrl,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
    audioEngine.playAndStart(mockTrack);
  };

  const handlePlayTrack = (track: Track) => audioEngine.playAndStart(track);
  const totalDuration = localTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const totalHours = Math.round(totalDuration / 3600);
  const latestTracks = localTracks.slice(0, 3);

  return (
    <div className="space-y-12 pb-8">
      <section className="surface-card-strong shadow-deep relative overflow-hidden rounded-[2.5rem] p-6 md:p-10 lg:p-12">
        <div className="aurora-ring pointer-events-none absolute -right-24 -top-24 hidden h-80 w-80 rounded-full opacity-40 lg:block" />
        <div className="absolute right-0 top-0 hidden h-full w-[42%] border-l border-premium bg-bg-primary/60 lg:block" />
        <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div className="flex min-h-[520px] flex-col justify-between">
            <div>
              <p className="eyebrow mb-8">Omed Player</p>
              <h1 className="max-w-4xl text-[clamp(3rem,7vw,6.4rem)] font-semibold leading-[0.9] tracking-tight text-text-primary">
                Écouter avec intention.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-text-muted">
                Une bibliothèque audio calme, connectée et pensée pour les longues sessions.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                onClick={handleScanFolder}
                disabled={isScanning}
                className="btn-primary inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <FolderOpen size={18} />}
                {isScanning ? 'Scan en cours' : 'Scanner un dossier'}
              </button>
              <button
                onClick={() => navigate('/drive')}
                className="btn-secondary inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.16em] text-text-primary transition-colors"
              >
                <Cloud size={17} /> Ouvrir Drive
              </button>
            </div>
          </div>

          <aside className="relative lg:p-0">
            <div className="grid h-full grid-rows-[1fr_auto] gap-6">
              <div className="surface-secondary border-premium relative overflow-hidden rounded-[2rem] p-4 shadow-deep lg:ml-8 lg:mt-4">
                <img src={mockAlbums[0].coverUrl} alt="Featured mix" className="h-72 w-full rounded-[1.35rem] object-cover md:h-80 lg:h-[350px]" />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Featured issue</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Morning Notes</h2>
                    <p className="mt-2 text-sm text-text-muted">A quiet mix for early work.</p>
                  </div>
                  <button onClick={() => handlePlayDemo(mockAlbums[0])} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-primary text-bg-primary transition-transform hover:scale-105">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:ml-8">
                <div className="surface-secondary border-premium rounded-[1.4rem] p-4">
                  <p className="text-3xl font-semibold text-text-primary">{localTracks.length}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">Titres</p>
                </div>
                <div className="surface-secondary border-premium rounded-[1.4rem] p-4">
                  <p className="text-3xl font-semibold text-text-primary">{totalHours || 0}h</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">Audio</p>
                </div>
                <div className="surface-secondary border-premium rounded-[1.4rem] p-4">
                  <p className="text-3xl font-semibold text-text-primary">{latestTracks.length}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">Récents</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {error && <div className="rounded-[1.5rem] border border-danger/30 bg-danger/10 p-4 text-danger">{error}</div>}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card shadow-deep rounded-[2rem] p-7">
          <div className="mb-8 flex items-center justify-between">
            <p className="eyebrow">Aujourd’hui</p>
            <Radio size={20} className="text-accent-primary" />
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-text-primary">Un espace calme pour ranger et reprendre.</h2>
          <p className="mt-5 text-sm leading-7 text-text-muted">
            L’accueil devient une page de travail : une action principale, quelques chiffres, puis tes sons. Pas de décoration inutile.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="surface-secondary border-premium rounded-[1.25rem] p-4">
              <Disc3 size={20} className="mb-4 text-accent-primary" />
              <p className="text-sm font-semibold text-text-primary">Lecture locale</p>
              <p className="mt-1 text-xs text-text-muted">Fichiers audios personnels.</p>
            </div>
            <div className="surface-secondary border-premium rounded-[1.25rem] p-4">
              <Headphones size={20} className="mb-4 text-accent-primary" />
              <p className="text-sm font-semibold text-text-primary">Sessions longues</p>
              <p className="mt-1 text-xs text-text-muted">UI plus douce et lisible.</p>
            </div>
          </div>
        </div>

        {localTracks.length > 0 ? (
          <section className="surface-card shadow-deep rounded-[2rem] p-5 md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-premium pb-4 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow">Collection</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Titres locaux</h2>
              </div>
              <p className="text-sm text-text-muted">Double-clique pour lancer un titre.</p>
            </div>
            <TrackList tracks={localTracks} onPlayContext={handlePlayTrack} />
          </section>
        ) : (
          <section className="surface-card border-premium-strong shadow-deep flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border-dashed p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-premium bg-white/[0.03] text-accent-primary">
              <Music size={30} />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Aucune musique locale</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">Scanne un dossier pour transformer cette zone en bibliothèque éditoriale.</p>
            <button onClick={handleScanFolder} disabled={isScanning} className="btn-primary mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] disabled:opacity-60">
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
              Scanner
            </button>
          </section>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-premium pb-4">
          <div>
            <p className="eyebrow">Sélection</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-text-primary">Mixes éditoriaux</h2>
          </div>
          <ArrowUpRight className="text-accent-primary" size={24} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {mockAlbums.map((album, index) => (
            <article key={album.id} className={`group surface-card shadow-deep overflow-hidden rounded-[2rem] transition-all duration-300 hover:-translate-y-1 hover:border-premium-strong ${index === 0 ? 'xl:col-span-1' : ''}`}>
              <div className="relative aspect-[4/5] overflow-hidden border-b border-premium">
                <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/70 via-transparent to-transparent" />
                <button onClick={() => handlePlayDemo(album)} className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-bg-primary opacity-0 shadow-deep transition-all group-hover:opacity-100" aria-label={`Lire ${album.title}`}>
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  <span className="text-accent-primary">{album.mood}</span>
                  <span>{album.year}</span>
                </div>
                <h3 className="text-2xl font-semibold leading-none tracking-tight text-text-primary">{album.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{album.artist}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-premium pb-4">
          <div>
            <p className="eyebrow">Modes d’écoute</p>
            <h2 className="mt-2 text-4xl font-semibold tracking-tight text-text-primary">Tes sources audio</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Disc3, label: 'Local', desc: 'Fichiers du disque' },
            { icon: FolderOpen, label: 'Drive', desc: 'Stockage cloud' },
            { icon: Radio, label: 'Podcasts', desc: 'Épisodes & flux' },
            { icon: Headphones, label: 'Playlists', desc: 'Tes sélections' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="surface-card border-premium group rounded-[1.6rem] p-5 transition-colors hover:bg-white/[0.04]">
              <Icon size={22} className="mb-5 text-accent-primary" />
              <p className="text-lg font-semibold text-text-primary">{label}</p>
              <p className="mt-1 text-xs text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
