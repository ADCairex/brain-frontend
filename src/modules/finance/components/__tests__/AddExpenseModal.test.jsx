import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import AddExpenseModal from "@finance/components/AddExpenseModal";
import { CategoryProvider } from "@finance/context/CategoryContext";
import { server } from "@/test/msw/server";

const onClose = vi.fn();
const onSaved = vi.fn();

function renderModal(props = {}) {
  render(
    <CategoryProvider>
      <AddExpenseModal
        open={true}
        onClose={onClose}
        onSaved={onSaved}
        accounts={[{ id: 1, name: "Cuenta principal", initial_balance: 1000 }]}
        {...props}
      />
    </CategoryProvider>
  );
}

describe("AddExpenseModal", () => {
  it("renders expense title by default", () => {
    renderModal();
    expect(screen.getByText("Nuevo Gasto")).toBeInTheDocument();
  });

  it("shows amount validation error when amount is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Guardar Gasto"));

    expect(
      await screen.findByText("Ingresa un monto válido")
    ).toBeInTheDocument();
  });

  it("shows description validation error when description is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.click(screen.getByText("Guardar Gasto"));

    expect(
      await screen.findByText("Ingresa una descripción")
    ).toBeInTheDocument();
  });

  it("shows category validation error when expense has no category", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.type(screen.getByLabelText("Descripción"), "Supermercado");
    await user.click(screen.getByText("Guardar Gasto"));

    expect(
      await screen.findByText("Selecciona una categoría")
    ).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByText("Cancelar"));

    expect(onClose).toHaveBeenCalled();
  });

  it("shows API error when save fails", async () => {
    server.use(
      http.post("http://localhost:8000/finance/api/transactions", () =>
        HttpResponse.json({ detail: "Error del servidor" }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.type(screen.getByLabelText("Descripción"), "Test");

    // Switch to income to skip category validation
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByText("Guardar Ingreso"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Error del servidor");
    });
  });

  it("calls onSaved after successful save", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Monto"), "100");
    await user.type(screen.getByLabelText("Descripción"), "Test");

    // Switch to income to skip category validation
    await user.click(screen.getByRole("switch"));
    await user.click(screen.getByText("Guardar Ingreso"));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  describe("edit mode", () => {
    const editTransaction = {
      id: 42,
      description: "Supermercado",
      amount: 150,
      category: "comida",
      date: "2025-06-15",
      is_income: false,
      notes: "compra semanal",
      account_id: 1,
    };

    it("shows edit title when transaction is provided", () => {
      renderModal({ transaction: editTransaction });
      expect(screen.getByText("Editar Transacción")).toBeInTheDocument();
    });

    it("prefills form fields with transaction data", () => {
      renderModal({ transaction: editTransaction });
      expect(screen.getByLabelText("Monto")).toHaveValue(150);
      expect(screen.getByLabelText("Descripción")).toHaveValue("Supermercado");
      expect(screen.getByLabelText("Notas (opcional)")).toHaveValue(
        "compra semanal"
      );
    });

    it("shows 'Guardar Cambios' button in edit mode", () => {
      renderModal({ transaction: editTransaction });
      expect(screen.getByText("Guardar Cambios")).toBeInTheDocument();
    });

    it("calls PUT endpoint and onSaved when saving edits", async () => {
      const user = userEvent.setup();
      renderModal({ transaction: editTransaction });

      await user.clear(screen.getByLabelText("Descripción"));
      await user.type(screen.getByLabelText("Descripción"), "Mercadona");
      await user.click(screen.getByText("Guardar Cambios"));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
    });

    it("shows API error when edit fails", async () => {
      server.use(
        http.put("http://localhost:8000/finance/api/transactions/:id", () =>
          HttpResponse.json({ detail: "No encontrado" }, { status: 404 })
        )
      );

      const user = userEvent.setup();
      renderModal({ transaction: editTransaction });

      await user.click(screen.getByText("Guardar Cambios"));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("No encontrado");
      });
    });
  });
});
