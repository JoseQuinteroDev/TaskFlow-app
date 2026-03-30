import { Skeleton } from "./ui/skeleton";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  TrendingUp,
  Calendar,
  AlertCircle,
} from "lucide-react";

export default function StatsCards({ stats, loading }) {
  const cards = [
    {
      title: "Total de Tareas",
      value: stats?.total || 0,
      icon: ListTodo,
      color: "text-zinc-400",
      bgColor: "bg-zinc-500/10",
    },
    {
      title: "Pendientes",
      value: stats?.todo || 0,
      icon: Clock,
      color: "text-zinc-400",
      bgColor: "bg-zinc-500/10",
    },
    {
      title: "En Progreso",
      value: stats?.in_progress || 0,
      icon: TrendingUp,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Completadas",
      value: stats?.done || 0,
      icon: CheckCircle2,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Alta Prioridad",
      value: stats?.high_priority || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Vencen Hoy",
      value: stats?.due_today || 0,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Vencidas",
      value: stats?.overdue || 0,
      icon: AlertCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Tasa de Completado",
      value: `${stats?.completion_rate || 0}%`,
      icon: CheckCircle2,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-loading">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="stat-card">
            <Skeleton className="h-4 w-24 mb-2 bg-zinc-800" />
            <Skeleton className="h-8 w-16 bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="stats-cards">
      {cards.map((card, index) => (
        <div
          key={index}
          className="stat-card"
          data-testid={`stat-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-zinc-500">
              {card.title}
            </span>
            <div className={`p-2 rounded-md ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-zinc-50" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
