import React, { useState } from 'react';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { useNavigate } from 'react-router-dom';
import { ListMusic, Plus, Play, MoreVertical, Trash2, Library } from 'lucide-react';
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
    while (artworks.length < 4 && artworks.length > 0) {
      artworks.push(artworks[0]);
    }
    return artworks;
  };

  const totalTracks = playlists.reduce((sum, playlist) => sum + playlist.tracks.length, 0);

  return (
    <div className="space-y-8 pb-10">
      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-28 left-14 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <ListMusic size={14} /> Playlists
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">
              Construis tes sessions comme un <span className="text-gradient-aurora">set audio</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              Organise tes morceaux, lance une playlist entière et garde tes sélections prêtes pour travailler, marcher ou coder.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <div className="grid grid-cols-2 gap-3 sm:w-72">
              <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
                <p className="text-3xl font-black text-text-primary">{playlists.length}</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Listes</p>
              </div>
              <div className="rounded-3xl bg-black/20 p-4 ring-1 ring-white/10">
                <p className="text-3xl font-black text-text-primary">{totalTracks}</p>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-text-muted">Titres</p>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="command-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-transform hover:-translate-y-0.5"
            >
              <Plus size={18} /> Créer une playlist
            </button>
          </div>
        </div>
      </section>

      {playlists.length === 0 ? (
        <section className="surface-card flex min-h-[360px] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/[0.06] text-accent-cyan">
            <Library size={38} />
          </div>
          <h2 className="text-2xl font-black text-text-primary">Aucune playlist</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-muted">Crée ta première playlist puis ajoute des titres depuis la bibliothèque ou Drive.</p>
          <button onClick={() => setIsModalOpen(true)} className="command-button mt-6 rounded-2xl px-5 py-3 text-sm font-black">Créer maintenant</button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => {
            const mosaic = getMosaicArtworks(playlist.tracks);
            return (
              <article key={playlist.id} className="group surface-card relative overflow-visible rounded-[1.8rem] p-3 transition-all hover:-translate-y-1 hover:border-white/20">
                <div 
                  className="relative mb-4 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[1.45rem] bg-white/[0.06] shadow-xl"
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                >
                  {mosaic.length === 4 ? (
                    <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                      {mosaic.map((art, i) => <img key={i} src={art} className="h-full w-full object-cover" alt="" />)}
                    </div>
                  ) : mosaic.length > 0 ? (
                    <img src={mosaic[0]} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <ListMusic size={42} className="text-text-muted/35" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); playPlaylist(playlist.id); }}
                      className="command-button flex h-14 w-14 items-center justify-center rounded-full transition-transform hover:scale-105"
                      aria-label={`Lire ${playlist.name}`}
                    >
                      <Play size={22} fill="currentColor" className="ml-1" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 px-1 pb-1">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/playlists/${playlist.id}`)}>
                    <h3 className="truncate text-sm font-black text-text-primary" title={playlist.name}>{playlist.name}</h3>
                    <p className="mt-1 text-xs text-text-muted">{playlist.tracks.length} titre{playlist.tracks.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setContextMenuId(contextMenuId === playlist.id ? null : playlist.id)}
                      className="rounded-2xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
                      aria-label="Options"
                    >
                      <MoreVertical size={17} />
                    </button>
                    {contextMenuId === playlist.id && (
                      <div className="surface-card absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-2xl p-1 text-sm shadow-2xl">
                        <button 
                          onClick={() => { deletePlaylist(playlist.id); setContextMenuId(null); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-accent-rose transition-colors hover:bg-accent-rose/10"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="surface-card-strong w-full max-w-md rounded-[2rem] p-6 shadow-2xl"
            >
              <h2 className="mb-2 text-2xl font-black text-text-primary">Nouvelle playlist</h2>
              <p className="mb-6 text-sm leading-6 text-text-muted">Donne un nom clair à ta sélection. Tu pourras ajouter des titres ensuite depuis les menus.</p>
              <form onSubmit={handleCreate}>
                <input
                  autoFocus
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ex : Deep work, Marche du soir..."
                  className="mb-6 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-text-primary placeholder:text-text-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-2xl px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary">
                    Annuler
                  </button>
                  <button type="submit" disabled={!newPlaylistName.trim()} className="command-button rounded-2xl px-5 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50">
                    Créer
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
