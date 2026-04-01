import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EventForm from "@calendar/components/EventForm";

describe("EventForm", () => {
  const baseProps = {
    open: true,
    event: null,
    defaultDate: new Date(2026, 3, 15),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("renders create mode title", () => {
    render(<EventForm {...baseProps} />);
    expect(screen.getByText("Nuevo evento")).toBeInTheDocument();
  });

  it("renders edit mode title", () => {
    const event = {
      title: "Dentista",
      occurrence_start: "2026-04-15T10:00:00Z",
      occurrence_end: "2026-04-15T11:00:00Z",
      all_day: false,
      color: "#ef4444",
      location: "Clinica",
      description: "Consulta",
    };
    render(<EventForm {...baseProps} event={event} />);
    expect(screen.getByText("Editar evento")).toBeInTheDocument();
  });

  it("renders all form fields", () => {
    render(<EventForm {...baseProps} />);
    expect(
      screen.getByPlaceholderText("Título del evento")
    ).toBeInTheDocument();
    expect(screen.getByText("Todo el día")).toBeInTheDocument();
    expect(screen.getByText("Repetición")).toBeInTheDocument();
  });

  it("shows validation error on empty submit", async () => {
    render(<EventForm {...baseProps} defaultDate={null} />);
    const titleInput = screen.getByPlaceholderText("Título del evento");
    await userEvent.clear(titleInput);
    await userEvent.click(screen.getByText("Crear"));
    // Should show validation error
    expect(
      await screen.findByText("El título es obligatorio")
    ).toBeInTheDocument();
  });

  it("calls onCancel when cancel is clicked", async () => {
    const onCancel = vi.fn();
    render(<EventForm {...baseProps} onCancel={onCancel} />);
    await userEvent.click(screen.getByText("Cancelar"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("does not show recurrence in edit mode", () => {
    const event = {
      title: "Test",
      occurrence_start: "2026-04-15T10:00:00Z",
      all_day: false,
    };
    render(<EventForm {...baseProps} event={event} />);
    expect(screen.queryByText("Repetición")).not.toBeInTheDocument();
  });

  it("renders color label", () => {
    render(<EventForm {...baseProps} />);
    expect(screen.getByText("Color")).toBeInTheDocument();
  });
});
