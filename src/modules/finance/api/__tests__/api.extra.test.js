import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import {
  fetchAccount,
  fetchAsset,
  fetchTransaction,
  fetchInvestments,
  fetchInvestmentInstruments,
  updateTransaction,
  createInvestmentInstrument,
} from "@finance/api/api";

const FINANCE = "http://localhost:8000/finance/api";

describe("finance api – uncovered functions", () => {
  it("fetchAccount calls GET /accounts/:id", async () => {
    server.use(
      http.get(`${FINANCE}/accounts/1`, () =>
        HttpResponse.json({ id: 1, name: "BBVA", initial_balance: 1000 })
      )
    );

    const result = await fetchAccount(1);
    expect(result).toMatchObject({ id: 1, name: "BBVA" });
  });

  it("fetchAsset calls GET /assets/:id", async () => {
    server.use(
      http.get(`${FINANCE}/assets/10`, () =>
        HttpResponse.json({
          id: 10,
          name: "Honda Civic",
          value: 15000,
          category: "vehiculo",
          is_initial: true,
          account_id: null,
          acquisition_date: "2024-01-01",
        })
      )
    );

    const result = await fetchAsset(10);
    expect(result).toMatchObject({ id: 10, name: "Honda Civic" });
  });

  it("updateTransaction calls PUT /transactions/:id", async () => {
    let putBody = null;
    server.use(
      http.put(`${FINANCE}/transactions/1`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({
          id: 1,
          description: putBody.description,
          amount: putBody.amount,
          category: putBody.category,
          date: putBody.date,
          is_income: putBody.is_income,
        });
      })
    );

    const data = {
      description: "Updated",
      amount: 200,
      category: "transporte",
      date: "2025-06-01",
      is_income: false,
    };
    const result = await updateTransaction(1, data);
    expect(result).toMatchObject({ description: "Updated" });
    expect(putBody).toMatchObject(data);
  });

  it("fetchTransaction calls GET /transactions/:id", async () => {
    server.use(
      http.get("http://localhost:8000/finance/api/transactions/5", () =>
        HttpResponse.json({
          id: 5,
          description: "Supermercado",
          amount: 150,
          category: "comida",
          date: "2025-06-15",
          is_income: false,
        })
      )
    );

    const result = await fetchTransaction(5);
    expect(result).toMatchObject({ id: 5, description: "Supermercado" });
  });

  it("fetchInvestments calls GET /investments", async () => {
    server.use(
      http.get("http://localhost:8000/finance/api/investments", () =>
        HttpResponse.json([
          {
            id: 1,
            asset_symbol: "AAPL",
            quantity: 4,
            purchase_price: 150,
          },
        ])
      )
    );

    const result = await fetchInvestments();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ asset_symbol: "AAPL" });
  });

  it("fetchInvestmentInstruments calls GET /investments/instruments", async () => {
    server.use(
      http.get(
        "http://localhost:8000/finance/api/investments/instruments",
        () =>
          HttpResponse.json([
            { symbol: "AAPL", name: "Apple Inc.", asset_type: "stock" },
          ])
      )
    );

    const result = await fetchInvestmentInstruments();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ symbol: "AAPL" });
  });

  it("createInvestmentInstrument calls POST /investments/instruments", async () => {
    let postBody = null;
    server.use(
      http.post(`${FINANCE}/investments/instruments`, async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(
          {
            symbol: postBody.symbol,
            name: postBody.name,
            asset_type: postBody.asset_type,
          },
          { status: 201 }
        );
      })
    );

    const data = { symbol: "NVDA", name: "Nvidia", asset_type: "stock" };
    const result = await createInvestmentInstrument(data);
    expect(result).toMatchObject({ symbol: "NVDA" });
    expect(postBody).toMatchObject(data);
  });
});
