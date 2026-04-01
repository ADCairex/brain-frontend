import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { Toaster } from "sonner";
import CalendarPage from "@calendar/pages/CalendarPage";

const CALENDAR = "http://localhost:8000/calendar/api";

const MOCK_EVENTS = [
  {
    id: 1,
    title: "Dentista",
    occurrence_start: "2026-04-15T10:00:00Z",
    occurrence_end: "2026-04-15T11:00:00Z",
    all_day: false,
    color: "#ef4444",
    location: "Clinica",
    description: null,
    recurrence_rule: null,
    parent_event_id: null,
    is_exception: false,
  },
];

function renderPage() {
  return render(
    <>
      <CalendarPage />
      <Toaster />
    </>
  );
}

describe("CalendarPage", () => {
  beforeEach(() => {
    server.use(
      http.get(`${CALENDAR}/events`, () => HttpResponse.json(MOCK_EVENTS))
    );
  });

  it("renders the month heading", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/abril/i)).toBeInTheDocument();
    });
  });

  it("renders loading spinner then events", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Dentista")).toBeInTheDocument();
    });
  });

  it("navigates to next month", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByLabelText("Mes siguiente"));
    await waitFor(() => {
      expect(screen.getByText(/mayo/i)).toBeInTheDocument();
    });
  });

  it("navigates to previous month", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByLabelText("Mes anterior"));
    await waitFor(() => {
      expect(screen.getByText(/marzo/i)).toBeInTheDocument();
    });
  });

  it("clicking Hoy returns to current month", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Hoy"));
    // Should show current month
    const now = new Date();
    const months = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(months[now.getMonth()], "i"))
      ).toBeInTheDocument();
    });
  });

  it("shows error state", async () => {
    server.use(
      http.get(`${CALENDAR}/events`, () =>
        HttpResponse.json({ detail: "Server error" }, { status: 500 })
      )
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("renders grid with day labels", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    expect(screen.getByText("Lun")).toBeInTheDocument();
  });

  it("opens detail when clicking an event", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Dentista"));
    await waitFor(() => {
      expect(screen.getByText("Editar")).toBeInTheDocument();
      expect(screen.getByText("Eliminar")).toBeInTheDocument();
    });
  });

  it("deletes a single event from detail", async () => {
    server.use(
      http.delete(
        `${CALENDAR}/events/1`,
        () => new HttpResponse(null, { status: 204 })
      )
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Dentista")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Dentista"));
    await waitFor(() =>
      expect(screen.getByText("Eliminar")).toBeInTheDocument()
    );
    await userEvent.click(screen.getByText("Eliminar"));
    await waitFor(() => {
      expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
    });
  });
});
