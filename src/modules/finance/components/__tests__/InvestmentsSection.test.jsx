import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import InvestmentsSection from "@finance/components/InvestmentsSection";
import { server } from "@/test/msw/server";

const BASE = "http://localhost:8000/finance/api";

const mockGroups = [
  {
    asset_symbol: "AAPL",
    asset_name: "Apple Inc.",
    total_quantity: 4,
    avg_purchase_price: 150,
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
  },
];

const mockSummary = {
  total_invested: 600,
  current_value: 800,
  profit_loss: 200,
  profit_loss_pct: 33.33,
};

function renderSection(props = {}) {
  return render(
    <InvestmentsSection
      accounts={[]}
      hideAmounts={false}
      accountId={null}
      {...props}
    />
  );
}

describe("InvestmentsSection", () => {
  it("shows loading state initially", () => {
    renderSection();
    expect(
      screen.getByRole("status", { name: /cargando inversiones/i })
    ).toBeInTheDocument();
  });

  it("shows empty state when no investments", async () => {
    renderSection();
    expect(
      await screen.findByText("Sin inversiones registradas")
    ).toBeInTheDocument();
  });

  it('shows section heading "Cartera de Inversiones"', async () => {
    renderSection();
    expect(
      await screen.findByText("Cartera de Inversiones")
    ).toBeInTheDocument();
  });

  it("renders symbol groups when data is available", async () => {
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json(mockGroups)
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection();

    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("AAPL")).toBeInTheDocument();
  });

  it("expands purchases when symbol row is clicked", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json(mockGroups)
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection();

    const row = await screen.findByRole("button", {
      name: /apple inc.*expandir/i,
    });
    await user.click(row);

    // After expanding, the purchase row is visible — identified by its delete button
    expect(
      await screen.findByRole("button", { name: /eliminar compra del/i })
    ).toBeInTheDocument();
  });

  it("shows add purchase button in footer", async () => {
    renderSection();
    // The footer button is always rendered regardless of data state
    expect(
      await screen.findByRole("button", { name: /añadir compra/i })
    ).toBeInTheDocument();
  });

  it("opens add modal when footer button is clicked", async () => {
    const user = userEvent.setup();
    renderSection();

    const addBtn = await screen.findByRole("button", {
      name: /añadir compra/i,
    });
    await user.click(addBtn);

    expect(await screen.findByText("Nueva Inversión")).toBeInTheDocument();
  });

  it("shows confirm delete after clicking delete on a purchase", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json(mockGroups)
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection();

    // Expand the symbol row first
    const row = await screen.findByRole("button", {
      name: /apple inc.*expandir/i,
    });
    await user.click(row);

    // Click the trash button to enter confirming state
    const deleteBtn = await screen.findByRole("button", {
      name: /eliminar compra del/i,
    });
    await user.click(deleteBtn);

    expect(
      screen.getByRole("button", { name: "Confirmar eliminación" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar" })
    ).toBeInTheDocument();
  });

  it("calls delete API after confirming deletion", async () => {
    const user = userEvent.setup();
    let deleteWasCalled = false;

    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json(mockGroups)
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      ),
      http.delete(`${BASE}/investments/:id`, () => {
        deleteWasCalled = true;
        return new HttpResponse(null, { status: 204 });
      })
    );

    renderSection();

    const row = await screen.findByRole("button", {
      name: /apple inc.*expandir/i,
    });
    await user.click(row);

    const deleteBtn = await screen.findByRole("button", {
      name: /eliminar compra del/i,
    });
    await user.click(deleteBtn);

    const confirmBtn = screen.getByRole("button", {
      name: "Confirmar eliminación",
    });
    await user.click(confirmBtn);

    await waitFor(() => expect(deleteWasCalled).toBe(true));
  });

  it("hides amounts when hideAmounts=true", async () => {
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json(mockGroups)
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection({ hideAmounts: true });

    await screen.findByText("Apple Inc.");

    // All monetary values should be masked — multiple instances expected
    const masked = screen.getAllByText("****** €");
    expect(masked.length).toBeGreaterThan(0);
  });
});
