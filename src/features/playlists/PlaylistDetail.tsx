import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylistStore } from '../../store/usePlaylistStore';
import { usePlayerStore } from '../../store/usePlayerStore';
import { audioEngine } from '../../core/audio_engine';
import { Play, ArrowLeft, GripVertical, Trash2, Clock, Music } from 'lucide-react';
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

const SortableTrack: React.FC<SortableTrackProps> = ({ track, index, onRemove, onPlay, isActive }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors ${isActive ? 'bg-white/10 text-accent-cyan' : 'text-text-primary'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-accent-cyan text-text-muted p-2 touch-none">
        <GripVertical size={16} />
      </div>
      
      <span className="w-8 text-right text-sm text-text-muted font-mono">{index + 1}</span>
      
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-white/5 cursor-pointer" onClick={onPlay}>
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
             <Music size={16} />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
           <Play size={16} fill="currentColor" className="ml-0.5 text-white" />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden min-w-0">
        <div className={`truncate font-medium ${isActive ? 'text-accent-cyan' : 'text-text-primary'}`}>
          {track.title}
        </div>
        <div className="truncate text-sm text-text-muted">{track.artist}</div>
      </div>
      
      <div className="hidden md:block w-48 text-sm text-text-muted truncate px-4">
        {track.album}
      </div>
      
      <div className="w-16 text-right text-sm text-text-muted font-mono flex items-center gap-4 justify-end">
        <span>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '--:--'}</span>
        <button 
           onClick={() => onRemove(track.id)}
           className="opacity-0 group-hover:opacity-100 p-1 hover:text-accent-rose hover:bg-accent-rose/10 rounded transition-all text-text-muted"
        >
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
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <p className="text-text-muted">Playlist not found.</p>
        <button onClick={() => navigate('/playlists')} className="text-accent-cyan hover:underline">Go back to Playlists</button>
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
      if (!playlist?.tracks.length) return;
      setQueue(playlist.tracks);
      audioEngine.playAndStart(playlist.tracks[0]);
  };

  const handlePlayTrack = (index: number) => {
      if (!playlist?.tracks.length) return;
      const track = playlist.tracks[index];
      if (!track) return;
      setQueue(playlist.tracks);
      audioEngine.playAndStart(track);
  };

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="space-y-8 pb-10">
      <button 
        onClick={() => navigate('/playlists')} 
        className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors bg-white/5 px-4 py-2 rounded-lg w-fit"
      >
        <ArrowLeft size={18} />
        Back to Playlists
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-end border-b border-white/5 pb-8">
         <div className="h-48 w-48 shrink-0 rounded-2xl overflow-hidden shadow-2xl glow-cyan bg-white/5 flex items-center justify-center">
             {playlist.coverUrl ? (
                 <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
             ) : (
                 <Music size={48} className="text-text-muted/30" />
             )}
         </div>
         <div className="flex-1 min-w-0">
             <h4 className="text-sm font-semibold uppercase tracking-wider text-text-muted mb-2">Playlist</h4>
             <h1 className="text-5xl md:text-6xl font-display font-bold text-text-primary mb-4 truncate">{playlist.name}</h1>
             <p className="text-text-muted flex items-center gap-2 font-mono">
                 {playlist.tracks.length} tracks • {Math.floor(totalDuration / 60)} min
             </p>
         </div>
      </div>

      <div className="flex items-center gap-4 py-4">
          <button 
             onClick={handlePlayAll}
             disabled={playlist.tracks.length === 0}
             className="flex items-center gap-2 bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90 text-bg-primary px-8 py-3 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
             <Play size={20} fill="currentColor" />
             Play All
          </button>
      </div>

      {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
             <p>This playlist is empty.</p>
             <p className="text-sm mt-2">Right-click a track in your Library to add it here.</p>
          </div>
      ) : (
          <div className="bg-glass rounded-2xl border border-white/5 overflow-hidden">
             <div className="flex items-center gap-4 p-4 border-b border-white/5 text-xs font-semibold uppercase tracking-wider text-text-muted select-none">
                 <div className="w-8"></div> {/* drag handle space */}
                 <div className="w-8 text-right">#</div>
                 <div className="flex-1 pl-14">Title</div>
                 <div className="hidden md:block w-48 px-4">Album</div>
                 <div className="w-16 text-right flex justify-end"><Clock size={14} /></div>
             </div>
             
             <div className="p-2 space-y-1">
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={playlist.tracks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                        {playlist.tracks.map((track, index) => (
                            <SortableTrack 
                               key={track.id} 
                               track={track} 
                               index={index} 
                               onRemove={(trackId) => removeTrackFromPlaylist(playlist.id, trackId)}
                               onPlay={() => handlePlayTrack(index)}
                               isActive={currentTrack?.id === track.id}
                            />
                        ))}
                    </SortableContext>
                 </DndContext>
             </div>
          </div>
      )}
    </div>
  );
};
