import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EventForm from "@calendar/components/EventForm";

describe("EventForm — submit and interactions", () => {
  const baseProps = {
    open: true,
    event: null,
    defaultDate: new Date(2026, 3, 15),
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  it("submits form with valid data", async () => {
    const onSubmit = vi.fn();
    render(<EventForm {...baseProps} onSubmit={onSubmit} />);
    const titleInput = screen.getByPlaceholderText("Título del evento");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Reunión importante");
    await userEvent.click(screen.getByText("Crear"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.title).toBe("Reunión importante");
    expect(payload.start_at).toContain("2026-04-15");
  });

  it("submits with all-day enabled", async () => {
    const onSubmit = vi.fn();
    render(<EventForm {...baseProps} onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByPlaceholderText("Título del evento"),
      "Feriado"
    );
    // Toggle all-day switch
    const toggle = screen.getByRole("switch");
    await userEvent.click(toggle);
    await userEvent.click(screen.getByText("Crear"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.all_day).toBe(true);
  });

  it("submits with description", async () => {
    const onSubmit = vi.fn();
    render(<EventForm {...baseProps} onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByPlaceholderText("Título del evento"),
      "Cena"
    );
    // Description is a textarea - "Opcional" placeholder
    const textareas = screen.getAllByPlaceholderText("Opcional");
    await userEvent.type(textareas[0], "Restaurante italiano");
    await userEvent.click(screen.getByText("Crear"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it("submits with recurrence preset", async () => {
    const onSubmit = vi.fn();
    render(<EventForm {...baseProps} onSubmit={onSubmit} />);
    await userEvent.type(
      screen.getByPlaceholderText("Título del evento"),
      "Stand-up"
    );
    // Select weekly recurrence
    const select = screen.getByRole("combobox");
    await userEvent.selectOptions(select, "weekly");
    await userEvent.click(screen.getByText("Crear"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.recurrence_preset).toBe("weekly");
  });

  it("pre-populates fields in edit mode", () => {
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
    expect(screen.getByDisplayValue("Dentista")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Clinica")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Consulta")).toBeInTheDocument();
  });

  it("submits edit form with Guardar button", async () => {
    const onSubmit = vi.fn();
    const event = {
      title: "Dentista",
      occurrence_start: "2026-04-15T10:00:00Z",
      occurrence_end: "2026-04-15T11:00:00Z",
      all_day: false,
      color: null,
      location: null,
      description: null,
    };
    render(<EventForm {...baseProps} event={event} onSubmit={onSubmit} />);
    const titleInput = screen.getByDisplayValue("Dentista");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Dentista actualizado");
    await userEvent.click(screen.getByText("Guardar"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    expect(onSubmit.mock.calls[0][0].title).toBe("Dentista actualizado");
  });

  it("uses null default date if not provided", () => {
    render(<EventForm {...baseProps} defaultDate={null} />);
    expect(screen.getByText("Nuevo evento")).toBeInTheDocument();
  });
});
