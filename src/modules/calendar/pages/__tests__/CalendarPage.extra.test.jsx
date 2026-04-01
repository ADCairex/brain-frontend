import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { Toaster } from "sonner";
import CalendarPage from "@calendar/pages/CalendarPage";

const CALENDAR = "http://localhost:8000/calendar/api";

const SINGLE_EVENT = {
  id: 1,
  title: "Dentista",
  occurrence_start: "2026-04-15T10:00:00Z",
  occurrence_end: "2026-04-15T11:00:00Z",
  all_day: false,
  color: "#ef4444",
  location: "Clinica",
  description: "Consulta",
  recurrence_rule: null,
  parent_event_id: null,
  is_exception: false,
};

const RECURRING_EVENT = {
  ...SINGLE_EVENT,
  id: 2,
  title: "Stand-up",
  recurrence_rule: "FREQ=WEEKLY;BYDAY=MO",
};

function renderPage() {
  return render(
    <>
      <CalendarPage />
      <Toaster />
    </>
  );
}

describe("CalendarPage — edit flows", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CALENDAR}/events`, () => HttpResponse.json([SINGLE_EVENT]))
    );
  });

  it("opens edit form for a non-recurring event", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Dentista"));
    await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(screen.getByText("Editar evento")).toBeInTheDocument();
    });
  });

  it("closes form on cancel", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Dentista"));
    await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Editar"));
    await waitFor(() =>
      expect(screen.getByText("Editar evento")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(screen.queryByText("Editar evento")).not.toBeInTheDocument();
    });
  });
});

describe("CalendarPage — recurring event scope", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CALENDAR}/events`, () => HttpResponse.json([RECURRING_EVENT]))
    );
  });

  it("shows scope dialog for recurring event delete", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Stand-up")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Stand-up"));
    await waitFor(() =>
      expect(screen.getByText("Eliminar")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(
        screen.getByText("¿Qué eventos quieres eliminar?")
      ).toBeInTheDocument();
      expect(screen.getByText("Solo este evento")).toBeInTheDocument();
      expect(screen.getByText("Todos los eventos")).toBeInTheDocument();
    });
  });

  it("deletes all recurring events via scope dialog", async () => {
    server.use(
      http.delete(
        `${CALENDAR}/events/2`,
        () => new HttpResponse(null, { status: 204 })
      )
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Stand-up")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Stand-up"));
    await waitFor(() =>
      expect(screen.getByText("Eliminar")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Eliminar"));
    await waitFor(() =>
      expect(screen.getByText("Todos los eventos")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Todos los eventos"));
    await waitFor(() => {
      expect(
        screen.queryByText("¿Qué eventos quieres eliminar?")
      ).not.toBeInTheDocument();
    });
  });

  it("shows scope dialog for recurring event edit", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Stand-up")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Stand-up"));
    await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Editar"));
    await waitFor(() => {
      expect(
        screen.getByText("¿Qué eventos quieres editar?")
      ).toBeInTheDocument();
    });
  });

  it("opens edit form after selecting scope for recurring event", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Stand-up")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Stand-up"));
    await waitFor(() => expect(screen.getByText("Editar")).toBeInTheDocument());
    await userEvent.click(screen.getByText("Editar"));
    await waitFor(() =>
      expect(screen.getByText("Solo este evento")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Solo este evento"));
    await waitFor(() => {
      expect(screen.getByText("Editar evento")).toBeInTheDocument();
    });
  });

  it("cancels scope dialog", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Stand-up")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Stand-up"));
    await waitFor(() =>
      expect(screen.getByText("Eliminar")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Eliminar"));
    await waitFor(() =>
      expect(screen.getByText("Solo este evento")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Cancelar"));
    await waitFor(() => {
      expect(
        screen.queryByText("¿Qué eventos quieres eliminar?")
      ).not.toBeInTheDocument();
    });
  });
});

describe("CalendarPage — create flow", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CALENDAR}/events`, () => HttpResponse.json([SINGLE_EVENT]))
    );
  });

  it("renders day labels in the grid", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    expect(screen.getByText("Lun")).toBeInTheDocument();
    expect(screen.getByText("Dom")).toBeInTheDocument();
  });
});
