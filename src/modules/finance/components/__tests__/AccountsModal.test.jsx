import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import AccountsModal from "@finance/components/AccountsModal";
import { server } from "@/test/msw/server";

const FINANCE = "http://localhost:8000/finance/api";

const onClose = vi.fn();
const onAccountsChanged = vi.fn();

function renderModal(props = {}) {
  render(
    <AccountsModal
      open={true}
      onClose={onClose}
      onAccountsChanged={onAccountsChanged}
      {...props}
    />
  );
}

// Seed accounts returned by GET /accounts
const MOCK_ACCOUNTS = [
  { id: 1, name: "BBVA", initial_balance: 1000 },
  { id: 2, name: "Santander", initial_balance: 500 },
];

// Seed assets returned by GET /assets
const MOCK_ASSETS = [
  {
    id: 10,
    name: "Honda Civic",
    value: 15000,
    category: "vehiculo",
    is_initial: true,
    account_id: null,
    acquisition_date: "2024-01-01",
  },
];

describe("AccountsModal", () => {
  // ── Rendering ────────────────────────────────────────────────────────────────

  it("renders the modal when open=true", async () => {
    renderModal();
    expect(screen.getByText("Configuración inicial")).toBeInTheDocument();
  });

  it("does not render the modal when open=false", () => {
    renderModal({ open: false });
    expect(screen.queryByText("Configuración inicial")).not.toBeInTheDocument();
  });

  it("renders Cuentas tab by default", async () => {
    server.use(
      http.get(`${FINANCE}/accounts`, () => HttpResponse.json(MOCK_ACCOUNTS))
    );

    renderModal();

    // The "Cuentas" tab trigger must be active
    const trigger = screen.getByRole("tab", { name: "Cuentas" });
    expect(trigger).toBeInTheDocument();

    // Accounts are loaded
    expect(await screen.findByText("BBVA")).toBeInTheDocument();
    expect(await screen.findByText("Santander")).toBeInTheDocument();
  });

  // ── Account form validation ───────────────────────────────────────────────────

  it("shows validation error when account name is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    // Open the create-account form
    await user.click(await screen.findByText("Nueva cuenta"));

    // Submit without filling anything
    await user.click(screen.getByText("Crear cuenta"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un nombre"
    );
  });

  // ── Account CRUD ─────────────────────────────────────────────────────────────

  it("creates a new account on submit", async () => {
    let posted = null;
    server.use(
      http.post(`${FINANCE}/accounts`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(
          {
            id: 99,
            name: posted.name,
            initial_balance: posted.initial_balance,
          },
          { status: 201 }
        );
      }),
      http.get(`${FINANCE}/accounts`, () =>
        HttpResponse.json([
          { id: 99, name: "Nuevo Banco", initial_balance: 200 },
        ])
      )
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByText("Nueva cuenta"));

    await user.type(screen.getByLabelText("Nombre"), "Nuevo Banco");
    await user.type(screen.getByLabelText("Saldo inicial (€)"), "200");
    await user.click(screen.getByText("Crear cuenta"));

    await waitFor(() => {
      expect(posted).toMatchObject({
        name: "Nuevo Banco",
        initial_balance: 200,
      });
    });
  });

  it("shows edit form when edit button is clicked", async () => {
    server.use(
      http.get(`${FINANCE}/accounts`, () => HttpResponse.json(MOCK_ACCOUNTS))
    );

    const user = userEvent.setup();
    renderModal();

    // Wait for accounts to load, then click edit on the first one
    const editBtn = await screen.findByRole("button", { name: "Editar BBVA" });
    await user.click(editBtn);

    // The form should now be visible with pre-filled values
    const nameInput = screen.getByLabelText("Nombre");
    expect(nameInput).toHaveValue("BBVA");

    // Submit button should say "Actualizar" (editing mode)
    expect(screen.getByText("Actualizar")).toBeInTheDocument();
  });

  it("shows confirm delete buttons when delete is clicked", async () => {
    server.use(
      http.get(`${FINANCE}/accounts`, () => HttpResponse.json(MOCK_ACCOUNTS))
    );

    const user = userEvent.setup();
    renderModal();

    const deleteBtn = await screen.findByRole("button", {
      name: "Eliminar BBVA",
    });
    await user.click(deleteBtn);

    expect(
      screen.getByRole("button", { name: "Confirmar eliminación de BBVA" })
    ).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("calls delete API after confirming", async () => {
    let deletedId = null;
    server.use(
      http.get(`${FINANCE}/accounts`, () => HttpResponse.json(MOCK_ACCOUNTS)),
      http.delete(`${FINANCE}/accounts/:id`, ({ params }) => {
        deletedId = Number(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(
      await screen.findByRole("button", { name: "Eliminar BBVA" })
    );
    await user.click(
      screen.getByRole("button", { name: "Confirmar eliminación de BBVA" })
    );

    await waitFor(() => {
      expect(deletedId).toBe(1);
    });
  });

  it("cancels delete on cancel click", async () => {
    server.use(
      http.get(`${FINANCE}/accounts`, () => HttpResponse.json(MOCK_ACCOUNTS))
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(
      await screen.findByRole("button", { name: "Eliminar BBVA" })
    );

    // Confirm button visible
    expect(
      screen.getByRole("button", { name: "Confirmar eliminación de BBVA" })
    ).toBeInTheDocument();

    await user.click(screen.getByText("Cancelar"));

    // Confirm button gone; the original delete icon button is back
    expect(
      screen.queryByRole("button", { name: "Confirmar eliminación de BBVA" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar BBVA" })
    ).toBeInTheDocument();
  });

  // ── Tab navigation ────────────────────────────────────────────────────────────

  it("switches to Activos tab", async () => {
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json(MOCK_ASSETS))
    );

    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Activos" }));

    // Description text unique to the assets tab
    expect(
      await screen.findByText("Patrimonio de partida — no cuentan como gasto.")
    ).toBeInTheDocument();
    expect(await screen.findByText("Honda Civic")).toBeInTheDocument();
  });

  // ── Asset form validation ─────────────────────────────────────────────────────

  it("shows validation error when asset name is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Activos" }));
    await user.click(await screen.findByText("Nuevo activo"));

    // Submit without any data
    await user.click(screen.getByText("Añadir activo"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un nombre"
    );
  });

  it("shows validation error when asset value is empty", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("tab", { name: "Activos" }));
    await user.click(await screen.findByText("Nuevo activo"));

    // Fill name but leave value empty
    await user.type(screen.getByLabelText("Nombre"), "Mi Coche");

    await user.click(screen.getByText("Añadir activo"));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ingresa un valor válido"
    );
  });
});
