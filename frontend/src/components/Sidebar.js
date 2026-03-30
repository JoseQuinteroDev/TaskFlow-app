import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  CheckSquare,
  LayoutDashboard,
  Tag,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";

const COLORS = [
  "#EF4444", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6", "#EC4899", "#71717A"
];

export default function Sidebar({ 
  collapsed, 
  onToggle, 
  categories, 
  onCreateCategory,
  filterCategory,
  onFilterCategory 
}) {
  const { logout } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(COLORS[0]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const handleCreateCategory = () => {
    if (newCategoryName.trim()) {
      onCreateCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setNewCategoryName("");
      setNewCategoryColor(COLORS[0]);
      setIsCategoryDialogOpen(false);
    }
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#09090B] border-r border-zinc-800 flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
      data-testid="sidebar"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-zinc-50" />
            <span className="text-lg font-bold text-zinc-50 tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              TaskFlow
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-4">
          <Button
            variant="ghost"
            className={`w-full justify-start text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 ${
              !filterCategory ? "bg-zinc-800 text-zinc-50" : ""
            }`}
            onClick={() => onFilterCategory("")}
            data-testid="nav-dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
            {!collapsed && <span className="ml-3">Dashboard</span>}
          </Button>
        </div>

        {/* Categories */}
        {!collapsed && (
          <div className="px-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest text-zinc-500">
                Categorías
              </span>
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-500 hover:text-zinc-50 hover:bg-zinc-800"
                    data-testid="add-category-button"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#18181B] border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-zinc-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      Nueva Categoría
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label className="text-zinc-300">Nombre</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="mt-1 bg-[#09090B] border-zinc-700 text-zinc-50"
                        data-testid="category-name-input"
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-300">Color</Label>
                      <div className="flex gap-2 mt-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewCategoryColor(color)}
                            className={`w-8 h-8 rounded-full transition-transform ${
                              newCategoryColor === color ? "ring-2 ring-zinc-50 scale-110" : ""
                            }`}
                            style={{ backgroundColor: color }}
                            data-testid={`color-option-${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateCategory}
                      className="w-full bg-zinc-50 text-zinc-950 hover:bg-zinc-200"
                      data-testid="create-category-submit"
                    >
                      Crear Categoría
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className={`w-full justify-start text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800 ${
                    filterCategory === category.id ? "bg-zinc-800 text-zinc-50" : ""
                  }`}
                  onClick={() => onFilterCategory(filterCategory === category.id ? "" : category.id)}
                  data-testid={`category-${category.id}`}
                >
                  <Tag className="w-4 h-4" style={{ color: category.color }} />
                  <span className="ml-3 truncate">{category.name}</span>
                  {filterCategory === category.id && (
                    <X className="w-3 h-3 ml-auto" />
                  )}
                </Button>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-zinc-600 px-3 py-2">
                  No hay categorías
                </p>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
          onClick={logout}
          data-testid="logout-button"
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span className="ml-3">Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
