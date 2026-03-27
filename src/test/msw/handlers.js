import { http, HttpResponse } from "msw";

const BASE = "http://localhost:8000";
const FINANCE = `${BASE}/finance/api`;

export const handlers = [
  // Auth
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ id: 1, email: "user@example.com" })
  ),
  http.post(`${BASE}/auth/login`, () => HttpResponse.json({ ok: true })),
  http.post(`${BASE}/auth/logout`, () => HttpResponse.json({ ok: true })),

  // Accounts
  http.get(`${FINANCE}/accounts`, () => HttpResponse.json([])),
  http.post(`${FINANCE}/accounts`, () =>
    HttpResponse.json(
      { id: 1, name: "Test", initial_balance: 0 },
      { status: 201 }
    )
  ),

  // Transactions
  http.get(`${FINANCE}/transactions`, () => HttpResponse.json([])),
  http.get(`${FINANCE}/transactions/summary`, () =>
    HttpResponse.json({
      total_income: 0,
      total_expenses: 0,
      total_invested: 0,
      total_investments_initial: 0,
      total_assets_acquired: 0,
      initial_balance: 0,
      balance: 0,
      count: 0,
    })
  ),
  http.get(`${FINANCE}/transactions/by-category`, () => HttpResponse.json([])),
  http.get(`${FINANCE}/transactions/by-month`, () => HttpResponse.json([])),
  http.post(`${FINANCE}/transactions`, () =>
    HttpResponse.json(
      {
        id: 1,
        description: "Test",
        amount: 100,
        category: "otros",
        date: "2025-01-01",
        is_income: false,
      },
      { status: 201 }
    )
  ),

  // Investments
  http.get(`${FINANCE}/investments`, () => HttpResponse.json([])),
  http.get(`${FINANCE}/investments/summary`, () =>
    HttpResponse.json({
      total_invested: 0,
      current_value: 0,
      profit_loss: 0,
      profit_loss_pct: 0,
    })
  ),
  http.get(`${FINANCE}/investments/by-symbol`, () => HttpResponse.json([])),
  http.get(`${FINANCE}/investments/instruments`, () => HttpResponse.json([])),
  http.post(`${FINANCE}/investments`, () =>
    HttpResponse.json(
      {
        id: 1,
        asset_symbol: "AAPL",
        asset_name: "Apple Inc.",
        quantity: 4,
        purchase_price: 150,
        purchase_date: "2025-01-01",
      },
      { status: 201 }
    )
  ),
  http.delete(
    `${FINANCE}/investments/:id`,
    () => new HttpResponse(null, { status: 204 })
  ),

  // Assets
  http.get(`${FINANCE}/assets`, () => HttpResponse.json([])),
  http.post(`${FINANCE}/assets`, () =>
    HttpResponse.json(
      {
        id: 1,
        name: "Test Asset",
        value: 5000,
        category: "vehiculo",
        is_initial: true,
        account_id: null,
        acquisition_date: "2025-01-01",
      },
      { status: 201 }
    )
  ),
  http.put(`${FINANCE}/assets/:id`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      name: "Updated Asset",
      value: 6000,
      category: "vehiculo",
      is_initial: true,
      account_id: null,
    })
  ),
  http.delete(
    `${FINANCE}/assets/:id`,
    () => new HttpResponse(null, { status: 204 })
  ),

  // Transfers
  http.get(`${FINANCE}/transfers`, () => HttpResponse.json([])),
  http.post(`${FINANCE}/transfers`, () =>
    HttpResponse.json(
      {
        id: 1,
        from_account_id: 1,
        to_account_id: 2,
        amount: 100,
        date: "2025-01-01",
        description: null,
      },
      { status: 201 }
    )
  ),
  http.delete(
    `${FINANCE}/transfers/:id`,
    () => new HttpResponse(null, { status: 204 })
  ),

  // Account mutations
  http.put(`${FINANCE}/accounts/:id`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      name: "Updated",
      initial_balance: 0,
    })
  ),
  http.delete(
    `${FINANCE}/accounts/:id`,
    () => new HttpResponse(null, { status: 204 })
  ),
];
