import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import ExpenseChart from "@finance/components/ExpenseChart";
import { CategoryProvider } from "@finance/context/CategoryContext";

function renderChart(props = {}) {
  return render(
    <CategoryProvider>
      <ExpenseChart {...props} />
    </CategoryProvider>
  );
}

describe("ExpenseChart", () => {
  it("renders the section heading", () => {
    renderChart();
    expect(screen.getByText("Gastos por Categoría")).toBeInTheDocument();
  });

  it("renders without crashing when data is empty", () => {
    renderChart({ data: [] });
    expect(screen.getByText("Gastos por Categoría")).toBeInTheDocument();
  });

  it("renders without crashing when data is provided", () => {
    const data = [
      { category: "comida", total: 300 },
      { category: "transporte", total: 150 },
    ];
    renderChart({ data });
    expect(screen.getByText("Gastos por Categoría")).toBeInTheDocument();
  });
});
