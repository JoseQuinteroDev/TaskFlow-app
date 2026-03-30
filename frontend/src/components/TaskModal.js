import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Calendar } from "./ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { CalendarIcon, Bell, X, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  task,
  categories,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [reminder, setReminder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "todo");
      setPriority(task.priority || "medium");
      setDueDate(task.due_date ? parseISO(task.due_date) : null);
      setCategory(task.category || "");
      setTags(task.tags || []);
      setReminder(task.reminder ? parseISO(task.reminder) : null);
    } else {
      resetForm();
    }
  }, [task, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(null);
    setCategory("");
    setTags([]);
    setTagInput("");
    setReminder(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);

    const taskData = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      due_date: dueDate ? dueDate.toISOString() : null,
      category: category || null,
      tags,
      reminder: reminder ? reminder.toISOString() : null,
    };

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

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#18181B] border-zinc-800 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-zinc-50 text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {task ? "Modifica los detalles de tu tarea" : "Completa los campos para crear una nueva tarea"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Title */}
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

          {/* Description */}
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

          {/* Status and Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-zinc-800">
                  <SelectItem value="todo" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Pendiente
                  </SelectItem>
                  <SelectItem value="in_progress" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    En Progreso
                  </SelectItem>
                  <SelectItem value="done" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Completado
                  </SelectItem>
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
                  <SelectItem value="low" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Baja
                  </SelectItem>
                  <SelectItem value="medium" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Media
                  </SelectItem>
                  <SelectItem value="high" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Alta
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date and Category row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Fecha límite</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal bg-[#09090B] border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
                    data-testid="task-due-date-button"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d MMM yyyy", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#18181B] border-zinc-800" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className="bg-[#18181B]"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-[#09090B] border-zinc-700 text-zinc-300" data-testid="task-category-select">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181B] border-zinc-800">
                  <SelectItem value="none" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
                    Sin categoría
                  </SelectItem>
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reminder */}
          <div className="space-y-2">
            <Label className="text-zinc-300">Recordatorio</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#09090B] border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
                  data-testid="task-reminder-button"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  {reminder
                    ? format(reminder, "d MMM yyyy, HH:mm", { locale: es })
                    : "Establecer recordatorio"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#18181B] border-zinc-800" align="start">
                <div className="p-4 space-y-4">
                  <Calendar
                    mode="single"
                    selected={reminder}
                    onSelect={(date) => {
                      if (date) {
                        const now = new Date();
                        date.setHours(now.getHours() + 1, 0, 0, 0);
                        setReminder(date);
                      }
                    }}
                    className="bg-[#18181B]"
                  />
                  {reminder && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={format(reminder, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newReminder = new Date(reminder);
                          newReminder.setHours(parseInt(hours), parseInt(minutes));
                          setReminder(newReminder);
                        }}
                        className="bg-[#09090B] border-zinc-700 text-zinc-50"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setReminder(null)}
                        className="text-zinc-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
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
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 text-zinc-300 text-sm rounded"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-zinc-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
              data-testid="task-cancel-button"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
              data-testid="task-submit-button"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
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
