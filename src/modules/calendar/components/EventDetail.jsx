import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2, MapPin, Repeat2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";

function rruleToLabel(rule) {
  if (!rule) return null;
  const upper = rule.toUpperCase();
  if (upper.includes("FREQ=DAILY")) return "Cada día";
  if (upper.includes("FREQ=WEEKLY")) {
    const match = upper.match(/BYDAY=([A-Z,]+)/);
    const dayMap = {
      MO: "lunes",
      TU: "martes",
      WE: "miércoles",
      TH: "jueves",
      FR: "viernes",
      SA: "sábado",
      SU: "domingo",
    };
    if (match) {
      const days = match[1]
        .split(",")
        .map((d) => dayMap[d] || d)
        .join(", ");
      return `Semanalmente los ${days}`;
    }
    return "Semanalmente";
  }
  if (upper.includes("FREQ=MONTHLY")) {
    const match = upper.match(/BYMONTHDAY=(\d+)/);
    return match ? `Mensualmente el día ${match[1]}` : "Mensualmente";
  }
  if (upper.includes("FREQ=YEARLY")) return "Anualmente";
  return "Recurrente";
}

export default function EventDetail({
  event,
  onEdit,
  onDelete,
  onClose,
  open,
}) {
  if (!event) return null;

  const start = new Date(event.occurrence_start || event.start_at);
  const end =
    event.occurrence_end || event.end_at
      ? new Date(event.occurrence_end || event.end_at)
      : null;
  const recLabel = rruleToLabel(event.recurrence_rule);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.color && (
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: event.color }}
              />
            )}
            {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          {/* Date/time */}
          <p>
            {event.all_day
              ? format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
              : format(start, "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
            {end && !event.all_day && ` — ${format(end, "HH:mm")}`}
          </p>

          {/* Location */}
          {event.location && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {event.location}
            </p>
          )}

          {/* Recurrence */}
          {recLabel && (
            <p className="flex items-center gap-1.5">
              <Repeat2 className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {recLabel}
            </p>
          )}

          {/* Description */}
          {event.description && (
            <p className="text-slate-500 dark:text-slate-400 whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-1" aria-hidden="true" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" aria-hidden="true" />
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
