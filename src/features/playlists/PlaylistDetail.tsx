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
      className={`group flex items-center gap-3 rounded-xl border p-3 transition-all ${isActive ? 'state-active border-premium-strong text-text-primary' : 'border-transparent text-text-primary hover:border-premium hover:bg-white/[0.04]'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none rounded-lg p-2 text-text-muted/70 transition-colors hover:bg-white/[0.06] hover:text-accent-primary">
        <GripVertical size={16} />
      </div>
      <span className={`hidden w-8 text-right font-mono text-xs sm:block ${isActive ? 'text-accent-primary' : 'text-text-muted'}`}>{index + 1}</span>
      <button className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border-premium bg-bg-elevated shadow-deep" onClick={onPlay} aria-label={`Lire ${track.title}`}>
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-elevated text-text-muted">
            <Music size={17} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Play size={17} fill="currentColor" className="ml-0.5 text-text-primary" />
        </div>
      </button>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-semibold ${isActive ? 'text-accent-primary' : 'text-text-primary'}`}>{track.title}</div>
        <div className="truncate text-xs text-text-muted">{track.artist}</div>
      </div>
      <div className="hidden w-48 truncate px-4 text-sm text-text-muted md:block">{track.album}</div>
      <div className="flex items-center justify-end gap-3 font-mono text-sm text-text-muted">
        <span>{formatDuration(track.duration)}</span>
        <button onClick={() => onRemove(track.id)} className="rounded-lg p-2 opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100" aria-label="Retirer">
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
      <div className="surface-card flex min-h-[50vh] flex-col items-center justify-center rounded-[2rem] p-10 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border-premium bg-bg-elevated text-text-muted">
          <ListMusic size={36} />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-text-primary">Playlist introuvable.</p>
        <button onClick={() => navigate('/playlists')} className="btn-secondary mt-6 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
          <ArrowLeft size={16} /> Retour aux playlists
        </button>
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
  const totalMinutes = Math.floor(totalDuration / 60);
  const durationLabel = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)} h ${totalMinutes % 60} min`
    : `${totalMinutes} min`;

  return (
    <div className="space-y-8 pb-12">
      <button onClick={() => navigate('/playlists')} className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft size={18} /> Retour aux playlists
      </button>

      <section className="surface-card-strong relative overflow-hidden rounded-[2rem] p-8 shadow-deep md:p-12">
        <div className="relative grid gap-8 md:grid-cols-[280px_1fr] md:items-end md:gap-12">
          <div className="aspect-square w-full max-w-[280px] overflow-hidden rounded-[1.5rem] border-premium bg-bg-elevated shadow-deep">
            {heroArtwork ? (
              <img src={heroArtwork} alt={playlist.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-bg-elevated to-bg-secondary text-text-muted/40">
                <Music size={58} strokeWidth={1.25} />
              </div>
            )}
          </div>
          <div>
            <span className="eyebrow text-accent-primary">
              <ListMusic size={13} /> Playlist
            </span>
            <h1 className="mt-4 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tight text-text-primary md:text-7xl">{playlist.name}</h1>
            <div className="mt-6 flex items-center gap-4 text-sm text-text-muted">
              <span className="text-text-primary">{playlist.tracks.length} titre{playlist.tracks.length > 1 ? 's' : ''}</span>
              <span className="h-1 w-1 rounded-full bg-text-muted/40" />
              <span className="font-mono">{durationLabel}</span>
            </div>
            <button onClick={handlePlayAll} disabled={playlist.tracks.length === 0} className="btn-primary mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">
              <Play size={19} fill="currentColor" /> Tout lire
            </button>
          </div>
        </div>
      </section>

      {playlist.tracks.length === 0 ? (
        <section className="surface-card flex min-h-[340px] flex-col items-center justify-center rounded-[2rem] p-10 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-premium bg-bg-elevated text-text-muted">
            <Music size={34} />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-text-primary">Playlist vide</h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-text-muted">Ajoutez des titres depuis la bibliothèque, Drive ou une liste de morceaux.</p>
        </section>
      ) : (
        <section className="surface-card rounded-[2rem] p-4 md:p-6">
          <div className="mb-3 flex items-center gap-3 border-b border-white/10 px-3 pb-4 text-[11px] uppercase tracking-[0.22em] text-text-muted">
            <div className="w-9" />
            <div className="hidden w-8 text-right sm:block">#</div>
            <div className="w-12" />
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
