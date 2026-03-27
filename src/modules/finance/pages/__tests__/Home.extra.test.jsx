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

describe("Finance page – extra", () => {
  it("selects account filter when pill is clicked", async () => {
    server.use(
      http.get("http://localhost:8000/finance/api/accounts", () =>
        HttpResponse.json([{ id: 1, name: "BBVA", initial_balance: 1000 }])
      )
    );

    const user = userEvent.setup();
    renderPage();

    // Wait for account pill to appear
    await waitFor(() => expect(screen.getByText("BBVA")).toBeInTheDocument());

    const pill = screen.getByText("BBVA").closest("button");
    expect(pill).toHaveAttribute("aria-pressed", "false");

    await user.click(pill);

    await waitFor(() => {
      expect(screen.getByText("BBVA").closest("button")).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    });
  });

  it("deletes transaction after confirm", async () => {
    let deleted = false;

    server.use(
      http.get("http://localhost:8000/finance/api/transactions", () => {
        if (deleted) return HttpResponse.json([]);
        return HttpResponse.json([
          {
            id: 1,
            description: "Supermercado",
            amount: 150,
            category: "comida",
            date: "2025-06-15",
            is_income: false,
          },
        ]);
      }),
      http.delete("http://localhost:8000/finance/api/transactions/:id", () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Supermercado");

    // First click shows the confirm button
    await user.click(
      screen.getByRole("button", { name: "Eliminar Supermercado" })
    );

    // Confirm the deletion
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar eliminación de Supermercado",
      })
    );

    await waitFor(() => {
      expect(screen.queryByText("Supermercado")).not.toBeInTheDocument();
    });
  });

  it("closes AddExpenseModal when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    // Open the modal
    await user.click(
      screen.getByRole("button", { name: "Añadir transacción" })
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Cancel via the Cancelar button — triggers onClose
    await user.click(screen.getByText("Cancelar"));

    // Dialog closes
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes AddExpenseModal via onSaved when income is submitted", async () => {
    server.use(
      http.post("http://localhost:8000/finance/api/transactions", () =>
        HttpResponse.json(
          {
            id: 99,
            description: "Salario",
            amount: 3000,
            category: "ingreso",
            date: "2026-03-27",
            is_income: true,
          },
          { status: 201 }
        )
      )
    );

    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    // Open the modal
    await user.click(
      screen.getByRole("button", { name: "Añadir transacción" })
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Toggle to income mode (no category needed)
    await user.click(
      screen.getByRole("switch", { name: /cambiar a ingreso/i })
    );

    // Fill amount and description
    await user.type(screen.getByLabelText("Monto"), "3000");
    await user.type(screen.getByLabelText("Descripción"), "Salario");

    // Submit — triggers onSaved which closes the modal
    await user.click(screen.getByText("Guardar Ingreso"));

    // Dialog closes after successful save
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("cancels account edit and form disappears", async () => {
    const user = userEvent.setup();
    renderPage();

    await waitFor(() =>
      expect(
        screen.queryByRole("status", { name: "Cargando transacciones…" })
      ).not.toBeInTheDocument()
    );

    // Open AccountsModal
    await user.click(
      screen.getByRole("button", { name: "Configuración inicial" })
    );
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Close it via Escape or close button — this triggers onClose
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
