import React from 'react';
import { X, GripVertical, Trash2, ListMusic, Sparkles } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Track } from '../store/usePlayerStore';

interface QueuePanelProps {
  onClose: () => void;
}

const SortableTrackItem = ({ track, index }: { track: Track; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: track.id });
  const { currentTrack, playTrack, removeFromQueue } = usePlayerStore();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPlaying = currentTrack?.id === track.id;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center gap-3 rounded-3xl border p-3 transition-all ${isPlaying ? 'border-accent-cyan/35 bg-accent-cyan/10 text-accent-cyan shadow-lg shadow-accent-cyan/10' : 'border-white/10 bg-white/[0.045] text-text-primary hover:border-white/20 hover:bg-white/[0.075]'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none rounded-xl p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary">
        <GripVertical size={16} />
      </div>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.06] shadow-lg">
        {track.artworkUrl ? (
          <img src={track.artworkUrl} alt={track.title} className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-xs text-text-muted">{index + 1}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 cursor-pointer" onDoubleClick={() => playTrack(track)}>
        <p className={`truncate text-sm font-black ${isPlaying ? 'text-accent-cyan' : 'text-text-primary'}`}>{track.title}</p>
        <p className="truncate text-xs text-text-muted">{track.artist}</p>
      </div>
      <button 
        onClick={() => removeFromQueue(track.id)}
        className="rounded-2xl p-2 text-text-muted opacity-0 transition-all hover:bg-accent-rose/10 hover:text-accent-rose group-hover:opacity-100"
        aria-label="Retirer de la file"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export const QueuePanel: React.FC<QueuePanelProps> = ({ onClose }) => {
  const { queue, reorderQueue, clearQueue } = usePlayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex((t) => t.id === active.id);
      const newIndex = queue.findIndex((t) => t.id === over.id);
      reorderQueue(arrayMove(queue, oldIndex, newIndex));
    }
  };

  return (
    <div className="surface-card-strong flex max-h-[72vh] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] p-4">
      <div className="relative mb-4 flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/10 text-accent-primary">
            <ListMusic size={20} />
          </div>
          <div>
            <p className="eyebrow">À venir</p>
            <h3 className="text-lg font-semibold text-text-primary">File d’attente</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button onClick={clearQueue} className="rounded-2xl px-3 py-2 text-xs font-bold text-text-muted transition-colors hover:bg-accent-rose/10 hover:text-accent-rose">
              Vider
            </button>
          )}
          <button onClick={onClose} className="rounded-2xl p-2 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary" aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 space-y-2 overflow-y-auto pr-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-black/15 px-6 py-14 text-center text-text-muted">
            <Sparkles size={34} className="mb-3 text-text-muted/40" />
            <p className="font-bold text-text-primary">La file est vide</p>
            <p className="mt-2 text-xs leading-5">Ajoute plusieurs titres depuis une liste pour préparer ta session.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={queue.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {queue.map((track, index) => (
                <SortableTrackItem key={track.id} track={track} index={index} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
