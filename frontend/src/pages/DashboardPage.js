import { useState, useEffect, useCallback } from "react";

import { categoriesApi, statsApi, tasksApi } from "../api/taskflowApi";
import { formatApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import StatsCards from "../components/StatsCards";
import KanbanBoard from "../components/KanbanBoard";
import TaskModal from "../components/TaskModal";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterPriority) params.priority = filterPriority;
      if (filterCategory) params.category = filterCategory;

      setTasks(await tasksApi.list(params));
    } catch (error) {
      toast.error(formatApiError(error, "Error al cargar las tareas"));
    }
  }, [searchQuery, filterPriority, filterCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      setCategories(await categoriesApi.list());
    } catch (error) {
      toast.error(formatApiError(error, "Error al cargar categorías"));
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setStats(await statsApi.get());
    } catch (error) {
      toast.error(formatApiError(error, "Error al cargar estadísticas"));
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTasks(), fetchCategories(), fetchStats()]);
    setLoading(false);
  }, [fetchTasks, fetchCategories, fetchStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTask = async (taskData) => {
    try {
      await tasksApi.create(taskData);
      toast.success("Tarea creada exitosamente");
      loadData();
      setIsTaskModalOpen(false);
    } catch (error) {
      toast.error(formatApiError(error, "Error al crear la tarea"));
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      await tasksApi.update(taskId, taskData);
      toast.success("Tarea actualizada exitosamente");
      loadData();
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast.error(formatApiError(error, "Error al actualizar la tarea"));
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await tasksApi.remove(taskId);
      toast.success("Tarea eliminada exitosamente");
      loadData();
    } catch (error) {
      toast.error(formatApiError(error, "Error al eliminar la tarea"));
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksApi.updateStatus(taskId, newStatus);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)));
      fetchStats();
    } catch (error) {
      toast.error(formatApiError(error, "Error al actualizar el estado"));
      fetchTasks();
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleCreateCategory = async (categoryData) => {
    try {
      await categoriesApi.create(categoryData);
      toast.success("Categoría creada exitosamente");
      fetchCategories();
    } catch (error) {
      toast.error(formatApiError(error, "Error al crear la categoría"));
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        categories={categories}
        onCreateCategory={handleCreateCategory}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-16" : "ml-60"}`}>
        <Topbar
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterPriority={filterPriority}
          onFilterPriority={setFilterPriority}
          onAddTask={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
        />

        <main className="p-6">
          <StatsCards stats={stats} loading={loading} />

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-50 mb-4 tracking-tight" style={{ fontFamily: "Manrope, sans-serif" }}>
              Tablero de Tareas
            </h2>
            <KanbanBoard
              tasks={tasks}
              loading={loading}
              onUpdateStatus={handleUpdateTaskStatus}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </main>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
        task={editingTask}
        categories={categories}
      />
    </div>
  );
}
