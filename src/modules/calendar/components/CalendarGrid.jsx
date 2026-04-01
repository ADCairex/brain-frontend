import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import EventCard from "./EventCard";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function CalendarGrid({
  events,
  currentDate,
  onDayClick,
  onEventClick,
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Pad to 42 cells (6 rows)
  while (days.length < 42) {
    const last = days[days.length - 1];
    days.push(
      new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    );
  }

  function getEventsForDay(day) {
    return events.filter((e) => {
      const start = new Date(e.occurrence_start);
      return isSameDay(start, day);
    });
  }

  return (
    <div className="select-none">
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 border-t border-l border-slate-200 dark:border-slate-700">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          const maxVisible = 3;

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={[
                "min-h-[100px] p-1 border-r border-b border-slate-200 dark:border-slate-700 cursor-pointer",
                "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                !inMonth && "opacity-40",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center justify-center mb-1">
                <span
                  className={[
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                    today
                      ? "bg-sky-500 text-white"
                      : "text-slate-700 dark:text-slate-300",
                  ].join(" ")}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((event, j) => (
                  <EventCard
                    key={`${event.id}-${j}`}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
                {dayEvents.length > maxVisible && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                    +{dayEvents.length - maxVisible} más
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
