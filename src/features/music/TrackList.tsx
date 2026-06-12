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

export const TrackList: React.FC<TrackListProps> = ({ tracks, onPlayContext, loadingTrackId }) => {
  const { trackIds: favorites, toggleTrackFavorite: toggleFavorite } = useFavoritesStore();
  const { playlists, addTrackToPlaylist, createPlaylist } = usePlaylistStore();
  const [contextMenuId, setContextMenuId] = React.useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = React.useState<Track[]>([]);
  const [showPlaylistModal, setShowPlaylistModal] = React.useState(false);

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
    toast.success(`Added ${selectedTracks.length} tracks to queue`);
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
       toast.success(`${addedCount} tracks added to ${playlist.name}`);
    } else {
       toast(`${selectedTracks.length} tracks already in playlist.`);
    }
    setSelectedTracks([]);
    setShowPlaylistModal(false);
  };

  const handleCreateAndAdd = () => {
     const name = prompt('New Playlist Name:');
     if (!name) return;
     createPlaylist(name);
     // Note: In a real app we'd wait for the ID, but Zustand is sync so we can get it immediately
     const newPlaylists = usePlaylistStore.getState().playlists;
     const newPlaylistId = newPlaylists[newPlaylists.length - 1].id;
     handleAddToPlaylistBulk(newPlaylistId);
  };

  return (
    <div className="w-full relative pb-24">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-text-muted">
            <th className="py-4 pl-4 font-medium w-20">
               <div className="flex items-center gap-3">
                 <input 
                   type="checkbox" 
                   checked={selectedTracks.length === tracks.length && tracks.length > 0}
                   onChange={handleSelectAll}
                   className={`rounded bg-white/10 border-white/20 text-accent-cyan focus:ring-accent-cyan cursor-pointer transition-opacity ${selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0'}`}
                 />
                 <span className={`${selectedTracks.length > 0 ? 'opacity-0' : 'opacity-100'} transition-opacity w-4 text-center`}>#</span>
               </div>
            </th>
            <th className="py-4 font-medium">Title</th>
            <th className="py-4 font-medium hidden md:table-cell">Album</th>
            <th className="py-4 pr-4 text-right font-medium">Duration</th>
            <th className="py-4 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const selected = isSelected(track.id);
            return (
            <tr 
              key={track.id} 
              className={`group border-b border-white/5 transition-colors cursor-pointer ${loadingTrackId === track.id ? 'bg-white/10 opacity-70' : 'hover:bg-white/5'} ${selected ? 'bg-accent-cyan/10 ring-1 ring-inset ring-accent-cyan/50' : ''}`}
              onDoubleClick={() => onPlayContext ? onPlayContext(track) : audioEngine.playAndStart(track)}
              onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || selectedTracks.length > 0) {
                      e.preventDefault();
                      toggleSelection(track);
                  }
              }}
            >
              <td className="py-3 pl-4 text-text-muted w-20 text-sm">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div className={`transition-opacity flex items-center ${selected || selectedTracks.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input 
                      type="checkbox" 
                      checked={selected}
                      onChange={() => toggleSelection(track)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded bg-white/10 border-white/20 text-accent-cyan focus:ring-accent-cyan cursor-pointer"
                    />
                  </div>
                  
                  {/* Number/Play Icon */}
                  <div className="relative flex items-center justify-center w-4 h-6">
                    <div className={`absolute flex items-center justify-center transition-opacity ${selected || selectedTracks.length > 0 ? 'opacity-0 -z-10' : 'opacity-100 group-hover:opacity-0 -z-10'}`}>
                      {loadingTrackId === track.id ? (
                        <Loader2 size={16} className="animate-spin text-accent-cyan" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>

                    {/* Play Button on Hover (when NO track is selected) */}
                    {selectedTracks.length === 0 && !selected && (
                      <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onPlayContext) {
                              onPlayContext(track);
                            } else {
                              audioEngine.playAndStart(track);
                            }
                          }}
                          className="text-accent-cyan pointer-events-auto flex items-center justify-center"
                        >
                          <Play size={16} fill="currentColor" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="py-3">
                <div className="flex items-center gap-3">
                  {track.artworkUrl && (
                    <img src={track.artworkUrl} alt={track.album} className="h-10 w-10 rounded shadow-md object-cover" />
                  )}
                  <div>
                    <div className="font-medium text-text-primary text-sm line-clamp-1">{track.title}</div>
                    <div className="text-xs text-text-muted line-clamp-1">{track.artist}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 text-sm text-text-muted hidden md:table-cell line-clamp-1">
                {track.album}
              </td>
              <td className="py-3 pr-4 text-right text-sm text-text-muted font-mono">
                {(() => {
                  if (!track.duration) return '--:--';
                  const hrs = Math.floor(track.duration / 3600);
                  const mins = Math.floor((track.duration % 3600) / 60);
                  const secs = Math.floor(track.duration % 60);
                  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                })()}
              </td>
              <td className="py-3 pr-4 text-right relative" onClick={(e) => { e.stopPropagation(); }}>
                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }}
                    className={`transition-colors ${favorites.includes(track.id) ? 'text-accent-rose' : 'text-text-muted hover:text-accent-rose'}`}
                  >
                    <Heart size={16} fill={favorites.includes(track.id) ? 'currentColor' : 'none'} />
                  </button>
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setContextMenuId(contextMenuId === track.id ? null : track.id); }}
                      className="text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {contextMenuId === track.id && (
                       <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-white/10 rounded-lg shadow-xl z-50 py-1 text-sm overflow-hidden text-left">
                           <div className="px-3 py-1 text-xs font-semibold text-text-muted uppercase tracking-wider bg-white/5 mb-1">Add to Playlist</div>
                           {playlists.length === 0 ? (
                               <div className="px-3 py-2 text-text-muted text-xs italic">No playlists created</div>
                           ) : (
                               playlists.map(p => (
                                   <button 
                                      key={p.id}
                                      onClick={(e) => { 
                                          e.stopPropagation(); 
                                          addTrackToPlaylist(p.id, track); 
                                          setContextMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-text-primary hover:bg-white/10 transition-colors truncate"
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
          )})}
        </tbody>
      </table>

      {selectedTracks.length > 0 && (
        <div 
          style={{ bottom: '112px' }}
          className="fixed left-1/2 -translate-x-1/2 z-[999] flex items-center gap-4 px-6 py-3 bg-bg-secondary/95 border border-accent-cyan/30 rounded-2xl shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <span className="text-sm text-text-primary font-medium w-24">
            {selectedTracks.length} selected
          </span>
          <button 
            onClick={() => setShowPlaylistModal(true)}
            className="flex items-center gap-2 bg-accent-cyan text-bg-primary px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Add to Playlist
          </button>
          <button 
            onClick={handleAddToQueue}
            className="flex items-center gap-2 bg-white/10 text-text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            <ListPlus size={16} />
            Add to Queue
          </button>
          <button 
            onClick={() => setSelectedTracks([])}
            className="text-text-muted hover:text-text-primary transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {showPlaylistModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPlaylistModal(false)}>
            <div className="bg-bg-secondary p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-display text-text-primary">Add to Playlist</h3>
                  <button onClick={() => setShowPlaylistModal(false)} className="text-text-muted hover:text-text-primary">
                      <X size={20} />
                  </button>
               </div>
               
               <button 
                  onClick={handleCreateAndAdd}
                  className="w-full flex items-center justify-center gap-2 p-3 mb-4 rounded-xl border border-dashed border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
               >
                  <Plus size={18} />
                  New Playlist
               </button>

               <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {playlists.length === 0 ? (
                      <p className="text-text-muted text-center py-4 text-sm">No playlists available.</p>
                  ) : (
                      playlists.map(p => (
                          <button 
                             key={p.id}
                             onClick={() => handleAddToPlaylistBulk(p.id)}
                             className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                          >
                             <span className="font-medium text-text-primary truncate">{p.name}</span>
                             <span className="text-xs text-text-muted">{p.tracks.length} tracks</span>
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
