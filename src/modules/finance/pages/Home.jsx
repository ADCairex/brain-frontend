import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@shared/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@shared/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Landmark,
  Eye,
  EyeOff,
  ArrowLeftRight,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { isToday, startOfWeek } from "date-fns";
import { cn } from "@shared/lib/utils";
import StatCard from "@finance/components/StatCard";
import TransactionItem from "@finance/components/TransactionItem";
import ExpenseChart from "@finance/components/ExpenseChart";
import MonthlyChart from "@finance/components/MonthlyChart";
import AddExpenseModal from "@finance/components/AddExpenseModal";
import AccountsModal from "@finance/components/AccountsModal";
import TransfersModal from "@finance/components/TransfersModal";
import InvestmentsSection from "@finance/components/InvestmentsSection";
import {
  fetchTransactions,
  fetchSummary,
  fetchByCategory,
  fetchByMonth,
  fetchAccounts,
  deleteTransaction,
  fetchInvestmentsSummary,
} from "@finance/api/api";

export default function Finance() {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-synced state
  const activeTab = searchParams.get("tab") || "todos";
  const accountParam = searchParams.get("account");
  const selectedAccountId = accountParam ? parseInt(accountParam, 10) : null;
  const viewMode = searchParams.get("view") || "default";
  const isInvestmentsView = viewMode === "inversiones";

  const setActiveTab = (/** @type {string} */ tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (tab === "todos") next.delete("tab");
      else next.set("tab", tab);
      return next;
    });
  };
  const setSelectedAccountId = (/** @type {number | null} */ id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id == null) next.delete("account");
      else next.set("account", String(id));
      next.delete("view");
      return next;
    });
  };
  const setViewMode = (/** @type {string} */ mode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (mode === "default") {
        next.delete("view");
        next.delete("account");
      } else {
        next.set("view", mode);
        next.delete("account");
      }
      return next;
    });
  };

  // Data state
  const [accounts, setAccounts] = useState(
    /** @type {Array<{id: number, name: string, initial_balance: number}>} */ ([])
  );
  const [showModal, setShowModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showTransfersModal, setShowTransfersModal] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [pageLimit, setPageLimit] = useState(10);
  const [transactions, setTransactions] = useState(/** @type {any[]} */ ([]));
  const [summary, setSummary] = useState(
    /** @type {{ total_income: number, total_expenses: number, balance: number, count: number }} */ ({
      total_income: 0,
      total_expenses: 0,
      balance: 0,
      count: 0,
    })
  );
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [investmentSummary, setInvestmentSummary] = useState(
    /** @type {{ total_invested: number, current_value: number, profit_loss: number, profit_loss_pct: number } | null} */ (
      null
    )
  );
  const [loading, setLoading] = useState(true);

  const currentMonth = useMemo(() => {
    const formatted = new Intl.DateTimeFormat("es-ES", {
      month: "long",
      year: "numeric",
    }).format(new Date());
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, []);

  const fade = useCallback(
    (delay = 0) =>
      shouldReduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay },
          },
    [shouldReduceMotion]
  );

  const todayExpenses = useMemo(
    () =>
      transactions
        .filter((t) => !t.is_income && isToday(new Date(t.date)))
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const weekExpenses = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return transactions
      .filter((t) => !t.is_income && new Date(t.date) >= weekStart)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthlySavings = summary.total_income - summary.total_expenses;

  const formatEur = (/** @type {number} */ n) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const selectedAccountName = selectedAccountId
    ? (accounts.find((a) => a.id === selectedAccountId)?.name ?? "Cuenta")
    : null;

  const loadAccounts = useCallback(async () => {
    try {
      const data = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Error loading accounts:", err);
    }
  }, []);

  const fetchAllData = useCallback(async (accountId) => {
    const [txns, sum, cats, months, invSum] = await Promise.all([
      fetchTransactions({ account_id: accountId }),
      fetchSummary({ account_id: accountId }),
      fetchByCategory({ account_id: accountId }),
      fetchByMonth({ account_id: accountId }),
      fetchInvestmentsSummary({ account_id: accountId }),
    ]);
    setTransactions(txns);
    setSummary(sum);
    setCategoryData(cats);
    setMonthlyData(months);
    setInvestmentSummary(invSum);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchAllData(selectedAccountId ?? undefined);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId, fetchAllData]);

  const loadDataSilent = useCallback(async () => {
    try {
      await fetchAllData(selectedAccountId ?? undefined);
    } catch {
      /* silent */
    }
  }, [selectedAccountId, fetchAllData]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);
  useEffect(() => {
    loadData();
  }, [loadData]);

  const pollInterval = Number(import.meta.env.VITE_POLL_INTERVAL) || 30_000;

  useEffect(() => {
    const id = setInterval(loadDataSilent, pollInterval);
    return () => clearInterval(id);
  }, [loadDataSilent, pollInterval]);

  const handleDelete = async (/** @type {number} */ id) => {
    try {
      await deleteTransaction(id);
      loadData();
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const availableCategories = useMemo(() => {
    const cats = [...new Set(transactions.map((t) => t.category))].sort();
    return cats;
  }, [transactions]);

  const filteredTransactions = transactions.filter((t) => {
    if (activeTab === "gastos" && t.is_income) return false;
    if (activeTab === "ingresos" && !t.is_income) return false;
    if (selectedCategory !== "todas" && t.category !== selectedCategory)
      return false;
    return true;
  });
  const visibleTransactions = filteredTransactions.slice(0, pageLimit);

  const pillBase =
    "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors";
  const pillActive =
    "bg-slate-900 dark:bg-white text-white dark:text-slate-900";
  const pillInactive =
    "bg-white dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/85 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                aria-hidden="true"
              >
                <Wallet className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white">
                  Finanzas
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {currentMonth}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
                onClick={() => setHideAmounts((v) => !v)}
                aria-label={
                  hideAmounts ? "Mostrar importes" : "Ocultar importes"
                }
                aria-pressed={hideAmounts}
              >
                {hideAmounts ? (
                  <EyeOff
                    className="w-5 h-5 text-slate-500 dark:text-slate-300"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="w-5 h-5 text-slate-500 dark:text-slate-300"
                    aria-hidden="true"
                  />
                )}
              </Button>
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm ml-2"
                aria-hidden="true"
              >
                JD
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Selector */}
        <div
          className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1"
          role="group"
          aria-label="Filtrar por cuenta o vista"
        >
          <button
            onClick={() => setViewMode("default")}
            className={cn(
              pillBase,
              !isInvestmentsView && selectedAccountId == null
                ? pillActive
                : pillInactive
            )}
            aria-pressed={!isInvestmentsView && selectedAccountId == null}
          >
            Todas
          </button>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => setSelectedAccountId(acc.id)}
              className={cn(
                pillBase,
                !isInvestmentsView && selectedAccountId === acc.id
                  ? pillActive
                  : pillInactive
              )}
              aria-pressed={!isInvestmentsView && selectedAccountId === acc.id}
            >
              {acc.name}
            </button>
          ))}
          <button
            onClick={() => setViewMode("inversiones")}
            className={cn(
              pillBase,
              "flex items-center gap-1.5",
              isInvestmentsView ? "bg-indigo-600 text-white" : pillInactive
            )}
            aria-pressed={isInvestmentsView}
          >
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            Inversiones
          </button>
          <button
            onClick={() => setShowTransfersModal(true)}
            className="shrink-0 ml-auto p-2 rounded-full bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400 transition-colors"
            aria-label="Transferencias"
            title="Transferencias"
          >
            <ArrowLeftRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setShowAccountsModal(true)}
            className="shrink-0 p-2 rounded-full bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400 transition-colors"
            aria-label="Configuración inicial"
          >
            <Landmark className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Balance Card */}
        <motion.div
          {...fade(0)}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 mb-8"
        >
          <div
            className={cn(
              "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl",
              isInvestmentsView ? "bg-indigo-500/10" : "bg-emerald-500/10"
            )}
          ></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            {isInvestmentsView ? (
              <>
                <p className="text-slate-400 text-sm font-medium mb-1">
                  Cartera de Inversiones
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                  {hideAmounts ? (
                    <span>
                      ****** <span className="text-2xl text-slate-400">€</span>
                    </span>
                  ) : investmentSummary ? (
                    <>
                      {
                        investmentSummary.current_value
                          .toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                          .split(",")[0]
                      }
                      <span className="text-2xl text-slate-400">
                        ,
                        {investmentSummary.current_value
                          .toLocaleString("es-ES", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                          .split(",")[1] || "00"}{" "}
                        €
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl text-slate-400">—</span>
                  )}
                </h2>
                <div className="flex flex-wrap gap-4 sm:gap-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Wallet
                        className="w-5 h-5 text-emerald-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Efectivo</p>
                      <p className="text-white font-semibold">
                        {hideAmounts
                          ? "****** €"
                          : `${summary.balance.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <ArrowDownRight
                        className="w-5 h-5 text-indigo-400"
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Coste cartera</p>
                      <p className="text-white font-semibold">
                        {hideAmounts
                          ? "****** €"
                          : investmentSummary
                            ? `${investmentSummary.total_invested.toLocaleString("es-ES")} €`
                            : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        investmentSummary && investmentSummary.profit_loss >= 0
                          ? "bg-emerald-500/20"
                          : "bg-rose-500/20"
                      )}
                      aria-hidden="true"
                    >
                      {investmentSummary &&
                      investmentSummary.profit_loss >= 0 ? (
                        <TrendingUp
                          className="w-5 h-5 text-emerald-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <TrendingDown
                          className="w-5 h-5 text-rose-400"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Rentabilidad</p>
                      <p
                        className={cn(
                          "font-semibold",
                          investmentSummary &&
                            investmentSummary.profit_loss >= 0
                            ? "text-emerald-400"
                            : "text-rose-400"
                        )}
                      >
                        {hideAmounts
                          ? "****** €"
                          : investmentSummary
                            ? `${investmentSummary.profit_loss >= 0 ? "+" : ""}${investmentSummary.profit_loss.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € (${investmentSummary.profit_loss_pct >= 0 ? "+" : ""}${investmentSummary.profit_loss_pct.toFixed(2)}%)`
                            : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              (() => {
                const totalPatrimonio =
                  summary.balance + (investmentSummary?.current_value ?? 0);
                const patrimonioStr = totalPatrimonio.toLocaleString("es-ES", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });
                const [patrimonioInt, patrimonioDec] = patrimonioStr.split(",");
                return (
                  <>
                    <p className="text-slate-400 text-sm font-medium mb-1">
                      {selectedAccountName
                        ? `Patrimonio — ${selectedAccountName}`
                        : "Patrimonio Total"}
                    </p>
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                      {hideAmounts ? (
                        <span>
                          ******{" "}
                          <span className="text-2xl text-slate-400">€</span>
                        </span>
                      ) : (
                        <>
                          {patrimonioInt}
                          <span className="text-2xl text-slate-400">
                            ,{patrimonioDec || "00"} €
                          </span>
                        </>
                      )}
                    </h2>
                    <div className="flex flex-wrap gap-4 sm:gap-8">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <Wallet
                            className="w-5 h-5 text-emerald-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Efectivo</p>
                          <p className="text-white font-semibold">
                            {hideAmounts
                              ? "****** €"
                              : `${summary.balance.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                          </p>
                        </div>
                      </div>
                      {investmentSummary &&
                        investmentSummary.current_value > 0 && (
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center"
                              aria-hidden="true"
                            >
                              <TrendingUp
                                className="w-5 h-5 text-indigo-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs">
                                Inversiones
                              </p>
                              <p className="text-white font-semibold">
                                {hideAmounts
                                  ? "****** €"
                                  : `${investmentSummary.current_value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`}
                              </p>
                            </div>
                          </div>
                        )}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <ArrowDownRight
                            className="w-5 h-5 text-emerald-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Ingresos</p>
                          <p className="text-white font-semibold">
                            {hideAmounts
                              ? "****** €"
                              : `${summary.total_income.toLocaleString("es-ES")} €`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <ArrowUpRight
                            className="w-5 h-5 text-rose-400"
                            aria-hidden="true"
                          />
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Gastos</p>
                          <p className="text-white font-semibold">
                            {hideAmounts
                              ? "****** €"
                              : `${summary.total_expenses.toLocaleString("es-ES")} €`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            )}
          </div>
        </motion.div>

        {!isInvestmentsView && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <motion.div {...fade(0.1)}>
                <StatCard
                  title="Gasto Hoy"
                  amount={hideAmounts ? "****** €" : formatEur(todayExpenses)}
                  icon={TrendingDown}
                  trend="—"
                  trendUp={false}
                />
              </motion.div>
              <motion.div {...fade(0.15)}>
                <StatCard
                  title="Esta Semana"
                  amount={hideAmounts ? "****** €" : formatEur(weekExpenses)}
                  icon={Wallet}
                  trend="—"
                  trendUp={false}
                />
              </motion.div>
              <motion.div {...fade(0.2)}>
                <StatCard
                  title="Este Mes"
                  amount={
                    hideAmounts ? "****** €" : formatEur(summary.total_expenses)
                  }
                  icon={TrendingDown}
                  trend="—"
                  trendUp={false}
                />
              </motion.div>
              <motion.div {...fade(0.25)}>
                <StatCard
                  title="Ahorro del Mes"
                  amount={hideAmounts ? "****** €" : formatEur(monthlySavings)}
                  icon={TrendingUp}
                  trend="—"
                  trendUp={monthlySavings >= 0}
                />
              </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <motion.div {...fade(0.3)}>
                <ExpenseChart data={categoryData} hideAmounts={hideAmounts} />
              </motion.div>
              <motion.div {...fade(0.35)}>
                <MonthlyChart data={monthlyData} hideAmounts={hideAmounts} />
              </motion.div>
            </div>
          </>
        )}

        {/* Investments */}
        <motion.div {...fade(0.42)} className="mb-8">
          <InvestmentsSection
            accounts={accounts}
            hideAmounts={hideAmounts}
            accountId={selectedAccountId}
          />
        </motion.div>

        {/* Transactions */}
        {!isInvestmentsView && (
          <motion.div
            {...fade(0.4)}
            className="bg-white dark:bg-slate-700/60 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-600">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  Transacciones Recientes
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger
                      className="h-9 w-36 text-xs border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600"
                      aria-label="Filtrar por categoría"
                    >
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {availableCategories.map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="capitalize"
                        >
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(pageLimit)}
                    onValueChange={(v) => setPageLimit(Number(v))}
                  >
                    <SelectTrigger
                      className="h-9 w-24 text-xs border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-600"
                      aria-label="Filas por página"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n} filas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-slate-100 dark:bg-slate-600">
                      <TabsTrigger value="todos" className="text-xs sm:text-sm">
                        Todos
                      </TabsTrigger>
                      <TabsTrigger
                        value="gastos"
                        className="text-xs sm:text-sm"
                      >
                        Gastos
                      </TabsTrigger>
                      <TabsTrigger
                        value="ingresos"
                        className="text-xs sm:text-sm"
                      >
                        Ingresos
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            <div
              className="divide-y divide-slate-50 dark:divide-slate-600/50"
              aria-live="polite"
              aria-busy={loading}
            >
              {loading ? (
                <div
                  className="flex items-center justify-center py-12"
                  role="status"
                  aria-label="Cargando transacciones…"
                >
                  <Loader2
                    className="w-6 h-6 animate-spin text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-12">
                  Sin transacciones
                </p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {visibleTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                      layout
                    >
                      <TransactionItem
                        {...transaction}
                        isIncome={transaction.is_income}
                        onDelete={() => handleDelete(transaction.id)}
                        hideAmount={hideAmounts}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {filteredTransactions.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-600 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Mostrando {visibleTransactions.length} de{" "}
                  {filteredTransactions.length} transacciones
                </p>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Floating Action Button */}
      <motion.div
        {...(shouldReduceMotion
          ? {}
          : {
              initial: { scale: 0 },
              animate: { scale: 1 },
              transition: { delay: 0.5, type: "spring" },
            })}
        className="fixed bottom-6 right-6 z-20"
      >
        <Button
          onClick={() => setShowModal(true)}
          aria-label="Añadir transacción"
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
        >
          <Plus className="w-6 h-6" aria-hidden="true" />
        </Button>
      </motion.div>

      {/* Add Transaction Modal */}
      <AddExpenseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => {
          setShowModal(false);
          loadData();
        }}
        accounts={accounts}
        defaultAccountId={selectedAccountId}
      />

      {/* Accounts Modal */}
      <AccountsModal
        open={showAccountsModal}
        onClose={() => setShowAccountsModal(false)}
        onAccountsChanged={() => {
          loadAccounts();
          loadData();
        }}
      />

      {/* Transfers Modal */}
      <TransfersModal
        open={showTransfersModal}
        onClose={() => setShowTransfersModal(false)}
        accounts={accounts}
      />
    </div>
  );
}
