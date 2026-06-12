import React, { useState } from 'react';
import { Play, FolderOpen, Loader2 } from 'lucide-react';
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
        setError("Your browser does not support the File System Access API.");
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
      // Add existing first
      existingTracks.forEach(t => allTracksMap.set(`${t.title}-${t.artist}`, t));
      // Overwrite/Add new ones (which have durations now!)
      newTracks.forEach(t => allTracksMap.set(`${t.title}-${t.artist}`, t));
      
      const merged = Array.from(allTracksMap.values());
      setLocalTracks(merged);
      
      if (newTracks.length > 0) {
        toast.success(`${newTracks.length} tracks processed.`);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
         setError(err.message || "Failed to scan folder.");
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
      // Using a free sample audio URL
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
    audioEngine.playAndStart(mockTrack);
  };

  const handlePlayTrack = (track: Track) => {
    audioEngine.playAndStart(track);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-text-primary">Music Library</h1>
          <p className="text-sm text-text-muted mt-1">Your local collection</p>
        </div>
        <button 
          onClick={handleScanFolder}
          disabled={isScanning}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-text-primary px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isScanning ? <Loader2 size={18} className="animate-spin" /> : <FolderOpen size={18} />}
          <span>{isScanning ? 'Scanning...' : 'Scan Folder'}</span>
        </button>
      </div>

      {error && <div className="text-accent-rose bg-accent-rose/10 p-4 rounded-lg">{error}</div>}

      {localTracks.length > 0 && (
        <section className="mt-8">
           <h2 className="text-xl font-display font-semibold mb-4 text-text-primary">Local Tracks</h2>
           <TrackList tracks={localTracks} onPlayContext={handlePlayTrack} />
        </section>
      )}

      <h2 className="text-xl font-display font-semibold mb-4 mt-8 text-text-primary border-b border-white/5 pb-2">Featured Mixes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {mockAlbums.map((album) => (
          <div key={album.id} className="group bg-glass p-3 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <div className="aspect-square w-full rounded-lg overflow-hidden shadow-lg mb-4 relative">
              <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayDemo(album);
                  }}
                  className="bg-accent-cyan text-bg-primary rounded-full p-3 shadow-lg glow-cyan transform translate-y-4 group-hover:translate-y-0 transition-all"
                >
                  <Play size={20} fill="currentColor" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-text-primary text-sm truncate">{album.title}</h3>
            <p className="text-xs text-text-muted mt-1 truncate">{album.artist} • {album.year}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
