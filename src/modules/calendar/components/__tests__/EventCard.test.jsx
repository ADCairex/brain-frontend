import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EventCard from "@calendar/components/EventCard";

describe("EventCard", () => {
  const base = {
    id: 1,
    title: "Dentista",
    color: "#ef4444",
    recurrence_rule: null,
    is_exception: false,
  };

  it("renders event title", () => {
    render(<EventCard event={base} onClick={() => {}} />);
    expect(screen.getByText("Dentista")).toBeInTheDocument();
  });

  it("shows repeat icon for recurring events", () => {
    const recurring = { ...base, recurrence_rule: "FREQ=WEEKLY" };
    const { container } = render(
      <EventCard event={recurring} onClick={() => {}} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies italic style for exception instances", () => {
    const exception = { ...base, is_exception: true };
    render(<EventCard event={exception} onClick={() => {}} />);
    const span = screen.getByText("Dentista");
    expect(span).toHaveClass("italic");
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<EventCard event={base} onClick={onClick} />);
    await userEvent.click(screen.getByText("Dentista"));
    expect(onClick).toHaveBeenCalledWith(base);
  });

  it("applies event color as border", () => {
    const { container } = render(<EventCard event={base} onClick={() => {}} />);
    const button = container.querySelector("button");
    expect(button.style.borderLeft).toContain("#ef4444");
  });
});
