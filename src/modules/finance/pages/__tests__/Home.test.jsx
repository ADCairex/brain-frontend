import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import Finance from "@finance/pages/Home";

function renderPage() {
  render(
    <MemoryRouter>
      <Finance />
    </MemoryRouter>
  );
}

describe("Finance page", () => {
  it("renders the page heading", async () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: "Finanzas" })
    ).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    renderPage();
    expect(
      screen.getByRole("status", { name: "Cargando transacciones…" })
    ).toBeInTheDocument();
  });

  it('shows "Sin transacciones" after loading with no data', async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByText("Sin transacciones")).toBeInTheDocument();
  });

  it('renders "Todas" account filter button', async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
  });

  it('renders "Inversiones" view button', async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: /Inversiones/ })
    ).toBeInTheDocument();
  });

  it("renders FAB add transaction button", async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Añadir transacción" })
    ).toBeInTheDocument();
  });

  it("renders configuracion inicial button", async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole("button", { name: "Configuración inicial" })
    ).toBeInTheDocument();
  });

  it("toggles hide amounts when eye button is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    const hideBtn = screen.getByRole("button", { name: "Ocultar importes" });
    expect(hideBtn).toBeInTheDocument();

    await user.click(hideBtn);

    expect(
      screen.getByRole("button", { name: "Mostrar importes" })
    ).toBeInTheDocument();
  });

  it("opens AddExpenseModal when FAB is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", { name: "Añadir transacción" })
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Nuevo Gasto")).toBeInTheDocument();
  });

  it("opens AccountsModal when Configuración inicial is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    await user.click(
      screen.getByRole("button", { name: "Configuración inicial" })
    );

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("Configuración inicial")).toBeInTheDocument();
  });

  it("switches to investments view when Inversiones is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /Inversiones/ }));

    // The balance card switches to investments view — heading becomes a <p> inside the card
    await waitFor(() =>
      expect(
        screen.getAllByText("Cartera de Inversiones").length
      ).toBeGreaterThanOrEqual(1)
    );
    // Transactions section should be hidden in investments view
    expect(screen.queryByText("Sin transacciones")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("tab", { name: "Todos" })
    ).not.toBeInTheDocument();
  });

  it("shows transactions tab filters", async () => {
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    expect(screen.getByRole("tab", { name: "Todos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Gastos" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ingresos" })).toBeInTheDocument();
  });

  it("filters to gastos tab", async () => {
    server.use(
      http.get("http://localhost:8000/finance/api/transactions", () =>
        HttpResponse.json([
          {
            id: 1,
            description: "Supermercado",
            amount: 150,
            category: "comida",
            date: "2025-06-15",
            is_income: false,
          },
          {
            id: 2,
            description: "Salario",
            amount: 3000,
            category: "ingreso",
            date: "2025-06-01",
            is_income: true,
          },
        ])
      )
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    expect(screen.getByText("Supermercado")).toBeInTheDocument();
    expect(screen.getByText("Salario")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Gastos" }));

    await waitFor(() => {
      expect(screen.getByText("Supermercado")).toBeInTheDocument();
      // After switching to Gastos tab, the income transaction disappears from the list
      const items = screen.queryAllByText("Salario");
      expect(items).toHaveLength(0);
    });
  });
});
