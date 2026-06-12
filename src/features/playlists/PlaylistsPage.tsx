import React, { useState } from 'react';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Plus, Play, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Track } from '../../store/usePlayerStore';

export const PlaylistsPage: React.FC = () => {
  const { playlists, createPlaylist, deletePlaylist, playPlaylist } = usePlaylistStore();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsModalOpen(false);
    }
  };

  const getMosaicArtworks = (tracks: Track[]) => {
      const artworks = tracks.filter(t => t.artworkUrl).map(t => t.artworkUrl).slice(0, 4);
      while(artworks.length < 4 && artworks.length > 0) {
          artworks.push(artworks[0]);
      }
      return artworks;
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-display font-bold text-text-primary flex items-center gap-3">
            <ListMusic className="text-accent-cyan" size={28} />
            Playlists
        </h1>
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-text-primary px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/5"
        >
           <Plus size={18} />
           Create Playlist
        </button>
      </div>

      {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted space-y-4">
             <ListMusic size={48} className="opacity-20" />
             <p>You haven't created any playlists yet.</p>
             <button onClick={() => setIsModalOpen(true)} className="text-accent-cyan hover:underline mt-2">Create your first playlist</button>
          </div>
      ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {playlists.map((playlist) => {
                const mosaic = getMosaicArtworks(playlist.tracks);
                
                return (
                  <div key={playlist.id} className="group relative bg-glass p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10">
                     <div 
                         className="cursor-pointer relative rounded-lg overflow-hidden shadow-lg mb-4 aspect-square bg-bg-secondary flex items-center justify-center"
                         onClick={() => navigate(`/playlists/${playlist.id}`)}
                     >
                         {mosaic.length === 4 ? (
                            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                {mosaic.map((art, i) => (
                                    <img key={i} src={art} className="w-full h-full object-cover" alt="" />
                                ))}
                            </div>
                         ) : mosaic.length > 0 ? (
                             <img src={mosaic[0]} className="w-full h-full object-cover" alt="" />
                         ) : (
                             <ListMusic size={32} className="text-text-muted/30" />
                         )}
                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button 
                                 onClick={(e) => { e.stopPropagation(); playPlaylist(playlist.id); }}
                                 className="h-12 w-12 rounded-full bg-accent-cyan flex items-center justify-center text-bg-primary hover:scale-105 transition-transform"
                              >
                                  <Play size={20} fill="currentColor" className="ml-1" />
                              </button>
                         </div>
                     </div>

                     <div className="flex items-start justify-between">
                         <div className="flex-1 overflow-hidden" onClick={() => navigate(`/playlists/${playlist.id}`)}>
                           <h3 className="font-semibold text-text-primary text-sm truncate" title={playlist.name}>
                             {playlist.name}
                           </h3>
                           <p className="text-xs text-text-muted mt-1 truncate">
                             {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                           </p>
                         </div>
                         <div className="relative">
                             <button 
                               onClick={() => setContextMenuId(contextMenuId === playlist.id ? null : playlist.id)}
                               className="p-1 text-text-muted hover:text-text-primary hover:bg-white/10 rounded"
                             >
                                 <MoreVertical size={16} />
                             </button>
                             {contextMenuId === playlist.id && (
                                 <div className="absolute right-0 top-full mt-1 w-32 bg-bg-secondary border border-white/10 rounded-lg shadow-xl z-10 py-1 text-sm overflow-hidden">
                                     <button 
                                        onClick={() => { deletePlaylist(playlist.id); setContextMenuId(null); }}
                                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-accent-rose hover:bg-accent-rose/10 transition-colors"
                                     >
                                        <Trash2 size={14} /> Delete
                                     </button>
                                 </div>
                             )}
                         </div>
                     </div>
                  </div>
                );
            })}
          </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl"
            >
               <h2 className="text-xl font-bold text-text-primary mb-4">Create Playlist</h2>
               <form onSubmit={handleCreate}>
                   <input
                     autoFocus
                     type="text"
                     value={newPlaylistName}
                     onChange={(e) => setNewPlaylistName(e.target.value)}
                     placeholder="Playlist name..."
                     className="w-full bg-glass border border-white/10 rounded-xl py-3 px-4 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan transition-all mb-6"
                   />
                   <div className="flex justify-end gap-3">
                       <button 
                          type="button" 
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                       >
                           Cancel
                       </button>
                       <button 
                          type="submit" 
                          disabled={!newPlaylistName.trim()}
                          className="px-4 py-2 rounded-lg bg-accent-cyan text-bg-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                       >
                           Create
                       </button>
                   </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
