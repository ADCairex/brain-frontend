import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { Button } from "@shared/components/ui/button";
import { Label } from "@shared/components/ui/label";
import { Switch } from "@shared/components/ui/switch";

const COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
];

const RECURRENCE_OPTIONS = [
  { value: "", label: "No se repite" },
  { value: "daily", label: "Cada día" },
  { value: "weekly", label: "Cada semana" },
  { value: "monthly", label: "Cada mes" },
  { value: "yearly", label: "Cada año" },
];

const schema = z
  .object({
    title: z.string().min(1, "El título es obligatorio").max(255),
    description: z.string().optional().default(""),
    start_date: z.string().min(1, "La fecha de inicio es obligatoria"),
    start_time: z.string().optional().default("09:00"),
    end_date: z.string().optional().default(""),
    end_time: z.string().optional().default(""),
    all_day: z.boolean().default(false),
    color: z.string().optional().default(""),
    location: z.string().max(255).optional().default(""),
    recurrence_preset: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      if (data.end_date && data.start_date) {
        const start = new Date(
          `${data.start_date}T${data.start_time || "00:00"}`
        );
        const end = new Date(`${data.end_date}T${data.end_time || "23:59"}`);
        return end >= start;
      }
      return true;
    },
    {
      message: "La fecha de fin debe ser posterior a la de inicio",
      path: ["end_date"],
    }
  );

export default function EventForm({
  event,
  defaultDate,
  onSubmit,
  onCancel,
  open,
}) {
  const isEdit = !!event;

  function getDefaults() {
    if (event) {
      const s = new Date(event.occurrence_start || event.start_at);
      const e =
        event.occurrence_end || event.end_at
          ? new Date(event.occurrence_end || event.end_at)
          : null;
      return {
        title: event.title,
        description: event.description || "",
        start_date: format(s, "yyyy-MM-dd"),
        start_time: format(s, "HH:mm"),
        end_date: e ? format(e, "yyyy-MM-dd") : "",
        end_time: e ? format(e, "HH:mm") : "",
        all_day: event.all_day,
        color: event.color || "",
        location: event.location || "",
        recurrence_preset: "",
      };
    }
    const d = defaultDate || new Date();
    return {
      title: "",
      description: "",
      start_date: format(d, "yyyy-MM-dd"),
      start_time: "09:00",
      end_date: "",
      end_time: "",
      all_day: false,
      color: "",
      location: "",
      recurrence_preset: "",
    };
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaults(),
  });

  const allDay = watch("all_day");
  const selectedColor = watch("color");

  function onFormSubmit(data) {
    const startStr = data.all_day
      ? `${data.start_date}T00:00:00Z`
      : `${data.start_date}T${data.start_time}:00Z`;

    let endStr = null;
    if (data.end_date) {
      endStr = data.all_day
        ? `${data.end_date}T23:59:59Z`
        : `${data.end_date}T${data.end_time || "23:59"}:00Z`;
    }

    const payload = {
      title: data.title,
      description: data.description || null,
      start_at: startStr,
      end_at: endStr,
      all_day: data.all_day,
      color: data.color || null,
      location: data.location || null,
    };

    if (data.recurrence_preset) {
      payload.recurrence_preset = data.recurrence_preset;
    }

    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar evento" : "Nuevo evento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Título del evento"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Opcional"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="all_day"
              checked={allDay}
              onCheckedChange={(v) => setValue("all_day", v)}
            />
            <Label htmlFor="all_day">Todo el día</Label>
          </div>

          {/* Start date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start_date">Inicio</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
              {errors.start_date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.start_date.message}
                </p>
              )}
            </div>
            {!allDay && (
              <div>
                <Label htmlFor="start_time">Hora</Label>
                <Input
                  id="start_time"
                  type="time"
                  {...register("start_time")}
                />
              </div>
            )}
          </div>

          {/* End date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="end_date">Fin (opcional)</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
              {errors.end_date && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.end_date.message}
                </p>
              )}
            </div>
            {!allDay && (
              <div>
                <Label htmlFor="end_time">Hora</Label>
                <Input id="end_time" type="time" {...register("end_time")} />
              </div>
            )}
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Ubicación</Label>
            <Input
              id="location"
              placeholder="Opcional"
              {...register("location")}
            />
          </div>

          {/* Color picker */}
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setValue("color", selectedColor === c ? "" : c)
                  }
                  className={[
                    "w-7 h-7 rounded-full border-2 transition-transform",
                    selectedColor === c
                      ? "border-slate-900 dark:border-white scale-110"
                      : "border-transparent hover:scale-105",
                  ].join(" ")}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          {!isEdit && (
            <div>
              <Label htmlFor="recurrence">Repetición</Label>
              <select
                id="recurrence"
                {...register("recurrence_preset")}
                className="w-full mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
