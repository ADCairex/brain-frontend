const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const BASE = `${API_URL}/finance/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ── Accounts ─────────────────────────────────────────────────────────────────

export function fetchAccounts() {
  return request("/accounts");
}

export function fetchAccount(id) {
  return request(`/accounts/${id}`);
}

export function createAccount(data) {
  return request("/accounts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAccount(id, data) {
  return request(`/accounts/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAccount(id) {
  return request(`/accounts/${id}`, { method: "DELETE" });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function fetchTransactions({ month, year, category, is_income, account_id } = /** @type {{ month?: number, year?: number, category?: string, is_income?: boolean, account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (month != null) params.set("month", String(month));
  if (year != null) params.set("year", String(year));
  if (category) params.set("category", category);
  if (is_income != null) params.set("is_income", String(is_income));
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/transactions${qs ? `?${qs}` : ""}`);
}

export function fetchTransaction(id) {
  return request(`/transactions/${id}`);
}

export function createTransaction(data) {
  return request("/transactions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTransaction(id, data) {
  return request(`/transactions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: "DELETE" });
}

// ── Investments ───────────────────────────────────────────────────────────────

export function fetchInvestmentsBySymbol({ is_initial, account_id } = /** @type {{ is_initial?: boolean, account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (is_initial != null) params.set("is_initial", String(is_initial));
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/investments/by-symbol${qs ? `?${qs}` : ""}`);
}

export function fetchInvestments() {
  return request("/investments");
}

export function fetchInvestmentsSummary({ account_id } = /** @type {{ account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/investments/summary${qs ? `?${qs}` : ""}`);
}

export function createInvestment(data) {
  return request("/investments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteInvestment(id) {
  return request(`/investments/${id}`, { method: "DELETE" });
}

export function fetchInvestmentInstruments() {
  return request("/investments/instruments");
}

export function createInvestmentInstrument(data /** @type {{ symbol: string, name: string, asset_type: string }} */) {
  return request("/investments/instruments", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Assets ────────────────────────────────────────────────────────────────────

export function fetchAssets() {
  return request("/assets");
}

export function fetchAsset(id) {
  return request(`/assets/${id}`);
}

export function createAsset(data) {
  return request("/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAsset(id, data) {
  return request(`/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteAsset(id) {
  return request(`/assets/${id}`, { method: "DELETE" });
}

// ── Aggregations ──────────────────────────────────────────────────────────────

export function fetchSummary({ month, year, account_id } = /** @type {{ month?: number, year?: number, account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (month != null) params.set("month", String(month));
  if (year != null) params.set("year", String(year));
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/transactions/summary${qs ? `?${qs}` : ""}`);
}

export function fetchByCategory({ month, year, account_id } = /** @type {{ month?: number, year?: number, account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (month != null) params.set("month", String(month));
  if (year != null) params.set("year", String(year));
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/transactions/by-category${qs ? `?${qs}` : ""}`);
}

export function fetchByMonth({ year, account_id } = /** @type {{ year?: number, account_id?: number }} */({})) {
  const params = new URLSearchParams();
  if (year != null) params.set("year", String(year));
  if (account_id != null) params.set("account_id", String(account_id));
  const qs = params.toString();
  return request(`/transactions/by-month${qs ? `?${qs}` : ""}`);
}
