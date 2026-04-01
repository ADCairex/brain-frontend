import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@shared/components/ui/button";
import { useEvents } from "@calendar/hooks/useEvents";
import CalendarGrid from "@calendar/components/CalendarGrid";
import EventForm from "@calendar/components/EventForm";
import EventDetail from "@calendar/components/EventDetail";
import RecurrenceScopeDialog from "@calendar/components/RecurrenceScopeDialog";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const { events, loading, error, create, update, remove } = useEvents(
    year,
    month
  );

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [formDefaultDate, setFormDefaultDate] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [scopeDialog, setScopeDialog] = useState({
    open: false,
    action: null,
    event: null,
  });
  const [pendingScope, setPendingScope] = useState(null);

  // Month navigation
  const goNext = () => setCurrentDate((d) => addMonths(d, 1));
  const goPrev = () => setCurrentDate((d) => subMonths(d, 1));
  const goToday = () => setCurrentDate(new Date());

  // Click handlers
  function handleDayClick(day) {
    setFormDefaultDate(day);
    setEditingEvent(null);
    setShowForm(true);
  }

  function handleEventClick(event) {
    setSelectedEvent(event);
  }

  // Create
  async function handleCreate(data) {
    try {
      await create(data);
      setShowForm(false);
      toast.success("Evento creado");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Edit flow
  function handleEditClick() {
    if (selectedEvent.recurrence_rule) {
      setScopeDialog({ open: true, action: "edit", event: selectedEvent });
    } else {
      setEditingEvent(selectedEvent);
      setSelectedEvent(null);
      setShowForm(true);
    }
  }

  // Delete flow
  function handleDeleteClick() {
    if (selectedEvent.recurrence_rule) {
      setScopeDialog({ open: true, action: "delete", event: selectedEvent });
    } else {
      doDelete(selectedEvent, "all", null);
    }
  }

  async function doDelete(event, scope, occurrenceDate) {
    try {
      const occDate =
        occurrenceDate ||
        (event.occurrence_start
          ? format(new Date(event.occurrence_start), "yyyy-MM-dd")
          : null);
      await remove(event.id, scope, scope !== "all" ? occDate : null);
      setSelectedEvent(null);
      toast.success("Evento eliminado");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUpdate(data) {
    try {
      const scope = pendingScope || "all";
      const occDate =
        scope !== "all" && editingEvent.occurrence_start
          ? format(new Date(editingEvent.occurrence_start), "yyyy-MM-dd")
          : null;
      await update(editingEvent.id, data, scope, occDate);
      setShowForm(false);
      setEditingEvent(null);
      setPendingScope(null);
      toast.success("Evento actualizado");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Scope dialog handler
  function handleScopeSelect(scope) {
    const { action, event } = scopeDialog;
    setScopeDialog({ open: false, action: null, event: null });

    if (action === "delete") {
      doDelete(event, scope, null);
    } else if (action === "edit") {
      setPendingScope(scope);
      setEditingEvent(event);
      setSelectedEvent(null);
      setShowForm(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto px-4 pt-8 pb-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h1>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <CalendarGrid
            events={events}
            currentDate={currentDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </motion.div>

      {/* Event Form Modal */}
      <EventForm
        open={showForm}
        event={editingEvent}
        defaultDate={formDefaultDate}
        onSubmit={editingEvent ? handleUpdate : handleCreate}
        onCancel={() => {
          setShowForm(false);
          setEditingEvent(null);
          setPendingScope(null);
        }}
      />

      {/* Event Detail Modal */}
      <EventDetail
        open={!!selectedEvent}
        event={selectedEvent}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onClose={() => setSelectedEvent(null)}
      />

      {/* Recurrence Scope Dialog */}
      <RecurrenceScopeDialog
        open={scopeDialog.open}
        action={scopeDialog.action}
        onSelect={handleScopeSelect}
        onCancel={() =>
          setScopeDialog({ open: false, action: null, event: null })
        }
      />
    </div>
  );
}
