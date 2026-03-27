import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import MonthlyChart from "@finance/components/MonthlyChart";

const data = [
  { month: 1, income: 3000, expenses: 1200 },
  { month: 6, income: 3200, expenses: 1400 },
];

// Mock ResizeObserver so Recharts ResponsiveContainer reports a real size
// and actually calls its internal tick/tooltip formatters
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe(el) {
    // Report a 600x300 bounding box so Recharts renders ticks
    this.callback([
      {
        target: el,
        contentRect: { width: 600, height: 300 },
      },
    ]);
  }
  unobserve() {}
  disconnect() {}
}

describe("MonthlyChart – with data", () => {
  let originalResizeObserver;

  beforeEach(() => {
    originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = MockResizeObserver;
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
  });

  it("renders the chart heading when data is provided", async () => {
    await act(async () => {
      render(<MonthlyChart data={data} hideAmounts={false} />);
    });
    expect(screen.getByText("Resumen Mensual")).toBeInTheDocument();
  });

  it("renders without crashing when hideAmounts is true", async () => {
    await act(async () => {
      render(<MonthlyChart data={data} hideAmounts={true} />);
    });
    expect(screen.getByText("Resumen Mensual")).toBeInTheDocument();
  });

  it("renders the legend items", async () => {
    await act(async () => {
      render(<MonthlyChart data={data} hideAmounts={false} />);
    });
    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Gastos")).toBeInTheDocument();
  });

  it("uses fallback data when no data prop is passed", async () => {
    await act(async () => {
      render(<MonthlyChart hideAmounts={false} />);
    });
    expect(screen.getByText("Resumen Mensual")).toBeInTheDocument();
  });
});
