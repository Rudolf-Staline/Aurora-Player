import React from 'react';
import { Play, MoreHorizontal, Heart, Plus, Loader2, ListPlus, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePlayerStore, type Track } from '../../store/usePlayerStore';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { audioEngine } from '../../core/audio_engine';

interface TrackListProps {
  tracks: Track[];
  onPlayContext?: (track: Track) => void;
  loadingTrackId?: string | null;
}

const formatDuration = (duration?: number) => {
  if (!duration) return '--:--';
  const hrs = Math.floor(duration / 3600);
  const mins = Math.floor((duration % 3600) / 60);
  const secs = Math.floor(duration % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const TrackList: React.FC<TrackListProps> = ({ tracks, onPlayContext, loadingTrackId }) => {
  const { trackIds: favorites, toggleTrackFavorite: toggleFavorite } = useFavoritesStore();
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistStore();
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = React.useState<Track[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);

  const playTrack = (track: Track) => {
    if (onPlayContext) onPlayContext(track);
    else audioEngine.playAndStart(track);
  };

  const toggleSelection = (track: Track) => {
    setSelectedTracks(prev => {
      const isSelected = prev.some(t => t.id === track.id);
      if (isSelected) return prev.filter(t => t.id !== track.id);
      return [...prev, track];
    });
  };

  const isSelected = (trackId: string) => selectedTracks.some(t => t.id === trackId);

  const handleSelectAll = () => {
    if (selectedTracks.length === tracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks([...tracks]);
    }
  };

  const handleAddToQueue = () => {
    const playerStore = usePlayerStore.getState();
    selectedTracks.forEach(track => playerStore.addToQueue(track));
    toast.success(`${selectedTracks.length} titre${selectedTracks.length > 1 ? 's' : ''} ajouté${selectedTracks.length > 1 ? 's' : ''} à la file`);
    setSelectedTracks([]);
  };

  const handleAddToPlaylistBulk = (playlistId: string) => {
    let addedCount = 0;
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    selectedTracks.forEach(track => {
      const alreadyExists = playlist.tracks.some(t => t.id === track.id);
      if (!alreadyExists) {
        addTrackToPlaylist(playlistId, track);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`${addedCount} titre${addedCount > 1 ? 's' : ''} ajouté${addedCount > 1 ? 's' : ''} à ${playlist.name}`);
    } else {
      toast(`${selectedTracks.length} titre${selectedTracks.length > 1 ? 's sont déjà présents' : ' est déjà présent'} dans la playlist.`);
    }
    setSelectedTracks([]);
    setShowPlaylistModal(false);
  };

  const handleCreateAndAdd = () => {
    const name = prompt('Nom de la nouvelle playlist :');
    if (!name) return;
    createPlaylist(name);
    const newPlaylists = usePlaylistStore.getState().playlists;
    const newPlaylistId = newPlaylists[newPlaylists.length - 1].id;
    handleAddToPlaylistBulk(newPlaylistId);
  };

  return (
    <div className="relative w-full pb-28">
      {/* Desktop — elegant rows */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[3.5rem_1fr_14rem_5rem_5rem] items-center gap-3 border-b border-premium px-4 pb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-text-muted">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedTracks.length === tracks.length && tracks.length > 0}
              onChange={handleSelectAll}
              className={`h-3.5 w-3.5 rounded border-white/20 bg-white/[0.06] text-accent-primary focus:ring-accent-primary focus:ring-offset-0 ${selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0'}`}
            />
            <span className={`${selectedTracks.length > 0 ? 'hidden' : 'inline'} -ml-3.5 w-3.5 text-center`}>#</span>
          </div>
          <span>Titre</span>
          <span>Album</span>
          <span className="text-right">Durée</span>
          <span />
        </div>

        <div className="mt-1">
          {tracks.map((track, index) => {
            const selected = isSelected(track.id);
            const isFavorite = favorites.includes(track.id);
            const loading = loadingTrackId === track.id;
            return (
              <div
                key={track.id}
                className={`group grid cursor-pointer grid-cols-[3.5rem_1fr_14rem_5rem_5rem] items-center gap-3 rounded-2xl px-4 py-2.5 transition-colors duration-200 ${
                  selected
                    ? 'state-active'
                    : loading
                      ? 'bg-white/[0.05]'
                      : 'hover:bg-white/[0.04]'
                }`}
                onDoubleClick={() => playTrack(track)}
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || selectedTracks.length > 0) {
                    e.preventDefault();
                    toggleSelection(track);
                  }
                }}
              >
                {/* Index / play / checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelection(track)}
                    onClick={(e) => e.stopPropagation()}
                    className={`h-3.5 w-3.5 rounded border-white/20 bg-white/[0.06] text-accent-primary focus:ring-accent-primary focus:ring-offset-0 transition-opacity ${selected || selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); playTrack(track); }}
                    className={`-ml-3.5 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-all ${selected || selectedTracks.length > 0 ? 'opacity-0' : 'opacity-100'} group-hover:opacity-100 group-hover:bg-accent-primary group-hover:text-bg-primary`}
                    aria-label={`Lire ${track.title}`}
                  >
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <span className={`-ml-8 w-8 text-center font-mono text-xs text-text-muted ${selected || selectedTracks.length > 0 ? 'opacity-0' : 'group-hover:opacity-0'}`}>{index + 1}</span>
                </div>

                {/* Title + artwork */}
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border-premium bg-bg-elevated">
                    {track.artworkUrl ? (
                      <img src={track.artworkUrl} alt={track.album} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-bg-elevated">
                        <Play size={14} fill="currentColor" className="text-text-muted/60" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className={`line-clamp-1 text-sm font-medium ${selected ? 'text-accent-primary' : 'text-text-primary'}`}>{track.title}</div>
                    <div className="line-clamp-1 text-xs text-text-muted">{track.artist}</div>
                  </div>
                </div>

                {/* Album */}
                <div className="text-sm text-text-muted">
                  <span className="line-clamp-1">{track.album}</span>
                </div>

                {/* Duration */}
                <div className="text-right font-mono text-xs text-text-muted">
                  {formatDuration(track.duration)}
                </div>

                {/* Actions */}
                <div className="relative flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                    className={`rounded-full p-2 transition-all ${isFavorite ? 'text-danger opacity-100' : 'text-text-muted opacity-0 hover:bg-white/[0.06] hover:text-danger group-hover:opacity-100'}`}
                    aria-label="Favori"
                  >
                    <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                  <div className="relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === track.id ? null : track.id); }}
                      className={`rounded-full p-2 text-text-muted transition-all hover:bg-white/[0.06] hover:text-text-primary ${contextMenuId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      aria-label="Plus d'options"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {contextMenuId === track.id && (
                      <div className="surface-card-strong shadow-deep absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl p-1 text-left text-sm">
                        <div className="px-3 py-2 text-[10px] font-medium uppercase tracking-[0.24em] text-accent-primary">Ajouter à une playlist</div>
                        {playlists.length === 0 ? (
                          <div className="px-3 py-3 text-xs italic text-text-muted">Aucune playlist créée</div>
                        ) : (
                          playlists.map(p => (
                            <button
                              key={p.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                addTrackToPlaylist(p.id, track);
                                setContextMenuId(null);
                              }}
                              className="flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-text-primary transition-colors hover:bg-white/[0.06]"
                              title={p.name}
                            >
                              <Plus size={14} className="shrink-0 text-text-muted" /> {p.name}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-2 md:hidden">
        {tracks.map((track) => {
          const selected = isSelected(track.id);
          const isFavorite = favorites.includes(track.id);
          return (
            <article key={track.id} className={`surface-card flex items-center gap-3 rounded-2xl p-3 ${selected ? 'state-active' : ''}`}>
              <button onClick={() => playTrack(track)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-primary text-bg-primary">
                <Play size={16} fill="currentColor" className="ml-0.5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium text-text-primary">{track.title}</p>
                <p className="line-clamp-1 text-xs text-text-muted">{track.artist}</p>
              </div>
              <button onClick={() => toggleFavorite(track.id)} className={`rounded-full p-2 ${isFavorite ? 'text-danger' : 'text-text-muted'}`}>
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </article>
          );
        })}
      </div>

      {selectedTracks.length > 0 && (
        <div className="surface-card-strong shadow-deep fixed left-1/2 z-[999] flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-3" style={{ bottom: '112px' }}>
          <span className="min-w-24 px-1 text-sm font-medium text-text-primary">{selectedTracks.length} sélectionné{selectedTracks.length > 1 ? 's' : ''}</span>
          <button onClick={() => setShowPlaylistModal(true)} className="btn-primary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <Plus size={16} /> Playlist
          </button>
          <button onClick={handleAddToQueue} className="btn-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <ListPlus size={16} /> File
          </button>
          <button onClick={() => setSelectedTracks([])} className="rounded-full p-2 text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
      )}

      {showPlaylistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
          <div className="surface-card-strong shadow-deep w-full max-w-md rounded-[2rem] p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text-primary">Ajouter à une playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} className="rounded-full p-2 text-text-muted hover:bg-white/[0.06] hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <button onClick={handleCreateAndAdd} className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-premium-strong p-3 text-sm font-medium text-accent-primary transition-colors hover:bg-white/[0.04]">
              <Plus size={18} /> Nouvelle playlist
            </button>
            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {playlists.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">Aucune playlist disponible.</p>
              ) : (
                playlists.map(p => (
                  <button key={p.id} onClick={() => handleAddToPlaylistBulk(p.id)} className="flex w-full items-center justify-between rounded-2xl border border-premium bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]">
                    <span className="truncate font-medium text-text-primary">{p.name}</span>
                    <span className="text-xs text-text-muted">{p.tracks.length} titres</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
