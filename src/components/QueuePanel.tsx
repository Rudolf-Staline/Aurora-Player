import React from 'react';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Track } from '../store/usePlayerStore';

interface QueuePanelProps {
  onClose: () => void;
}

const SortableTrackItem = ({ track }: { track: Track }) => {
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
      className={`flex items-center gap-3 p-3 rounded-xl border ${isPlaying ? 'bg-accent-cyan/10 border-accent-cyan/30' : 'bg-white/5 border-transparent hover:bg-white/10'} group transition-colors`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-text-muted hover:text-text-primary p-1">
        <GripVertical size={16} />
      </div>
      <div className="flex-1 min-w-0" onDoubleClick={() => playTrack(track)}>
        <p className={`text-sm font-medium truncate ${isPlaying ? 'text-accent-cyan' : 'text-text-primary'}`}>{track.title}</p>
        <p className="text-xs text-text-muted truncate">{track.artist}</p>
      </div>
      <button 
        onClick={() => removeFromQueue(track.id)}
        className="text-text-muted hover:text-accent-rose opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-full hover:bg-white/5"
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
    <div className="absolute bottom-24 right-6 w-96 bg-bg-secondary border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col z-50">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <h3 className="font-display font-bold text-lg text-text-primary">Up Next</h3>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
             <button 
               onClick={clearQueue}
               className="text-xs font-medium text-text-muted hover:text-accent-rose px-2 py-1 rounded transition-colors"
             >
               Clear
             </button>
          )}
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 max-h-[400px]">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <p className="text-sm">Your queue is empty.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={queue.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {queue.map((track) => (
                <SortableTrackItem key={track.id} track={track} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};