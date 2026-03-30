import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, tasks, onEditTask, onDeleteTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      className={`kanban-column ${isOver ? "drag-over" : ""}`}
      data-testid={`column-${column.id}`}
    >
      <div className="kanban-column-header">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-zinc-50 font-semibold">{column.title}</span>
          <span className="text-zinc-500 text-sm ml-auto">{tasks.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="kanban-column-content"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="text-center py-8 text-zinc-600 text-sm">
            No hay tareas
          </div>
        )}
      </div>
    </div>
  );
}
