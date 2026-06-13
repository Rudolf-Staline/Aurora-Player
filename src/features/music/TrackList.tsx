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
      <div className="hidden rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-2 md:block">
        <table className="w-full border-separate border-spacing-y-1 text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.22em] text-text-muted">
              <th className="w-20 px-3 py-3 font-black">
                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={selectedTracks.length === tracks.length && tracks.length > 0}
                    onChange={handleSelectAll}
                    className={`rounded border-white/20 bg-white/10 text-accent-cyan focus:ring-accent-cyan ${selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <span className={`${selectedTracks.length > 0 ? 'opacity-0' : 'opacity-100'} transition-opacity`}>#</span>
                </div>
              </th>
              <th className="px-3 py-3 font-black">Titre</th>
              <th className="px-3 py-3 font-black">Album</th>
              <th className="px-3 py-3 text-right font-black">Durée</th>
              <th className="w-20 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {tracks.map((track, index) => {
              const selected = isSelected(track.id);
              const isFavorite = favorites.includes(track.id);
              return (
                <tr 
                  key={track.id} 
                  className={`group cursor-pointer transition-all ${selected ? 'bg-accent-cyan/10 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35)]' : loadingTrackId === track.id ? 'bg-white/10 opacity-80' : 'hover:bg-white/[0.065]'}`}
                  onDoubleClick={() => playTrack(track)}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || selectedTracks.length > 0) {
                      e.preventDefault();
                      toggleSelection(track);
                    }
                  }}
                >
                  <td className="rounded-l-2xl px-3 py-3 text-sm text-text-muted">
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={selected}
                        onChange={() => toggleSelection(track)}
                        onClick={(e) => e.stopPropagation()}
                        className={`rounded border-white/20 bg-white/10 text-accent-cyan focus:ring-accent-cyan transition-opacity ${selected || selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      />
                      <button 
                        onClick={(e) => { e.stopPropagation(); playTrack(track); }}
                        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.06] text-text-muted transition-all group-hover:bg-accent-cyan group-hover:text-bg-primary"
                        aria-label={`Lire ${track.title}`}
                      >
                        {loadingTrackId === track.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <span className="w-6 font-mono text-xs">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] shadow-lg">
                        {track.artworkUrl ? (
                          <img src={track.artworkUrl} alt={track.album} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20">
                            <Play size={15} fill="currentColor" className="text-text-muted" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-black text-text-primary">{track.title}</div>
                        <div className="line-clamp-1 text-xs text-text-muted">{track.artist}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-sm text-text-muted">
                    <span className="line-clamp-1">{track.album}</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-sm text-text-muted">
                    {formatDuration(track.duration)}
                  </td>
                  <td className="relative rounded-r-2xl px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                        className={`rounded-xl p-2 transition-colors ${isFavorite ? 'bg-accent-rose/15 text-accent-rose' : 'text-text-muted hover:bg-white/10 hover:text-accent-rose'}`}
                        aria-label="Favori"
                      >
                        <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === track.id ? null : track.id); }}
                          className="rounded-xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
                          aria-label="Plus d'options"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {contextMenuId === track.id && (
                          <div className="surface-card absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl p-1 text-left text-sm shadow-2xl">
                            <div className="rounded-xl bg-white/[0.05] px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-text-muted">Ajouter à une playlist</div>
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
                                  className="flex w-full items-center gap-2 truncate rounded-xl px-3 py-2 text-left text-text-primary transition-colors hover:bg-white/10"
                                  title={p.name}
                                >
                                  <Plus size={14} className="shrink-0" /> {p.name}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {tracks.map((track) => {
          const selected = isSelected(track.id);
          const isFavorite = favorites.includes(track.id);
          return (
            <article key={track.id} className={`surface-card flex items-center gap-3 rounded-3xl p-3 ${selected ? 'ring-1 ring-accent-cyan/50' : ''}`}>
              <button onClick={() => playTrack(track)} className="command-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full">
                <Play size={16} fill="currentColor" className="ml-0.5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-black text-text-primary">{track.title}</p>
                <p className="line-clamp-1 text-xs text-text-muted">{track.artist}</p>
              </div>
              <button onClick={() => toggleFavorite(track.id)} className={`rounded-2xl p-2 ${isFavorite ? 'text-accent-rose' : 'text-text-muted'}`}>
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
            </article>
          );
        })}
      </div>

      {selectedTracks.length > 0 && (
        <div className="surface-card-strong fixed left-1/2 z-[999] flex -translate-x-1/2 items-center gap-3 rounded-[1.75rem] px-4 py-3 shadow-2xl" style={{ bottom: '112px' }}>
          <span className="min-w-24 text-sm font-black text-text-primary">{selectedTracks.length} sélectionné{selectedTracks.length > 1 ? 's' : ''}</span>
          <button onClick={() => setShowPlaylistModal(true)} className="command-button flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black">
            <Plus size={16} /> Playlist
          </button>
          <button onClick={handleAddToQueue} className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-text-primary transition-colors hover:bg-white/20">
            <ListPlus size={16} /> File
          </button>
          <button onClick={() => setSelectedTracks([])} className="rounded-2xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
      )}

      {showPlaylistModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md" onClick={() => setShowPlaylistModal(false)}>
          <div className="surface-card-strong w-full max-w-md rounded-[2rem] p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black text-text-primary">Ajouter à une playlist</h3>
              <button onClick={() => setShowPlaylistModal(false)} className="rounded-xl p-2 text-text-muted hover:bg-white/10 hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <button onClick={handleCreateAndAdd} className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-accent-cyan/50 p-3 text-sm font-black text-accent-cyan transition-colors hover:bg-accent-cyan/10">
              <Plus size={18} /> Nouvelle playlist
            </button>
            <div className="max-h-[400px] space-y-2 overflow-y-auto pr-2">
              {playlists.length === 0 ? (
                <p className="py-4 text-center text-sm text-text-muted">Aucune playlist disponible.</p>
              ) : (
                playlists.map(p => (
                  <button key={p.id} onClick={() => handleAddToPlaylistBulk(p.id)} className="flex w-full items-center justify-between rounded-2xl bg-white/[0.06] p-3 transition-colors hover:bg-white/10">
                    <span className="truncate font-bold text-text-primary">{p.name}</span>
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
