import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EventDetail from "@calendar/components/EventDetail";

describe("EventDetail", () => {
  const base = {
    id: 1,
    title: "Dentista",
    description: "Consulta dental",
    occurrence_start: "2026-04-15T10:00:00Z",
    occurrence_end: "2026-04-15T11:00:00Z",
    all_day: false,
    color: "#ef4444",
    location: "Clinica dental",
    recurrence_rule: null,
    is_exception: false,
  };

  const baseProps = {
    event: base,
    open: true,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
  };

  it("renders event title", () => {
    render(<EventDetail {...baseProps} />);
    expect(screen.getByText("Dentista")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<EventDetail {...baseProps} />);
    expect(screen.getByText("Clinica dental")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<EventDetail {...baseProps} />);
    expect(screen.getByText("Consulta dental")).toBeInTheDocument();
  });

  it("shows recurrence label for weekly events", () => {
    const recurring = { ...base, recurrence_rule: "FREQ=WEEKLY;BYDAY=MO" };
    render(<EventDetail {...baseProps} event={recurring} />);
    expect(screen.getByText(/lunes/i)).toBeInTheDocument();
  });

  it("calls onEdit when clicking edit button", async () => {
    const onEdit = vi.fn();
    render(<EventDetail {...baseProps} onEdit={onEdit} />);
    await userEvent.click(screen.getByText("Editar"));
    expect(onEdit).toHaveBeenCalled();
  });

  it("calls onDelete when clicking delete button", async () => {
    const onDelete = vi.fn();
    render(<EventDetail {...baseProps} onDelete={onDelete} />);
    await userEvent.click(screen.getByText("Eliminar"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("returns null when event is null", () => {
    const { container } = render(
      <EventDetail {...baseProps} event={null} open={true} />
    );
    expect(container.querySelector("[role='dialog']")).not.toBeInTheDocument();
  });

  it("shows daily recurrence label", () => {
    const daily = { ...base, recurrence_rule: "FREQ=DAILY" };
    render(<EventDetail {...baseProps} event={daily} />);
    expect(screen.getByText("Cada día")).toBeInTheDocument();
  });

  it("shows monthly recurrence label", () => {
    const monthly = { ...base, recurrence_rule: "FREQ=MONTHLY;BYMONTHDAY=15" };
    render(<EventDetail {...baseProps} event={monthly} />);
    expect(screen.getByText(/día 15/)).toBeInTheDocument();
  });

  it("shows yearly recurrence label", () => {
    const yearly = { ...base, recurrence_rule: "FREQ=YEARLY" };
    render(<EventDetail {...baseProps} event={yearly} />);
    expect(screen.getByText("Anualmente")).toBeInTheDocument();
  });

  it("shows all-day date format", () => {
    const allDay = { ...base, all_day: true };
    render(<EventDetail {...baseProps} event={allDay} />);
    // Should not show time, just date
    expect(screen.getByText(/abril/i)).toBeInTheDocument();
  });
});
