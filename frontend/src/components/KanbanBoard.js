import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import { Skeleton } from "./ui/skeleton";

const COLUMNS = [
  { id: "todo", title: "Pendiente", color: "#71717A" },
  { id: "in_progress", title: "En Progreso", color: "#EAB30B" },
  { id: "done", title: "Completado", color: "#22C55E" },
];

export default function KanbanBoard({
  tasks,
  loading,
  onUpdateStatus,
  onEditTask,
  onDeleteTask,
}) {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Check if dropped on a column
    const column = COLUMNS.find((col) => col.id === overId);
    if (column) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== column.id) {
        onUpdateStatus(taskId, column.id);
      }
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== overTask.status) {
        onUpdateStatus(taskId, overTask.status);
      }
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const overId = over.id;

    // Get the column we're over
    const column = COLUMNS.find((col) => col.id === overId);
    if (column) {
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== column.id) {
        // Preview the move
      }
    }
  };

  if (loading) {
    return (
      <div className="kanban-board" data-testid="kanban-loading">
        {COLUMNS.map((column) => (
          <div key={column.id} className="kanban-column">
            <div className="kanban-column-header">
              <Skeleton className="h-5 w-24 bg-zinc-800" />
            </div>
            <div className="kanban-column-content">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full mb-2 bg-zinc-800 rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="kanban-board" data-testid="kanban-board">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
