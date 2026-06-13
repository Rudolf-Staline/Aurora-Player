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

  const getCoverArtwork = (tracks: Track[]) => {
    return tracks.find(t => t.artworkUrl)?.artworkUrl;
  };

  const totalTracks = playlists.reduce((sum, playlist) => sum + playlist.tracks.length, 0);

  return (
    <div className="space-y-10 pb-12">
      <section className="surface-card-strong relative overflow-hidden rounded-[2rem] p-8 shadow-deep md:p-12">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow text-accent-primary">
              <ListMusic size={13} /> Vos playlists
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-6xl">
              Vos sessions, composées avec soin.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-text-muted">
              Organisez vos morceaux, lancez une playlist entière et gardez vos sélections prêtes pour travailler, marcher ou simplement écouter.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-8">
              <div>
                <p className="text-4xl font-semibold tracking-tight text-text-primary">{playlists.length}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">Listes</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-4xl font-semibold tracking-tight text-text-primary">{totalTracks}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-text-muted">Titres</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center justify-center gap-2 self-start rounded-full px-7 py-3.5 text-sm font-semibold lg:self-end"
          >
            <Plus size={18} /> Créer une playlist
          </button>
        </div>
      </section>

      {playlists.length === 0 ? (
        <section className="surface-card flex min-h-[380px] flex-col items-center justify-center rounded-[2rem] p-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-premium bg-bg-elevated text-accent-primary">
            <Library size={34} />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Aucune playlist</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-text-muted">Créez votre première playlist, puis ajoutez des titres depuis la bibliothèque ou Drive.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold">
            <Plus size={18} /> Créer maintenant
          </button>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => {
            const cover = getCoverArtwork(playlist.tracks);
            return (
              <article key={playlist.id} className="group surface-card relative overflow-visible rounded-[1.6rem] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-premium-strong hover:shadow-deep">
                <div
                  className="relative mb-5 flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-[1.3rem] border-premium bg-bg-elevated shadow-deep"
                  onClick={() => navigate(`/playlists/${playlist.id}`)}
                >
                  {cover ? (
                    <img src={cover} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" alt="" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-elevated to-bg-secondary">
                      <ListMusic size={44} strokeWidth={1.25} className="text-text-muted/25" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/75 via-black/15 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); playPlaylist(playlist.id); }}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-bg-primary shadow-deep transition-transform hover:scale-105"
                      aria-label={`Lire ${playlist.name}`}
                    >
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3 px-1 pb-1">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/playlists/${playlist.id}`)}>
                    <h3 className="truncate text-lg font-semibold tracking-tight text-text-primary" title={playlist.name}>{playlist.name}</h3>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-text-muted">{playlist.tracks.length} titre{playlist.tracks.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setContextMenuId(contextMenuId === playlist.id ? null : playlist.id)}
                      className="rounded-full p-2 text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-primary"
                      aria-label="Options"
                    >
                      <MoreVertical size={17} />
                    </button>
                    {contextMenuId === playlist.id && (
                      <div className="surface-card-strong absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-xl p-1 text-sm shadow-deep">
                        <button
                          onClick={() => { deletePlaylist(playlist.id); setContextMenuId(null); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger transition-colors hover:bg-danger/10"
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
              className="surface-card-strong w-full max-w-md rounded-[2rem] p-8 shadow-deep"
            >
              <span className="eyebrow text-accent-primary">Nouvelle playlist</span>
              <h2 className="mt-3 mb-2 text-3xl font-semibold tracking-tight text-text-primary">Composez votre sélection</h2>
              <p className="mb-7 text-sm leading-7 text-text-muted">Donnez un nom clair à votre sélection. Vous pourrez ajouter des titres ensuite depuis les menus.</p>
              <form onSubmit={handleCreate}>
                <input
                  autoFocus
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Ex : Deep work, Marche du soir..."
                  className="mb-7 w-full rounded-xl border-premium bg-bg-primary px-4 py-3.5 text-text-primary placeholder:text-text-muted/70 focus:border-accent-primary/50 focus:outline-none focus:ring-2 focus:ring-accent-primary/15"
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary rounded-full px-5 py-2.5 text-sm font-semibold">
                    Annuler
                  </button>
                  <button type="submit" disabled={!newPlaylistName.trim()} className="btn-primary rounded-full px-6 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
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
