import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Bell, Loader2, X } from "lucide-react";

const REMINDER_TYPES = {
  none: "Sin recordatorio",
  once: "Único",
  recurring: "Recurrente",
};

const toDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIso = (localValue) => {
  if (!localValue) return null;
  const parsed = new Date(localValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export default function TaskModal({ isOpen, onClose, onSubmit, task, categories }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueAt, setDueAt] = useState("");
  const [category, setCategory] = useState("none");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const [reminderType, setReminderType] = useState("none");
  const [reminderOnceAt, setReminderOnceAt] = useState("");
  const [repeatEveryMinutes, setRepeatEveryMinutes] = useState(60);
  const [repeatStartAt, setRepeatStartAt] = useState("");
  const [repeatEndAt, setRepeatEndAt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueAt(toDateTimeLocal(task.due_at || task.due_date));
      setCategory(task.category || "none");
      setTags(task.tags || []);

      const incomingReminderType = task.reminder_type || (task.reminder ? "once" : "none");
      setReminderType(incomingReminderType);
      setReminderOnceAt(toDateTimeLocal(task.reminder_once_at || task.reminder));
      setRepeatEveryMinutes(task.repeat_every_minutes || 60);
      setRepeatStartAt(toDateTimeLocal(task.repeat_start_at));
      setRepeatEndAt(toDateTimeLocal(task.repeat_end_at));
    } else {
      resetForm();
    }
  }, [task, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueAt("");
    setCategory("none");
    setTags([]);
    setTagInput("");

    setReminderType("none");
    setReminderOnceAt("");
    setRepeatEveryMinutes(60);
    setRepeatStartAt("");
    setRepeatEndAt("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_at: toIso(dueAt),
      due_date: toIso(dueAt),
      category: category === "none" ? null : category,
      tags,
      reminder_type: reminderType,
      reminder: reminderType === "once" ? toIso(reminderOnceAt) : null,
      reminder_once_at: reminderType === "once" ? toIso(reminderOnceAt) : null,
      repeat_every_minutes: reminderType === "recurring" ? Number(repeatEveryMinutes) : null,
      repeat_start_at: reminderType === "recurring" ? toIso(repeatStartAt) : null,
      repeat_end_at: reminderType === "recurring" ? toIso(repeatEndAt) : null,
    };

    if (reminderType === "once" && !taskData.reminder_once_at) return;
    if (reminderType === "recurring" && (!taskData.repeat_start_at || !taskData.repeat_end_at)) return;

    setIsSubmitting(true);
    await onSubmit(taskData);
    setIsSubmitting(false);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#18181B] border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-50 text-xl" style={{ fontFamily: "Manrope, sans-serif" }}>
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {task ? "Modifica los detalles de tu tarea" : "Completa los campos para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-300">
              Título <span className="text-red-400">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea"
              required
              className="bg-[#09090B] border-zinc-700 text-zinc-50 focus:border-zinc-500"
              data-testid="task-title-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe la tarea..."
              rows={3}
              className="bg-[#09090B] border-zinc-700 text-zinc-50 resize-none focus:border-zinc-500"
              data-testid="task-description-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-zinc-800">
                  <SelectItem value="todo">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="done">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-priority-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-zinc-800">
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Vencimiento (fecha y hora)</Label>
              <Input
                type="datetime-local"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="bg-[#09090B] border-zinc-700 text-zinc-50"
                data-testid="task-due-at-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-category-select">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-zinc-800">
                  <SelectItem value="none">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 rounded-md border border-zinc-800 p-3">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Bell className="w-4 h-4" /> Configuración de recordatorio
            </Label>
            <Select value={reminderType} onValueChange={setReminderType}>
              <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-reminder-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#18181B] border-zinc-800">
                {Object.entries(REMINDER_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {reminderType === "once" && (
              <div className="space-y-2">
                <Label className="text-zinc-300">Recordatorio único</Label>
                <Input
                  type="datetime-local"
                  value={reminderOnceAt}
                  onChange={(e) => setReminderOnceAt(e.target.value)}
                  className="bg-[#09090B] border-zinc-700 text-zinc-50"
                  data-testid="task-reminder-once-input"
                />
              </div>
            )}

            {reminderType === "recurring" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Repetir cada (minutos)</Label>
                  <Input
                    type="number"
                    min={5}
                    step={5}
                    value={repeatEveryMinutes}
                    onChange={(e) => setRepeatEveryMinutes(e.target.value)}
                    className="bg-[#09090B] border-zinc-700 text-zinc-50"
                    data-testid="task-reminder-repeat-every-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Desde</Label>
                    <Input
                      type="datetime-local"
                      value={repeatStartAt}
                      onChange={(e) => setRepeatStartAt(e.target.value)}
                      className="bg-[#09090B] border-zinc-700 text-zinc-50"
                      data-testid="task-reminder-repeat-start-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Hasta</Label>
                    <Input
                      type="datetime-local"
                      value={repeatEndAt}
                      onChange={(e) => setRepeatEndAt(e.target.value)}
                      className="bg-[#09090B] border-zinc-700 text-zinc-50"
                      data-testid="task-reminder-repeat-end-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Etiquetas</Label>
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Escribe y presiona Enter para agregar"
              className="bg-[#09090B] border-zinc-700 text-zinc-50"
              data-testid="task-tags-input"
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-300 text-sm rounded">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter((item) => item !== tag))} className="text-zinc-500 hover:text-zinc-50">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50" data-testid="task-cancel-button">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()} className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200" data-testid="task-submit-button">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
                </>
              ) : task ? (
                "Guardar cambios"
              ) : (
                "Crear tarea"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
