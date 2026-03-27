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

const MOCK_ASSET = {
  id: 1,
  name: "Honda Civic",
  value: 15000,
  category: "vehiculo",
  is_initial: true,
  account_id: null,
  acquisition_date: "2024-01-01",
};

const MOCK_INVESTMENT_GROUP = {
  asset_symbol: "AAPL",
  asset_name: "Apple Inc.",
  total_quantity: 4,
  avg_purchase_price: 150,
  cost_basis: 600,
  current_value: 800,
  profit_loss: 200,
  profit_loss_pct: 33.33,
  purchases: [
    {
      id: 1,
      quantity: 4,
      purchase_price: 150,
      purchase_date: "2025-01-15",
      current_value: 800,
      profit_loss: 200,
      profit_loss_pct: 33.33,
      source_account_id: null,
    },
  ],
};

// Helper: navigate to Activos tab
async function goToActivos(user) {
  await user.click(screen.getByRole("tab", { name: "Activos" }));
}

// Helper: navigate to Inversiones tab
async function goToInversiones(user) {
  await user.click(screen.getByRole("tab", { name: "Inversiones" }));
}

// ── Assets tab ────────────────────────────────────────────────────────────────

describe("AccountsModal – Assets tab", () => {
  it("creates an asset when form is submitted", async () => {
    let posted = null;
    server.use(
      http.post(`${FINANCE}/assets`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json(
          { ...MOCK_ASSET, name: posted.name, value: posted.value },
          { status: 201 }
        );
      }),
      http.get(`${FINANCE}/assets`, () =>
        HttpResponse.json([{ ...MOCK_ASSET, name: "Mi Moto", value: 3000 }])
      )
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);
    await user.click(await screen.findByText("Nuevo activo"));

    await user.type(screen.getByLabelText("Nombre"), "Mi Moto");
    await user.type(screen.getByLabelText("Valor (€)"), "3000");
    await user.click(screen.getByText("Añadir activo"));

    await waitFor(() => {
      expect(posted).toMatchObject({ name: "Mi Moto", value: 3000 });
    });
  });

  it("shows assets list when assets exist", async () => {
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json([MOCK_ASSET]))
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);

    expect(await screen.findByText("Honda Civic")).toBeInTheDocument();
  });

  it("shows confirm delete buttons for an asset", async () => {
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json([MOCK_ASSET]))
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);

    const deleteBtn = await screen.findByRole("button", {
      name: "Eliminar Honda Civic",
    });
    await user.click(deleteBtn);

    expect(
      screen.getByRole("button", {
        name: "Confirmar eliminación de Honda Civic",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });

  it("deletes an asset after confirming", async () => {
    let deletedId = null;
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json([MOCK_ASSET])),
      http.delete(`${FINANCE}/assets/:id`, ({ params }) => {
        deletedId = Number(params.id);
        return new HttpResponse(null, { status: 204 });
      })
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);

    await user.click(
      await screen.findByRole("button", { name: "Eliminar Honda Civic" })
    );
    await user.click(
      screen.getByRole("button", {
        name: "Confirmar eliminación de Honda Civic",
      })
    );

    await waitFor(() => {
      expect(deletedId).toBe(1);
    });
  });

  it("cancels asset delete on cancel click", async () => {
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json([MOCK_ASSET]))
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);

    await user.click(
      await screen.findByRole("button", { name: "Eliminar Honda Civic" })
    );

    expect(
      screen.getByRole("button", {
        name: "Confirmar eliminación de Honda Civic",
      })
    ).toBeInTheDocument();

    await user.click(screen.getByText("Cancelar"));

    expect(
      screen.queryByRole("button", {
        name: "Confirmar eliminación de Honda Civic",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Eliminar Honda Civic" })
    ).toBeInTheDocument();
  });

  it("prefills asset edit form when edit button is clicked", async () => {
    server.use(
      http.get(`${FINANCE}/assets`, () => HttpResponse.json([MOCK_ASSET]))
    );

    const user = userEvent.setup();
    renderModal();

    await goToActivos(user);

    const editBtn = await screen.findByRole("button", {
      name: "Editar Honda Civic",
    });
    await user.click(editBtn);

    const nameInput = screen.getByLabelText("Nombre");
    expect(nameInput).toHaveValue("Honda Civic");

    const valueInput = screen.getByLabelText("Valor (€)");
    expect(valueInput).toHaveValue(15000);

    // In edit mode the submit button says "Actualizar"
    expect(screen.getByText("Actualizar")).toBeInTheDocument();
  });
});

// ── Inversiones tab ───────────────────────────────────────────────────────────

describe("AccountsModal – Inversiones tab", () => {
  it("switches to Inversiones tab", async () => {
    const user = userEvent.setup();
    renderModal();

    await goToInversiones(user);

    expect(
      await screen.findByText(
        "Posiciones de partida — no se descuentan del balance (configuración inicial)."
      )
    ).toBeInTheDocument();
  });

  it("shows empty state when no investments", async () => {
    const user = userEvent.setup();
    renderModal();

    await goToInversiones(user);

    expect(
      await screen.findByText("Sin inversiones. Añade la primera.")
    ).toBeInTheDocument();
  });

  it("shows investment positions when data exists", async () => {
    server.use(
      http.get(`${FINANCE}/investments/by-symbol`, () =>
        HttpResponse.json([MOCK_INVESTMENT_GROUP])
      )
    );

    const user = userEvent.setup();
    renderModal();

    await goToInversiones(user);

    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });
});
