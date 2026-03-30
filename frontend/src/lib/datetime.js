import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function parseTaskDate(value) {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function formatTaskDateTime(value) {
  const parsed = parseTaskDate(value);
  if (!parsed) return "";
  return format(parsed, "d MMM yyyy, HH:mm", { locale: es });
}
