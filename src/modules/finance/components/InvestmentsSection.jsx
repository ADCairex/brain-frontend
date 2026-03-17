import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@shared/components/ui/button";
import { Plus, Loader2, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@shared/lib/utils";
import { fetchInvestmentsBySymbol, fetchInvestmentsSummary, deleteInvestment } from "@finance/api/api";
import AddInvestmentModal from "./AddInvestmentModal";

const fmt = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const fmtPct = (n) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Individual purchase row (shown when symbol is expanded) ───────────────────

function PurchaseRow({ purchase, onDelete, hideAmounts = false, accounts = /** @type {Array<{id: number, name: string}>} */([]) }) {
    const [confirming, setConfirming] = useState(false);
    const { id, quantity, purchase_price, purchase_date, current_value, profit_loss, profit_loss_pct, source_account_id } = purchase;
    const isGain = profit_loss >= 0;
    const accountName = source_account_id ? accounts.find(a => a.id === source_account_id)?.name : null;

    return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-600/50">
            {/* Spacer for symbol badge alignment */}
            <div className="w-12 shrink-0" />

            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 dark:text-slate-300 tabular-nums">
                    {quantity} × {fmt(purchase_price)}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {fmtDate(purchase_date)}
                    {accountName && <span className="ml-1.5 inline-flex items-center rounded bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-400">{accountName}</span>}
                </p>
            </div>

            <div className="text-right shrink-0">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {hideAmounts ? '****** €' : fmt(current_value)}
                </p>
                <p className={cn("text-xs font-medium tabular-nums flex items-center justify-end gap-0.5", isGain ? "text-emerald-500" : "text-rose-500")}>
                    {isGain
                        ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                        : <TrendingDown className="w-3 h-3" aria-hidden="true" />
                    }
                    {hideAmounts ? '****** €' : `${fmt(profit_loss)} (${fmtPct(profit_loss_pct)})`}
                </p>
            </div>

            {confirming ? (
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => { onDelete(id); setConfirming(false); }}
                        className="px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
                        aria-label="Confirmar eliminación"
                    >
                        Eliminar
                    </button>
                    <button
                        onClick={() => setConfirming(false)}
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setConfirming(true)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 shrink-0 transition-colors"
                    aria-label={`Eliminar compra del ${fmtDate(purchase_date)}`}
                >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

// ── Symbol row (collapsed / expanded) ─────────────────────────────────────────

function SymbolRow({ group, onDelete, onAddPurchase, hideAmounts = false, accounts = /** @type {Array<{id: number, name: string}>} */([]) }) {
    const [expanded, setExpanded] = useState(false);
    const { asset_symbol, asset_name, total_quantity, avg_purchase_price, current_value, profit_loss, profit_loss_pct, purchases } = group;
    const isGain = profit_loss >= 0;

    return (
        <>
            <div
                className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-600/30 transition-colors cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}
                role="button"
                aria-expanded={expanded}
                aria-label={`${asset_name} — ${expanded ? 'colapsar' : 'expandir'} compras`}
            >
                {/* Expand chevron */}
                <div className="shrink-0 text-slate-400">
                    {expanded
                        ? <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        : <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    }
                </div>

                {/* Symbol badge */}
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate px-1 leading-none text-center">
                        {asset_symbol}
                    </span>
                </div>

                {/* Name & summary */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{asset_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {total_quantity} acc. · precio medio {fmt(avg_purchase_price)}
                        {purchases.length > 1 && <span className="ml-1">· {purchases.length} compras</span>}
                    </p>
                </div>

                {/* Value & P&L */}
                <div className="text-right shrink-0">
                    <p className="font-semibold text-slate-900 dark:text-white tabular-nums">
                        {hideAmounts ? '****** €' : fmt(current_value)}
                    </p>
                    <p className={cn("text-sm font-medium tabular-nums flex items-center justify-end gap-0.5", isGain ? "text-emerald-500" : "text-rose-500")}>
                        {isGain
                            ? <TrendingUp className="w-3 h-3" aria-hidden="true" />
                            : <TrendingDown className="w-3 h-3" aria-hidden="true" />
                        }
                        {hideAmounts ? '****** €' : `${fmt(profit_loss)} (${fmtPct(profit_loss_pct)})`}
                    </p>
                </div>

                {/* Add purchase to this symbol */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddPurchase?.({ asset_symbol, asset_name }); }}
                    className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 transition-colors"
                    aria-label={`Añadir compra de ${asset_name}`}
                >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
            </div>

            {expanded && (
                <div className="max-h-64 overflow-y-auto overscroll-contain">
                    {purchases.map(p => (
                        <PurchaseRow key={p.id} purchase={p} onDelete={onDelete} hideAmounts={hideAmounts} accounts={accounts} />
                    ))}
                </div>
            )}
        </>
    );
}

// ── Section ───────────────────────────────────────────────────────────────────

export default function InvestmentsSection({ accounts = /** @type {Array<{id: number, name: string, initial_balance: number}>} */([]), hideAmounts = false, accountId = /** @type {number | null} */(null) }) {
    const [groups, setGroups] = useState(/** @type {any[]} */([]));
    const [summary, setSummary] = useState(/** @type {{ total_invested: number, current_value: number, profit_loss: number, profit_loss_pct: number } | null} */(null));
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addPrefill, setAddPrefill] = useState(null);

    const handleAddPurchase = (prefill) => {
        setAddPrefill(prefill);
        setShowAddModal(true);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = accountId != null ? { account_id: accountId } : {};
            const [bySymbol, sum] = await Promise.all([
                fetchInvestmentsBySymbol(params),
                fetchInvestmentsSummary(params),
            ]);
            setGroups(bySymbol);
            setSummary(sum);
        } catch (err) {
            console.error("Error loading investments:", err);
        } finally {
            setLoading(false);
        }
    }, [accountId]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const id = setInterval(async () => {
            try {
                const params = accountId != null ? { account_id: accountId } : {};
                const [bySymbol, sum] = await Promise.all([
                    fetchInvestmentsBySymbol(params),
                    fetchInvestmentsSummary(params),
                ]);
                setGroups(bySymbol);
                setSummary(sum);
            } catch { /* silent */ }
        }, Number(import.meta.env.VITE_POLL_INTERVAL) || 30_000);
        return () => clearInterval(id);
    }, [accountId]);

    const handleDelete = async (id) => {
        try {
            await deleteInvestment(id);
            loadData();
        } catch (err) {
            console.error("Error deleting investment:", err);
        }
    };

    const isGain = summary && summary.profit_loss >= 0;
    const totalPositions = groups.reduce((sum, g) => sum + g.purchases.length, 0);

    return (
        <div className="bg-white dark:bg-slate-700/60 rounded-2xl border border-slate-100 dark:border-slate-600 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-600">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Cartera de Inversiones</h3>
                        {summary && !loading && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                {groups.length} {groups.length === 1 ? 'activo' : 'activos'} · {totalPositions} {totalPositions === 1 ? 'compra' : 'compras'}
                            </p>
                        )}
                    </div>

                    {summary && !loading && (
                        <div className="flex flex-wrap gap-3 text-right">
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Invertido</p>
                                <p className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm">
                                    {hideAmounts ? '****** €' : fmt(summary.total_invested)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Valor actual</p>
                                <p className="font-semibold text-slate-900 dark:text-white tabular-nums text-sm">
                                    {hideAmounts ? '****** €' : fmt(summary.current_value)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Rentabilidad</p>
                                <p className={cn("font-semibold tabular-nums text-sm flex items-center gap-0.5", isGain ? "text-emerald-500" : "text-rose-500")}>
                                    {isGain
                                        ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                                        : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                                    }
                                    {hideAmounts ? '****** €' : `${fmt(summary.profit_loss)} (${fmtPct(summary.profit_loss_pct)})`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="divide-y divide-slate-50 dark:divide-slate-600/50" aria-live="polite" aria-busy={loading}>
                {loading ? (
                    <div className="flex justify-center py-10" role="status" aria-label="Cargando inversiones…">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden="true" />
                    </div>
                ) : groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-slate-400 dark:text-slate-500">
                        <TrendingUp className="w-8 h-8 opacity-40" aria-hidden="true" />
                        <p className="text-sm">Sin inversiones registradas</p>
                    </div>
                ) : (
                    groups.map(group => (
                        <SymbolRow key={group.asset_symbol} group={group} onDelete={handleDelete} onAddPurchase={handleAddPurchase} hideAmounts={hideAmounts} accounts={accounts} />
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-600">
                <Button
                    onClick={() => { setAddPrefill(null); setShowAddModal(true); }}
                    variant="ghost"
                    className="w-full text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                >
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Añadir compra
                </Button>
            </div>

            <AddInvestmentModal
                open={showAddModal}
                onClose={() => { setShowAddModal(false); setAddPrefill(null); }}
                onSaved={() => { setShowAddModal(false); setAddPrefill(null); loadData(); }}
                accounts={accounts}
                prefill={addPrefill}
            />
        </div>
    );
}
