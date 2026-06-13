import React, { useState, useEffect } from 'react';
import { Cloud, Loader2, Music, RefreshCw, ShieldCheck, HardDrive } from 'lucide-react';
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
  for (const id of freshIds) if (!cachedIds.has(id)) return true;
  for (const id of cachedIds) if (!freshIds.has(id)) return true;
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

const formatSize = (size?: string) => {
  const bytes = Number(size || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  const mb = bytes / 1024 / 1024;
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} Go` : `${mb.toFixed(1)} Mo`;
};

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
        setError('Impossible de connecter Google Drive.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d’authentification.';
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
        if (cache?.files?.length) toast.success(`Bibliothèque mise à jour — ${allFresh.length} fichiers trouvés`);
      }

      setLocalTracks(allFresh.map(file => toTrack(file, token)));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Impossible de récupérer les fichiers Google Drive.';
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
    if (token && files.length === 0) loadLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const totalSize = files.reduce((sum, file) => sum + Number(file.size || 0), 0).toString();

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-cyan/20 blur-3xl" />
        <div className="absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-accent-violet/15 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <Cloud size={14} /> Google Drive
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
              Tes fichiers Drive, prêts à être <span className="text-gradient-aurora">streamés</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Omed scanne les fichiers audio, garde un cache léger et régénère les liens de lecture pour éviter les URLs expirées.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button 
                onClick={token ? loadLibrary : handleConnect}
                disabled={isScanning}
                className="command-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                {token ? 'Scanner maintenant' : 'Connecter Drive'}
              </button>
              {token && (
                <button 
                  onClick={handleConnect}
                  disabled={isScanning}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-accent-cyan/20 bg-accent-cyan/10 px-5 py-3 text-sm font-bold text-accent-cyan transition-colors hover:bg-accent-cyan/20 disabled:opacity-50"
                >
                  <ShieldCheck size={18} /> Reconnecter
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-3xl font-black text-text-primary">{files.length}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Audios</p>
            </div>
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-3xl font-black text-text-primary">{formatSize(totalSize)}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Taille</p>
            </div>
            <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
              <p className="text-lg font-black text-text-primary">{token ? 'Connecté' : 'Off'}</p>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">État</p>
            </div>
          </div>
        </div>
      </section>

      {lastScanned && (
        <div className="surface-card flex items-center gap-3 rounded-3xl p-4 text-sm text-text-muted">
          <HardDrive size={18} className="text-accent-cyan" /> Dernier scan : {new Date(lastScanned).toLocaleString()}
        </div>
      )}

      {!token ? (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-accent-cyan/10 text-accent-cyan">
            <Cloud size={40} />
          </div>
          <h2 className="text-2xl font-black text-text-primary">Connecte Google Drive</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">
            L’app demande la lecture Drive pour streamer tes audios et l’accès appData pour synchroniser les métadonnées Omed.
          </p>
          <button onClick={handleConnect} disabled={isScanning} className="command-button mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black disabled:opacity-50">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
            Connecter le compte
          </button>
          {error && <p className="mt-4 text-sm text-accent-rose">{error}</p>}
        </section>
      ) : (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          {isScanning && (
            <div className="mb-5 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin text-accent-cyan" />
              <span>{scanProgress > 0 ? `Scan en cours — ${scanProgress} fichiers trouvés` : 'Initialisation du scan...'}</span>
              <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-full animate-pulse rounded-full bg-accent-cyan" />
              </div>
            </div>
          )}

          {error ? (
            <div className="rounded-3xl border border-accent-rose/20 bg-accent-rose/10 p-4 text-accent-rose">{error}</div>
          ) : files.length === 0 && isFirstLoad ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-3xl bg-white/[0.035] p-4">
                  <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-white/5" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 && !isScanning ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-text-muted">
              <Music size={52} className="opacity-25" />
              <h2 className="text-xl font-black text-text-primary">Aucun fichier audio trouvé</h2>
              <p className="max-w-md text-sm">Ajoute des fichiers audio dans ton Drive, puis relance un scan.</p>
            </div>
          ) : (
            <TrackList tracks={files.map(file => toTrack(file, token))} onPlayContext={handlePlayDriveTrack} />
          )}
        </section>
      )}
    </div>
  );
};
