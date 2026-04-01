import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

const fallbackData = [
  { month: 1, expenses: 12400, income: 25000 },
  { month: 2, expenses: 14200, income: 25000 },
  { month: 3, expenses: 11800, income: 27500 },
  { month: 4, expenses: 13500, income: 25000 },
  { month: 5, expenses: 15200, income: 28000 },
  { month: 6, expenses: 15000, income: 25000 },
];

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const fmtEur = (n) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

export default function MonthlyChart({ data: propData, hideAmounts = false }) {
  const data = propData && propData.length > 0 ? propData : fallbackData;
  return (
    <div className="bg-white dark:bg-slate-700/60 rounded-2xl p-6 border border-slate-100 dark:border-slate-600 shadow-sm h-full">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
        Resumen Mensual
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(m) => MONTH_LABELS[m - 1] ?? m}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              tickFormatter={(value) =>
                hideAmounts ? "***" : `${value.toLocaleString("es-ES")} €`
              }
            />
            <Tooltip
              formatter={(value) => [
                hideAmounts ? "****** €" : fmtEur(value),
                "",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                backgroundColor: "#1e293b",
                color: "#f8fafc",
              }}
            />
            <Bar
              dataKey="income"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              name="Ingresos"
            />
            <Bar
              dataKey="expenses"
              fill="#f43f5e"
              radius={[6, 6, 0, 0]}
              name="Gastos"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Ingresos
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Gastos
          </span>
        </div>
      </div>
    </div>
  );
}
