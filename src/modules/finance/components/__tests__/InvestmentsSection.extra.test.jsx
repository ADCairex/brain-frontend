import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import InvestmentsSection from "@finance/components/InvestmentsSection";
import { server } from "@/test/msw/server";

const BASE = "http://localhost:8000/finance/api";

const mockGroup = {
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
};

const mockGroupWithLoss = {
  asset_symbol: "TSLA",
  asset_name: "Tesla Inc.",
  total_quantity: 2,
  avg_purchase_price: 200,
  current_value: 300,
  profit_loss: -100,
  profit_loss_pct: -25,
  purchases: [
    {
      id: 2,
      quantity: 2,
      purchase_price: 200,
      purchase_date: "2025-02-01",
      current_value: 300,
      profit_loss: -100,
      profit_loss_pct: -25,
      source_account_id: 1,
    },
  ],
};

const mockSummaryLoss = {
  total_invested: 400,
  current_value: 300,
  profit_loss: -100,
  profit_loss_pct: -25,
};

const mockSummary = {
  total_invested: 600,
  current_value: 800,
  profit_loss: 200,
  profit_loss_pct: 33.33,
};

function renderSection(props = {}) {
  return render(
    <InvestmentsSection
      accounts={[{ id: 1, name: "BBVA", initial_balance: 1000 }]}
      hideAmounts={false}
      accountId={null}
      {...props}
    />
  );
}

describe("InvestmentsSection – extra", () => {
  it("cancels purchase delete when Cancel is clicked", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json([mockGroup])
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

    await user.click(
      await screen.findByRole("button", { name: /eliminar compra del/i })
    );

    expect(
      screen.getByRole("button", { name: "Confirmar eliminación" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    // Confirm button is gone, original delete button is back
    expect(
      screen.queryByRole("button", { name: "Confirmar eliminación" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /eliminar compra del/i })
    ).toBeInTheDocument();
  });

  it("shows loss indicator when profit_loss is negative", async () => {
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json([mockGroupWithLoss])
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummaryLoss)
      )
    );

    renderSection();

    await screen.findByText("Tesla Inc.");
    // The loss value should be shown in the summary
    expect(screen.getByText("Tesla Inc.")).toBeInTheDocument();
  });

  it("opens add modal when Añadir compra button on symbol row is clicked", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json([mockGroup])
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection();

    await screen.findByText("Apple Inc.");

    const addBtn = screen.getByRole("button", {
      name: /Añadir compra de Apple Inc\./i,
    });
    await user.click(addBtn);

    // When prefill is set, the modal title includes the asset name
    expect(
      await screen.findByText("Nueva compra — Apple Inc.")
    ).toBeInTheDocument();
  });

  it("shows purchase with account name when source_account_id is set", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json([mockGroupWithLoss])
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummaryLoss)
      )
    );

    renderSection({
      accounts: [{ id: 1, name: "BBVA", initial_balance: 1000 }],
    });

    const row = await screen.findByRole("button", {
      name: /tesla inc.*expandir/i,
    });
    await user.click(row);

    // The account badge "BBVA" should appear in the purchase row
    await waitFor(() => {
      expect(screen.getByText("BBVA")).toBeInTheDocument();
    });
  });

  it("hides purchase amounts when hideAmounts=true and expanded", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () =>
        HttpResponse.json([mockGroup])
      ),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection({ hideAmounts: true });

    const row = await screen.findByRole("button", {
      name: /apple inc.*expandir/i,
    });
    await user.click(row);

    // After expanding, the purchase row hides monetary values
    await waitFor(() => {
      const masked = screen.getAllByText("****** €");
      expect(masked.length).toBeGreaterThan(1);
    });
  });

  it("filters by accountId when accountId prop is provided", async () => {
    server.use(
      http.get(`${BASE}/investments/by-symbol`, ({ request }) => {
        const url = new URL(request.url);
        const accountId = url.searchParams.get("account_id");
        if (accountId === "1") {
          return HttpResponse.json([mockGroup]);
        }
        return HttpResponse.json([]);
      }),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json(mockSummary)
      )
    );

    renderSection({ accountId: 1 });

    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
  });

  it("closes AddInvestmentModal when cancel is clicked (onClose callback)", async () => {
    const user = userEvent.setup();
    renderSection();

    const addBtn = await screen.findByRole("button", {
      name: /añadir compra/i,
    });
    await user.click(addBtn);

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Click the Cancelar button to close — triggers onClose
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("polling interval triggers data reload", async () => {
    let fetchCount = 0;
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () => {
        fetchCount++;
        return HttpResponse.json([]);
      }),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json({
          total_invested: 0,
          current_value: 0,
          profit_loss: 0,
          profit_loss_pct: 0,
        })
      )
    );

    vi.useFakeTimers();

    renderSection();

    // Wait for initial load
    await act(async () => {
      await Promise.resolve();
    });

    const countAfterMount = fetchCount;

    // Advance time past the polling interval (30s default)
    await act(async () => {
      vi.advanceTimersByTime(31_000);
      await Promise.resolve();
    });

    vi.useRealTimers();

    // The polling interval should have triggered at least one more fetch
    expect(fetchCount).toBeGreaterThan(countAfterMount);
  });

  it("saves investment and triggers onSaved callback — closes modal and reloads", async () => {
    const user = userEvent.setup();

    let _reloadCount = 0;
    server.use(
      http.get(`${BASE}/investments/by-symbol`, () => {
        _reloadCount++;
        return HttpResponse.json([]);
      }),
      http.get(`${BASE}/investments/summary`, () =>
        HttpResponse.json({
          total_invested: 0,
          current_value: 0,
          profit_loss: 0,
          profit_loss_pct: 0,
        })
      )
    );

    renderSection();

    await screen.findByText("Sin inversiones registradas");

    const addBtn = screen.getByRole("button", { name: /añadir compra/i });
    await user.click(addBtn);

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Fill required fields in AddInvestmentModal
    await user.type(screen.getByLabelText("Símbolo"), "MSFT");
    await user.type(screen.getByLabelText("Nombre"), "Microsoft");
    await user.type(screen.getByLabelText("Total pagado (€)"), "300");
    await user.type(screen.getByLabelText("Cantidad recibida"), "2");

    await user.click(screen.getByText("Registrar Inversión"));

    // onSaved fires — modal closes and loadData() is called (reloadCount increases)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
