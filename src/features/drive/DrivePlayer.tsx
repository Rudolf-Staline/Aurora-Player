import React, { useState, useEffect } from 'react';
import { Cloud, Loader2, Music, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { forceDriveReauth, scanAllAudioFiles, getStreamUrl } from '../../utils/googleDriveApi';
import { loadFromCloud, saveToCloud } from '../../utils/auroraSync';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';
import { TrackList } from '../music/TrackList';
import { audioEngine } from '../../core/audio_engine';

interface DriveFile {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
}

function detectChanges(cached: DriveFile[], fresh: DriveFile[]): boolean {
  if (cached.length !== fresh.length) return true;
  
  const cachedIds = new Set(cached.map(f => f.id));
  const freshIds = new Set(fresh.map(f => f.id));
  
  for (const id of freshIds) {
    if (!cachedIds.has(id)) return true;
  }
  for (const id of cachedIds) {
    if (!freshIds.has(id)) return true;
  }
  
  const cachedMap = new Map(cached.map(f => [f.id, f]));
  for (const file of fresh) {
    const cachedFile = cachedMap.get(file.id);
    if (cachedFile?.modifiedTime !== file.modifiedTime) return true;
  }
  
  return false;
}

const toTrack = (file: DriveFile, token: string): Track => ({
  id: file.id,
  title: file.name.replace(/\.[^/.]+$/, ""),
  artist: 'Google Drive',
  album: 'Cloud Storage',
  url: getStreamUrl(file.id, token),
  duration: 0,
});

export const DrivePlayer: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('aurora_auth_token'));
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const { setLocalTracks } = usePlayerStore();

  const handleConnect = async () => {
    setIsScanning(true);
    setError('');
    try {
      const newToken = await forceDriveReauth();
      if (newToken) {
        setToken(newToken);
      } else {
        setError('Failed to authenticate with Google Drive.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication error.';
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlayDriveTrack = async (track: Track) => {
    if (!token) return;
    audioEngine.playAndStart({ ...track, url: getStreamUrl(track.id, token) });
  };

  const loadLibrary = async () => {
    if (!token) return;
    
    const cache = await loadFromCloud<{ files?: DriveFile[]; lastScanned?: string | null }>('aurora_drive_cache.json');
    if (cache?.files?.length) {
      setFiles(cache.files.map(({ id, name, mimeType, size, modifiedTime }) => ({ id, name, mimeType, size, modifiedTime })));
      setLastScanned(cache.lastScanned ?? null);
      setIsFirstLoad(false);
    } else {
      setIsFirstLoad(true);
    }

    setIsScanning(true);
    setError('');
    const allFresh: DriveFile[] = [];

    try {
      await scanAllAudioFiles(token, (newFiles: DriveFile[]) => {
        allFresh.push(...newFiles);
        
        setFiles(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const toAdd = newFiles.filter(f => !existingIds.has(f.id));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
        
        setIsFirstLoad(false);
        setScanProgress(allFresh.length);
      });

      const hasChanges = detectChanges(cache?.files || [], allFresh);
      
      if (hasChanges) {
        setFiles(allFresh);
        const newTimestamp = new Date().toISOString();
        await saveToCloud('aurora_drive_cache.json', {
          lastScanned: newTimestamp,
          totalFiles: allFresh.length,
          files: allFresh,
        });
        setLastScanned(newTimestamp);
        
        if (cache?.files?.length) {
          toast.success(`Library updated — ${allFresh.length} files found`);
        }
      }

      setLocalTracks(allFresh.map(file => toTrack(file, token)));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch files from Google Drive.';
      setError(message);
      if (message.includes('permission') || message.includes('Session expirée')) {
        setToken(null);
        localStorage.removeItem('aurora_auth_token');
      }
    } finally {
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  useEffect(() => {
    if (token && files.length === 0) {
       loadLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);


  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5 pb-6">
        <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <Cloud className="text-accent-cyan" size={28} />
            Google Drive
            {token && <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">CONNECTED</span>}
        </h1>
        {token && (
            <div className="flex items-center gap-4">
                {lastScanned && (
                    <span className="text-xs text-text-muted font-mono">
                        Last scanned: {new Date(lastScanned).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                )}
                <button 
                    onClick={loadLibrary}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-text-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/5 disabled:opacity-50"
                >
                    {isScanning ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                    Refresh
                </button>
                <button 
                    onClick={handleConnect}
                    disabled={isScanning}
                    className="flex items-center gap-2 bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-accent-cyan/20 disabled:opacity-50"
                >
                    Reconnecter
                </button>
            </div>
        )}
      </div>

      {!token ? (
          <div className="flex flex-col items-center justify-center py-20 bg-glass rounded-2xl border border-white/5">
              <Cloud size={64} className="text-accent-cyan mb-6" />
              <h2 className="text-2xl font-bold text-text-primary mb-2">Connect Google Drive</h2>
              <p className="text-text-muted text-center max-w-md mb-8">
                 Stream your personal audio files securely from your Google Drive. We also request app data access to sync Omed metadata.
              </p>
              <button 
                 onClick={handleConnect}
                 disabled={isScanning}
                 className="flex items-center gap-2 bg-gradient-to-r from-accent-cyan to-accent-violet text-bg-primary px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                  {isScanning ? <Loader2 size={20} className="animate-spin" /> : <Cloud size={20} fill="currentColor" />}
                  Connect Account
              </button>
              {error && <p className="text-accent-rose mt-4">{error}</p>}
          </div>
      ) : (
          <div className="space-y-4">
              {isScanning && (
                  <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/10 text-sm text-text-muted mb-4">
                      <Loader2 size={14} className="animate-spin text-accent-cyan" />
                      <span>
                          {scanProgress > 0 ? `Scanning... ${scanProgress} files found so far` : 'Starting scan...'}
                      </span>
                      <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden ml-2">
                          <div className="h-full bg-accent-cyan rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }} />
                      </div>
                  </div>
              )}

              {error ? (
                  <div className="text-accent-rose bg-accent-rose/10 p-4 rounded-lg">{error}</div>
              ) : files.length === 0 && isFirstLoad ? (
                  <div className="space-y-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
                              <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse" />
                              <div className="flex-1 space-y-2">
                                  <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                                  <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
                              </div>
                          </div>
                      ))}
                  </div>
              ) : files.length === 0 && !isScanning ? (
                  <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-4">
                      <Music size={48} className="opacity-20" />
                      <p>No audio files found in your Google Drive.</p>
                  </div>
              ) : (
                  <TrackList 
                    tracks={files.map(file => toTrack(file, token))}
                    onPlayContext={handlePlayDriveTrack}
                  />
              )}
          </div>
      )}
    </div>
  );
};
