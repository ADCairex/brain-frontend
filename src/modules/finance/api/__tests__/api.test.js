import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  fetchAccount,
  fetchTransaction,
  updateTransaction,
  fetchInvestments,
  fetchInvestmentInstruments,
  createInvestmentInstrument,
  fetchAsset,
  fetchTransactions,
  fetchSummary,
  fetchByCategory,
  fetchByMonth,
} from "@finance/api/api";

const FINANCE = "http://localhost:8000/finance/api";

describe("finance api", () => {
  it("fetchAccount calls GET /accounts/:id", async () => {
    const mock = { id: 7, name: "Savings", initial_balance: 1000 };
    server.use(
      http.get(`${FINANCE}/accounts/7`, () => HttpResponse.json(mock))
    );

    const result = await fetchAccount(7);
    expect(result).toEqual(mock);
  });

  it("fetchTransaction calls GET /transactions/:id", async () => {
    const mock = {
      id: 42,
      description: "Cafe",
      amount: 3.5,
      category: "comida",
      date: "2025-06-01",
      is_income: false,
    };
    server.use(
      http.get(`${FINANCE}/transactions/42`, () => HttpResponse.json(mock))
    );

    const result = await fetchTransaction(42);
    expect(result).toEqual(mock);
  });

  it("updateTransaction calls PUT /transactions/:id with body", async () => {
    const payload = { description: "Updated", amount: 50, category: "otros" };
    const mock = { id: 5, ...payload };
    let receivedBody;

    server.use(
      http.put(`${FINANCE}/transactions/5`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(mock);
      })
    );

    const result = await updateTransaction(5, payload);
    expect(result).toEqual(mock);
    expect(receivedBody).toEqual(payload);
  });

  it("fetchInvestments calls GET /investments", async () => {
    const mock = [
      {
        id: 1,
        asset_symbol: "AAPL",
        quantity: 2,
        purchase_price: 150,
        current_value: 320,
      },
    ];
    server.use(
      http.get(`${FINANCE}/investments`, () => HttpResponse.json(mock))
    );

    const result = await fetchInvestments();
    expect(result).toEqual(mock);
  });

  it("fetchInvestmentInstruments calls GET /investments/instruments", async () => {
    const mock = [{ symbol: "AAPL", name: "Apple Inc.", asset_type: "stock" }];
    server.use(
      http.get(`${FINANCE}/investments/instruments`, () =>
        HttpResponse.json(mock)
      )
    );

    const result = await fetchInvestmentInstruments();
    expect(result).toEqual(mock);
  });

  it("createInvestmentInstrument calls POST /investments/instruments", async () => {
    const payload = { symbol: "TSLA", name: "Tesla Inc.", asset_type: "stock" };
    let receivedBody;

    server.use(
      http.post(`${FINANCE}/investments/instruments`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(payload, { status: 201 });
      })
    );

    const result = await createInvestmentInstrument(payload);
    expect(result).toEqual(payload);
    expect(receivedBody).toEqual(payload);
  });

  it("fetchAsset calls GET /assets/:id", async () => {
    const mock = {
      id: 3,
      name: "Car",
      value: 15000,
      category: "vehiculo",
      is_initial: false,
    };
    server.use(http.get(`${FINANCE}/assets/3`, () => HttpResponse.json(mock)));

    const result = await fetchAsset(3);
    expect(result).toEqual(mock);
  });

  it("request throws with detail message on error response", async () => {
    server.use(
      http.get(`${FINANCE}/accounts/999`, () =>
        HttpResponse.json({ detail: "Not found" }, { status: 404 })
      )
    );

    await expect(fetchAccount(999)).rejects.toThrow("Not found");
  });

  it("request throws generic message when no detail in error body", async () => {
    server.use(
      http.get(`${FINANCE}/accounts/998`, () =>
        HttpResponse.json({ message: "something" }, { status: 500 })
      )
    );

    await expect(fetchAccount(998)).rejects.toThrow("Error 500");
  });

  it("fetchTransactions builds query string with params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${FINANCE}/transactions`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      })
    );

    await fetchTransactions({ month: 6, year: 2025, account_id: 1 });

    expect(capturedUrl).toContain("month=6");
    expect(capturedUrl).toContain("year=2025");
    expect(capturedUrl).toContain("account_id=1");
  });

  it("fetchTransactions omits params that are null or undefined", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${FINANCE}/transactions`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      })
    );

    await fetchTransactions({ year: 2025 });

    expect(capturedUrl).toContain("year=2025");
    expect(capturedUrl).not.toContain("month=");
    expect(capturedUrl).not.toContain("account_id=");
  });

  it("fetchSummary builds query string with params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${FINANCE}/transactions/summary`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          total_income: 0,
          total_expenses: 0,
          balance: 0,
          count: 0,
        });
      })
    );

    await fetchSummary({ month: 3, year: 2025, account_id: 2 });

    expect(capturedUrl).toContain("month=3");
    expect(capturedUrl).toContain("year=2025");
    expect(capturedUrl).toContain("account_id=2");
  });

  it("fetchByCategory builds query string with params", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${FINANCE}/transactions/by-category`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      })
    );

    await fetchByCategory({ month: 1, year: 2024, account_id: 3 });

    expect(capturedUrl).toContain("month=1");
    expect(capturedUrl).toContain("year=2024");
    expect(capturedUrl).toContain("account_id=3");
  });

  it("fetchByMonth builds query string with year and account_id", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${FINANCE}/transactions/by-month`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([]);
      })
    );

    await fetchByMonth({ year: 2025, account_id: 5 });

    expect(capturedUrl).toContain("year=2025");
    expect(capturedUrl).toContain("account_id=5");
  });
});
