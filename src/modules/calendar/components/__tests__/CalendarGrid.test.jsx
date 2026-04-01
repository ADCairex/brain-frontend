import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import CalendarGrid from "@calendar/components/CalendarGrid";

describe("CalendarGrid", () => {
  const april2026 = new Date(2026, 3, 1);
  const baseProps = {
    events: [],
    currentDate: april2026,
    onDayClick: vi.fn(),
    onEventClick: vi.fn(),
  };

  it("renders day labels", () => {
    render(<CalendarGrid {...baseProps} />);
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
  });

  it("renders day cells with min-h class", () => {
    const { container } = render(<CalendarGrid {...baseProps} />);
    const cells = container.querySelectorAll("[class*='min-h-']");
    expect(cells.length).toBeGreaterThanOrEqual(28);
  });

  it("renders day 15 in April", () => {
    render(<CalendarGrid {...baseProps} />);
    expect(screen.getByText("15")).toBeInTheDocument();
  });

  it("renders events on the correct day", () => {
    const events = [
      {
        id: 1,
        title: "Dentista",
        occurrence_start: "2026-04-15T10:00:00Z",
        color: "#ef4444",
        recurrence_rule: null,
        is_exception: false,
      },
    ];
    render(<CalendarGrid {...baseProps} events={events} />);
    expect(screen.getByText("Dentista")).toBeInTheDocument();
  });

  it("shows +N more when >3 events on a day", () => {
    const events = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      title: `Event ${i}`,
      occurrence_start: "2026-04-15T10:00:00Z",
      color: null,
      recurrence_rule: null,
      is_exception: false,
    }));
    render(<CalendarGrid {...baseProps} events={events} />);
    expect(screen.getByText("+2 más")).toBeInTheDocument();
  });

  it("calls onDayClick when clicking a day cell", async () => {
    const onDayClick = vi.fn();
    const { container } = render(
      <CalendarGrid {...baseProps} onDayClick={onDayClick} />
    );
    const cells = container.querySelectorAll("[class*='min-h-']");
    await userEvent.click(cells[0]);
    expect(onDayClick).toHaveBeenCalled();
  });
});
