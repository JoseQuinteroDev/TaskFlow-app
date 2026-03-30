import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Search, Plus, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({
  user,
  searchQuery,
  onSearchChange,
  filterPriority,
  onFilterPriority,
  onAddTask,
}) {
  const { logout } = useAuth();

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-[#09090B] border-b border-zinc-800 sticky top-0 z-40 flex items-center justify-between px-6" data-testid="topbar">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            type="text"
            placeholder="Buscar tareas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64 bg-[#18181B] border-zinc-800 text-zinc-50 placeholder:text-zinc-500 focus:border-zinc-600"
            data-testid="search-input"
          />
        </div>

        <Select value={filterPriority} onValueChange={onFilterPriority}>
          <SelectTrigger className="w-40 bg-[#18181B] border-zinc-800 text-zinc-300" data-testid="priority-filter">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent className="bg-[#18181B] border-zinc-800">
            <SelectItem value="all" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
              Todas
            </SelectItem>
            <SelectItem value="high" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
              Alta
            </SelectItem>
            <SelectItem value="medium" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
              Media
            </SelectItem>
            <SelectItem value="low" className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50">
              Baja
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          onClick={onAddTask}
          className="bg-zinc-50 text-zinc-950 hover:bg-zinc-200 font-medium"
          data-testid="add-task-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tarea
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full" data-testid="user-menu-button">
              <Avatar className="h-10 w-10 bg-zinc-800 border border-zinc-700">
                <AvatarFallback className="bg-zinc-800 text-zinc-50 text-sm font-medium">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#18181B] border-zinc-800" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-zinc-50">{user?.name}</p>
                <p className="text-xs text-zinc-400">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-50 cursor-pointer" data-testid="menu-profile">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem
              className="text-red-400 focus:bg-zinc-800 focus:text-red-400 cursor-pointer"
              onClick={logout}
              data-testid="menu-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
