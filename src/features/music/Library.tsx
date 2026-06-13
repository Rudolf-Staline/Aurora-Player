import React, { useState } from 'react';
import { Play, FolderOpen, Loader2, Headphones, Music, Library as LibraryIcon } from 'lucide-react';
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
}

const mockAlbums: AlbumData[] = [
  { id: '1', title: 'Neon Nights', artist: 'Synthwave Dreamer', year: 2024, coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop' },
  { id: '2', title: 'Midnight City', artist: 'The Midnight', year: 2022, coverUrl: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?q=80&w=300&auto=format&fit=crop' },
  { id: '3', title: 'Cyberpunk Drive', artist: 'LazerHawk', year: 2023, coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=300&auto=format&fit=crop' },
  { id: '4', title: 'Future Funk', artist: 'Macross 82-99', year: 2021, coverUrl: 'https://images.unsplash.com/photo-1516280440502-31627c234b6f?q=80&w=300&auto=format&fit=crop' },
  { id: '5', title: 'Retrowave', artist: 'Kavinsky', year: 2013, coverUrl: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f57bb8?q=80&w=300&auto=format&fit=crop' },
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
            url: url,
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
      
      if (newTracks.length > 0) {
        toast.success(`${newTracks.length} titres ajoutés à la bibliothèque.`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
         setError(err.message || "Impossible de scanner le dossier.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayDemo = (album: AlbumData) => {
    const mockTrack: Track = {
      id: `demo-${album.id}`,
      title: `${album.title} - Intro`,
      artist: album.artist,
      album: album.title,
      artworkUrl: album.coverUrl,
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
    audioEngine.playAndStart(mockTrack);
  };

  const handlePlayTrack = (track: Track) => {
    audioEngine.playAndStart(track);
  };

  const totalDuration = localTracks.reduce((sum, track) => sum + (track.duration || 0), 0);
  const totalHours = Math.round(totalDuration / 3600);

  return (
    <div className="space-y-8">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-28 left-20 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <Headphones size={14} /> Bibliothèque locale
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
              Ta musique, rangée comme un vrai <span className="text-gradient-aurora">studio personnel</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Scanne tes dossiers, garde tes morceaux locaux, puis écoute sans friction avec le player flottant et la file d'attente.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button 
                onClick={handleScanFolder}
                disabled={isScanning}
                className="command-button inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <FolderOpen size={18} />}
                <span>{isScanning ? 'Scan en cours...' : 'Scanner un dossier'}</span>
              </button>
              <button 
                onClick={() => mockAlbums[0] && handlePlayDemo(mockAlbums[0])}
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-6 py-3 text-sm font-bold text-text-primary transition-colors hover:bg-white/12"
              >
                <Play size={18} fill="currentColor" /> Écouter une démo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black text-text-primary">{localTracks.length}</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Titres</p>
            </div>
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black text-text-primary">{totalHours || 0}h</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Durée</p>
            </div>
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-2xl font-black text-text-primary">Drive</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Sync</p>
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-3xl border border-accent-rose/20 bg-accent-rose/10 p-4 text-accent-rose">{error}</div>}

      {localTracks.length > 0 && (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Collection</p>
              <h2 className="text-2xl font-black text-text-primary">Titres locaux</h2>
            </div>
            <p className="text-sm text-text-muted">Double-clique sur un titre pour le lancer.</p>
          </div>
          <TrackList tracks={localTracks} onPlayContext={handlePlayTrack} />
        </section>
      )}

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">Découverte</p>
            <h2 className="text-2xl font-black text-text-primary">Featured mixes</h2>
          </div>
          <Music className="text-accent-violet" size={24} />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {mockAlbums.map((album) => (
            <article key={album.id} className="group surface-card overflow-hidden rounded-[1.75rem] p-3 transition-all hover:-translate-y-1 hover:border-white/20">
              <div className="relative aspect-square w-full overflow-hidden rounded-[1.35rem] bg-white/5 shadow-lg">
                <img src={album.coverUrl} alt={album.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-90" />
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayDemo(album);
                  }}
                  className="absolute bottom-4 right-4 flex h-12 w-12 translate-y-3 items-center justify-center rounded-full bg-text-primary text-bg-primary opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100"
                  aria-label={`Lire ${album.title}`}
                >
                  <Play size={20} fill="currentColor" className="ml-0.5" />
                </button>
                <div className="absolute bottom-4 left-4 rounded-full bg-black/35 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                  {album.year}
                </div>
              </div>
              <div className="flex items-start gap-3 px-1 py-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-accent-cyan">
                  <LibraryIcon size={17} />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-black text-text-primary">{album.title}</h3>
                  <p className="mt-1 truncate text-xs text-text-muted">{album.artist}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
