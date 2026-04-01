import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useCategories } from "@finance/context/CategoryContext";

const COLOR_FALLBACK = "#94a3b8";

const fallbackData = [
  { category: "comida", total: 4500 },
  { category: "transporte", total: 2800 },
  { category: "entretenimiento", total: 1500 },
  { category: "servicios", total: 3200 },
  { category: "compras", total: 2100 },
  { category: "otros", total: 900 },
];

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export default function ExpenseChart({ data: propData, hideAmounts = false }) {
  const { getCategoryByName } = useCategories();
  const data = propData && propData.length > 0 ? propData : fallbackData;
  return (
    <div className="bg-white dark:bg-slate-700/60 rounded-2xl p-6 border border-slate-100 dark:border-slate-600 shadow-sm h-full">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
        Gastos por Categoría
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="total"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    getCategoryByName(entry.category).color || COLOR_FALLBACK
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [
                hideAmounts ? "****** €" : fmtEur(value),
                "",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                backgroundColor: "#ffffff",
                color: "#1e293b",
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
