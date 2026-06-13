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
      <section className="surface-card-strong shadow-deep relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
          <div>
            <div className="eyebrow mb-5 inline-flex items-center gap-2 text-text-muted">
              <Cloud size={14} className="text-accent-primary" /> Google Drive
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-text-primary md:text-6xl">
              Bibliothèque <span className="text-accent-primary">connectée</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Diffuse tes fichiers audio Google Drive sans les déplacer.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={token ? loadLibrary : handleConnect}
                disabled={isScanning}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isScanning ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                {token ? 'Scanner maintenant' : 'Connecter Drive'}
              </button>
              {token && (
                <button
                  onClick={handleConnect}
                  disabled={isScanning}
                  className="btn-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
                >
                  <ShieldCheck size={18} /> Reconnecter
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            <div className="surface-secondary border-premium rounded-2xl p-4">
              <p className="text-3xl font-semibold text-text-primary">{files.length}</p>
              <p className="eyebrow mt-1 text-text-muted">Audios</p>
            </div>
            <div className="surface-secondary border-premium rounded-2xl p-4">
              <p className="text-3xl font-semibold text-text-primary">{formatSize(totalSize)}</p>
              <p className="eyebrow mt-1 text-text-muted">Taille</p>
            </div>
            <div className="surface-secondary border-premium rounded-2xl p-4">
              <p className="inline-flex items-center gap-2 text-lg font-semibold text-text-primary">
                {token && <span className="h-2 w-2 rounded-full bg-accent-primary" />}
                {token ? 'Connecté' : 'Hors ligne'}
              </p>
              <p className="eyebrow mt-1 text-text-muted">État</p>
            </div>
          </div>
        </div>
      </section>

      {lastScanned && (
        <div className="surface-card border-premium flex items-center gap-3 rounded-2xl p-4 text-sm text-text-muted">
          <HardDrive size={18} className="text-accent-primary" /> Dernier scan : {new Date(lastScanned).toLocaleString()}
        </div>
      )}

      {!token ? (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <div className="border-premium mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-bg-elevated text-accent-primary">
            <Cloud size={40} />
          </div>
          <h2 className="text-2xl font-semibold text-text-primary">Connecte Google Drive</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">
            L’app demande la lecture Drive pour streamer tes audios et l’accès appData pour synchroniser les métadonnées Omed.
          </p>
          <button onClick={handleConnect} disabled={isScanning} className="btn-primary mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold disabled:opacity-50">
            {isScanning ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
            Connecter le compte
          </button>
          {error && (
            <p className="border-premium mt-5 inline-flex max-w-md rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
        </section>
      ) : (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          {isScanning && (
            <div className="surface-secondary border-premium mb-5 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-text-muted">
              <Loader2 size={16} className="animate-spin text-accent-primary" />
              <span>{scanProgress > 0 ? `Scan en cours — ${scanProgress} fichiers trouvés` : 'Initialisation du scan...'}</span>
              <div className="ml-2 h-1 flex-1 overflow-hidden rounded-full bg-bg-elevated">
                <div className="h-full w-full animate-pulse rounded-full bg-accent-primary" />
              </div>
            </div>
          )}

          {error ? (
            <div className="border-premium rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">{error}</div>
          ) : files.length === 0 && isFirstLoad ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="surface-secondary flex items-center gap-4 rounded-2xl p-4">
                  <div className="h-12 w-12 animate-pulse rounded-xl bg-bg-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-bg-elevated" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-bg-elevated" />
                  </div>
                </div>
              ))}
            </div>
          ) : files.length === 0 && !isScanning ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 text-center text-text-muted">
              <Music size={52} className="opacity-25" />
              <h2 className="text-xl font-semibold text-text-primary">Aucun fichier audio trouvé</h2>
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
