import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { Pencil, Trash2, Volume2, GripVertical } from "lucide-react";

interface CommCard {
  id: string;
  label: string;
  emoji?: string;
  category: string;
  color?: string;
  sortOrder: number;
  isPhrase: boolean;
  isActive: boolean;
  createdAt: string;
}

interface Props {
  card: CommCard;
  lastTapped: string | null;
  onTap: (card: CommCard) => void;
  onEdit: (card: CommCard) => void;
  onDelete: (id: string) => void;
  reorderMode: boolean;
}

export function SortableCommCard({ card, lastTapped, onTap, onEdit, onDelete, reorderMode }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, disabled: !reorderMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <button
      ref={setNodeRef}
      style={style}
      onClick={() => !reorderMode && onTap(card)}
      className={cn(
        "relative group rounded-xl border-2 p-4 text-center transition-all duration-150",
        "hover:shadow-md tap-target",
        "bg-card text-card-foreground border-border",
        card.isPhrase && "col-span-2",
        lastTapped === card.id && "ring-2 ring-primary border-primary bg-primary/10 scale-105",
        isDragging && "opacity-50 z-50 shadow-lg",
        reorderMode && "cursor-grab active:cursor-grabbing border-dashed border-primary/40",
        !reorderMode && "active:scale-95"
      )}
      aria-label={reorderMode ? `Drag to reorder: ${card.label}` : `Say: ${card.label}`}
      {...(reorderMode ? { ...attributes, ...listeners } : {})}
    >
      {reorderMode && (
        <GripVertical className="absolute top-2 right-2 h-4 w-4 text-muted-foreground" />
      )}
      {card.emoji && <span className="text-3xl block mb-1">{card.emoji}</span>}
      <span className={cn("font-medium", card.isPhrase ? "text-base" : "text-sm")}>{card.label}</span>
      {lastTapped === card.id && (
        <Volume2 className="absolute top-2 right-2 h-4 w-4 text-primary animate-pulse" />
      )}
      {/* Edit/delete on hover - only in normal mode */}
      {!reorderMode && (
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
          <button onClick={(e) => { e.stopPropagation(); onEdit(card); }} className="p-1 rounded hover:bg-muted" aria-label="Edit card">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(card.id); }} className="p-1 rounded hover:bg-muted" aria-label="Delete card">
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        </div>
      )}
    </button>
  );
}
