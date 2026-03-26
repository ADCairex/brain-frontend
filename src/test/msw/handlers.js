import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:8000'

export const handlers = [
  // Auth
  http.get(`${BASE}/auth/me`, () =>
    HttpResponse.json({ id: 1, email: 'user@example.com' })
  ),
  http.post(`${BASE}/auth/login`, () =>
    HttpResponse.json({ ok: true })
  ),
  http.post(`${BASE}/auth/logout`, () =>
    HttpResponse.json({ ok: true })
  ),

  // Accounts
  http.get(`${BASE}/api/accounts`, () => HttpResponse.json([])),
  http.post(`${BASE}/api/accounts`, () =>
    HttpResponse.json({ id: 1, name: 'Test', initial_balance: 0 }, { status: 201 })
  ),

  // Transactions
  http.get(`${BASE}/api/transactions`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/transactions/summary`, () =>
    HttpResponse.json({
      total_income: 0,
      total_expenses: 0,
      total_invested: 0,
      total_investments_initial: 0,
      total_assets_initial: 0,
      total_assets_acquired: 0,
      initial_balance: 0,
      balance: 0,
      balance_with_investments: 0,
      count: 0,
    })
  ),
  http.get(`${BASE}/api/transactions/by-category`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/transactions/by-month`, () => HttpResponse.json([])),
  http.post(`${BASE}/api/transactions`, () =>
    HttpResponse.json(
      { id: 1, description: 'Test', amount: 100, category: 'otros', date: '2025-01-01', is_income: false },
      { status: 201 }
    )
  ),

  // Investments
  http.get(`${BASE}/api/investments`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/investments/summary`, () =>
    HttpResponse.json({ total_invested: 0, current_value: 0, profit_loss: 0, profit_loss_pct: 0 })
  ),
  http.get(`${BASE}/api/investments/by-symbol`, () => HttpResponse.json([])),
  http.get(`${BASE}/api/investments/instruments`, () => HttpResponse.json([])),

  // Assets
  http.get(`${BASE}/api/assets`, () => HttpResponse.json([])),
]
