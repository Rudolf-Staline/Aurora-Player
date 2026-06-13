import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { audioEngine } from '../../core/audio_engine';
import { Play, ArrowLeft, GripVertical, Trash2, Clock, Music, ListMusic } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Track } from '../../store/usePlayerStore';

interface SortableTrackProps {
  track: Track;
  index: number;
  onRemove: (id: string) => void;
  onPlay: () => void;
  isActive: boolean;
}

const formatDuration = (duration?: number) => {
  if (!duration) return '--:--';
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SortableTrack: React.FC<SortableTrackProps> = ({ track, index, onRemove, onPlay, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.82 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center gap-3 rounded-3xl border p-3 transition-all ${isActive ? 'border-accent-cyan/35 bg-accent-cyan/10 text-accent-cyan' : 'border-white/10 bg-white/[0.04] text-text-primary hover:border-white/20 hover:bg-white/[0.075]'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none rounded-xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-accent-cyan">
        <GripVertical size={16} />
      </div>
      <span className="hidden w-8 text-right font-mono text-xs text-text-muted sm:block">{index + 1}</span>
      <button className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] shadow-lg" onClick={onPlay} aria-label={`Lire ${track.title}`}>
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 text-text-muted">
            <Music size={17} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
          <Play size={17} fill="currentColor" className="ml-0.5 text-white" />
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-black ${isActive ? 'text-accent-cyan' : 'text-text-primary'}`}>{track.title}</div>
        <div className="truncate text-xs text-text-muted">{track.artist}</div>
      </div>
      <div className="hidden w-48 truncate px-4 text-sm text-text-muted md:block">{track.album}</div>
      <div className="flex items-center justify-end gap-3 font-mono text-sm text-text-muted">
        <span>{formatDuration(track.duration)}</span>
        <button onClick={() => onRemove(track.id)} className="rounded-xl p-2 opacity-0 transition-all hover:bg-accent-rose/10 hover:text-accent-rose group-hover:opacity-100" aria-label="Retirer">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playlists, removeTrackFromPlaylist, reorderTracks } = usePlaylistStore();
  const { currentTrack, setQueue } = usePlayerStore();
  const playlist = playlists.find(p => p.id === id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!playlist) {
    return (
      <div className="surface-card flex min-h-[50vh] flex-col items-center justify-center rounded-[2rem] p-8 text-center">
        <ListMusic size={44} className="mb-4 text-text-muted" />
        <p className="text-lg font-bold text-text-primary">Playlist introuvable.</p>
        <button onClick={() => navigate('/playlists')} className="mt-4 rounded-2xl bg-white/[0.08] px-5 py-3 text-sm font-bold text-accent-cyan hover:bg-white/[0.12]">Retour aux playlists</button>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = playlist.tracks.findIndex((t) => t.id === active.id);
      const newIndex = playlist.tracks.findIndex((t) => t.id === over.id);
      reorderTracks(playlist.id, arrayMove(playlist.tracks, oldIndex, newIndex));
    }
  };

  const handlePlayAll = () => {
    if (!playlist.tracks.length) return;
    setQueue(playlist.tracks);
    audioEngine.playAndStart(playlist.tracks[0]);
  };

  const handlePlayTrack = (index: number) => {
    const track = playlist.tracks[index];
    if (!track) return;
    setQueue(playlist.tracks);
    audioEngine.playAndStart(track);
  };

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const heroArtwork = playlist.coverUrl || playlist.tracks.find(track => track.artworkUrl)?.artworkUrl;

  return (
    <div className="space-y-8 pb-10">
      <button onClick={() => navigate('/playlists')} className="surface-card inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft size={18} /> Retour aux playlists
      </button>

      <section className="surface-card-strong aurora-ring relative overflow-hidden rounded-[2rem] p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-violet/20 blur-3xl" />
        <div className="absolute -bottom-28 left-16 h-72 w-72 rounded-full bg-accent-cyan/15 blur-3xl" />
        <div className="relative grid gap-8 md:grid-cols-[220px_1fr] md:items-end">
          <div className="aspect-square w-full max-w-[220px] overflow-hidden rounded-[2rem] bg-white/[0.06] shadow-2xl glow-cyan">
            {heroArtwork ? (
              <img src={heroArtwork} alt={playlist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-cyan/15 to-accent-violet/15 text-text-muted">
                <Music size={56} />
              </div>
            )}
          </div>
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-accent-cyan">
              <ListMusic size={14} /> Playlist
            </div>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight text-text-primary md:text-6xl">{playlist.name}</h1>
            <p className="mt-4 flex items-center gap-2 font-mono text-sm text-text-muted">
              {playlist.tracks.length} titre{playlist.tracks.length > 1 ? 's' : ''} • {Math.floor(totalDuration / 60)} min
            </p>
            <button onClick={handlePlayAll} disabled={playlist.tracks.length === 0} className="command-button mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50">
              <Play size={20} fill="currentColor" /> Tout lire
            </button>
          </div>
        </div>
      </section>

      {playlist.tracks.length === 0 ? (
        <section className="surface-card flex min-h-[320px] flex-col items-center justify-center rounded-[2rem] p-8 text-center text-text-muted">
          <Music size={46} className="mb-4 opacity-30" />
          <h2 className="text-2xl font-black text-text-primary">Playlist vide</h2>
          <p className="mt-3 max-w-md text-sm leading-6">Ajoute des titres depuis la bibliothèque, Drive ou une liste de morceaux.</p>
        </section>
      ) : (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          <div className="mb-4 flex items-center gap-4 border-b border-white/10 pb-4 text-[11px] font-black uppercase tracking-[0.22em] text-text-muted">
            <div className="w-8" />
            <div className="hidden w-8 text-right sm:block">#</div>
            <div className="flex-1">Titre</div>
            <div className="hidden w-48 px-4 md:block">Album</div>
            <div className="flex w-16 justify-end"><Clock size={14} /></div>
          </div>
          <div className="space-y-2">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={playlist.tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {playlist.tracks.map((track, index) => (
                  <SortableTrack key={track.id} track={track} index={index} onRemove={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)} onPlay={() => handlePlayTrack(index)} isActive={currentTrack?.id === track.id} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </section>
      )}
    </div>
  );
};
