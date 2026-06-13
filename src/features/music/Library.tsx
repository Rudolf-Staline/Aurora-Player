import React, { useState } from 'react';
import { Play, FolderOpen, Loader2, Music, ArrowUpRight, Disc3, Radio, Headphones } from 'lucide-react';
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
    <div className="space-y-10 pb-8">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-black/10 bg-[#fbf7f0] p-6 shadow-[0_30px_80px_rgba(23,23,23,0.10)] md:p-10 lg:p-12">
        <div className="absolute right-0 top-0 hidden h-full w-[42%] border-l border-black/10 bg-[#171717] lg:block" />
        <div className="relative grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
          <div className="flex min-h-[520px] flex-col justify-between">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-12 bg-text-primary" />
                <span className="font-mono text-xs uppercase tracking-[0.35em] text-text-muted">Omed editorial audio</span>
              </div>
              <h1 className="max-w-4xl text-[clamp(3.25rem,8vw,7.6rem)] font-black leading-[0.86] tracking-[-0.08em] text-text-primary">
                Écouter mieux, sans bruit visuel.
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-text-muted">
                Une bibliothèque sobre pour tes fichiers locaux, Drive et sessions audio. Moins d’effets, plus de concentration.
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <button 
                onClick={handleScanFolder}
                disabled={isScanning}
                className="command-button inline-flex items-center justify-center gap-3 rounded-full px-7 py-4 text-sm font-black uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <FolderOpen size={18} />}
                {isScanning ? 'Scan en cours' : 'Scanner un dossier'}
              </button>
              <button 
                onClick={() => mockAlbums[0] && handlePlayDemo(mockAlbums[0])}
                className="inline-flex items-center justify-center gap-3 rounded-full border border-black/15 bg-transparent px-7 py-4 text-sm font-black uppercase tracking-[0.16em] text-text-primary transition-colors hover:bg-black hover:text-[#f4efe7]"
              >
                <Play size={17} fill="currentColor" /> Démo
              </button>
            </div>
          </div>

          <aside className="relative rounded-[2rem] bg-[#171717] p-6 text-[#f4efe7] lg:rounded-none lg:bg-transparent lg:p-0">
            <div className="grid h-full grid-rows-[1fr_auto] gap-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[#f4efe7] p-4 text-[#171717] shadow-2xl lg:ml-8 lg:mt-4">
                <img src={mockAlbums[0].coverUrl} alt="Featured mix" className="h-72 w-full rounded-[1.35rem] object-cover grayscale-[20%] md:h-80 lg:h-[350px]" />
                <div className="mt-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#776b5d]">Featured issue</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Morning Notes</h2>
                    <p className="mt-2 text-sm text-[#756c61]">A quiet mix for early work.</p>
                  </div>
                  <button onClick={() => handlePlayDemo(mockAlbums[0])} className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full bg-[#171717] text-[#f4efe7]">
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 lg:ml-8">
                <div className="rounded-[1.4rem] border border-white/15 bg-white/[0.08] p-4">
                  <p className="text-3xl font-black text-[#f4efe7]">{localTracks.length}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#c7bcae]">Titres</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/15 bg-white/[0.08] p-4">
                  <p className="text-3xl font-black text-[#f4efe7]">{totalHours || 0}h</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#c7bcae]">Audio</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/15 bg-white/[0.08] p-4">
                  <p className="text-3xl font-black text-[#f4efe7]">{latestTracks.length}</p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[#c7bcae]">Récents</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {error && <div className="rounded-[1.5rem] border border-accent-rose/30 bg-accent-rose/10 p-4 text-accent-rose">{error}</div>}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-black/10 bg-[#171717] p-7 text-[#f4efe7] shadow-[0_24px_64px_rgba(23,23,23,0.16)]">
          <div className="mb-8 flex items-center justify-between">
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-[#c7bcae]">Aujourd’hui</p>
            <Radio size={20} className="text-[#c7bcae]" />
          </div>
          <h2 className="text-4xl font-black leading-none tracking-[-0.06em]">Un espace calme pour ranger et reprendre.</h2>
          <p className="mt-5 text-sm leading-7 text-[#c7bcae]">
            L’accueil devient une page de travail : une action principale, quelques chiffres, puis tes sons. Pas de décoration inutile.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] border border-white/10 p-4">
              <Disc3 size={20} className="mb-4 text-[#c7bcae]" />
              <p className="text-sm font-bold">Lecture locale</p>
              <p className="mt-1 text-xs text-[#c7bcae]">Fichiers audios personnels.</p>
            </div>
            <div className="rounded-[1.25rem] border border-white/10 p-4">
              <Headphones size={20} className="mb-4 text-[#c7bcae]" />
              <p className="text-sm font-bold">Sessions longues</p>
              <p className="mt-1 text-xs text-[#c7bcae]">UI plus douce et lisible.</p>
            </div>
          </div>
        </div>

        {localTracks.length > 0 ? (
          <section className="rounded-[2rem] border border-black/10 bg-[#fbf7f0] p-5 shadow-[0_24px_60px_rgba(23,23,23,0.08)] md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 border-b border-black/10 pb-4 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-text-muted">Collection</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-text-primary">Titres locaux</h2>
              </div>
              <p className="text-sm text-text-muted">Double-clique pour lancer un titre.</p>
            </div>
            <TrackList tracks={localTracks} onPlayContext={handlePlayTrack} />
          </section>
        ) : (
          <section className="flex min-h-[420px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-black/15 bg-[#fbf7f0] p-8 text-center shadow-[0_24px_60px_rgba(23,23,23,0.06)]">
            <Music size={44} className="mb-5 text-text-muted" />
            <h2 className="text-3xl font-black tracking-[-0.05em] text-text-primary">Aucune musique locale</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">Scanne un dossier pour transformer cette zone en bibliothèque éditoriale.</p>
            <button onClick={handleScanFolder} disabled={isScanning} className="command-button mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-black uppercase tracking-[0.16em] disabled:opacity-60">
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <FolderOpen size={16} />}
              Scanner
            </button>
          </section>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.28em] text-text-muted">Sélection</p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.06em] text-text-primary">Mixes éditoriaux</h2>
          </div>
          <ArrowUpRight className="text-text-muted" size={24} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {mockAlbums.map((album, index) => (
            <article key={album.id} className={`group overflow-hidden rounded-[2rem] border border-black/10 bg-[#fbf7f0] shadow-[0_20px_54px_rgba(23,23,23,0.08)] transition-transform hover:-translate-y-1 ${index === 0 ? 'xl:col-span-1' : ''}`}>
              <div className="relative aspect-[4/5] overflow-hidden border-b border-black/10">
                <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover grayscale-[18%] transition-transform duration-700 group-hover:scale-105" />
                <button onClick={() => handlePlayDemo(album)} className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#171717] text-[#f4efe7] opacity-0 shadow-xl transition-all group-hover:opacity-100" aria-label={`Lire ${album.title}`}>
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                </button>
              </div>
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">
                  <span>{album.mood}</span>
                  <span>{album.year}</span>
                </div>
                <h3 className="text-2xl font-black leading-none tracking-[-0.05em] text-text-primary">{album.title}</h3>
                <p className="mt-2 text-sm text-text-muted">{album.artist}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
