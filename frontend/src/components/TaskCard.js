import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Calendar, MoreHorizontal, Pencil, Trash2, Bell, Tag } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { es } from "date-fns/locale";

const PRIORITY_STYLES = {
  high: "priority-high",
  medium: "priority-medium",
  low: "priority-low",
};

const PRIORITY_LABELS = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export default function TaskCard({ task, onEdit, onDelete, isDragging = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== "done";
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  const handleCardClick = (e) => {
    // Prevent opening edit modal when clicking on the menu
    if (e.target.closest('[data-testid^="task-menu"]') || e.target.closest('[role="menu"]')) {
      return;
    }
    onEdit?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`task-card ${isDragging || isSortableDragging ? "dragging" : ""}`}
      data-testid={`task-card-${task.id}`}
      onClick={handleCardClick}
    >
      {/* Header with priority and menu */}
      <div className="flex items-start justify-between mb-2">
        <span className={`badge-priority ${PRIORITY_STYLES[task.priority]}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800"
              onClick={(e) => e.stopPropagation()}
              data-testid={`task-menu-${task.id}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#18181B] border-zinc-800" align="end">
            <DropdownMenuItem
              className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              data-testid={`edit-task-${task.id}`}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-400 focus:bg-zinc-800 focus:text-red-400 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              data-testid={`delete-task-${task.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title */}
      <h3 className="text-zinc-50 font-medium mb-1 line-clamp-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-zinc-500 text-sm mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer with date, reminder, and tags */}
      <div className="flex flex-wrap items-center gap-2 mt-auto">
        {task.due_date && (
          <div
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              isOverdue
                ? "bg-red-500/10 text-red-400"
                : isDueToday
                ? "bg-amber-500/10 text-amber-400"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>
              {format(parseISO(task.due_date), "d MMM", { locale: es })}
            </span>
          </div>
        )}

        {task.reminder && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400">
            <Bell className="w-3 h-3" />
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-xs text-zinc-500">
                +{task.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
