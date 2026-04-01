import { Repeat2 } from "lucide-react";

export default function EventCard({ event, onClick }) {
  const borderColor = event.color || "#6366f1";

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className="w-full text-left text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: `${borderColor}15`,
      }}
    >
      <span className={event.is_exception ? "italic" : ""}>{event.title}</span>
      {event.recurrence_rule && (
        <Repeat2
          className="inline-block w-3 h-3 ml-1 opacity-50"
          aria-hidden="true"
        />
      )}
    </button>
  );
}
