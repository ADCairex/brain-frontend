import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shared/components/ui/tabs";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Pencil, Trash2, Plus, Loader2, Check, X, ChevronDown, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@shared/lib/utils";
import {
    fetchAccounts, createAccount, updateAccount, deleteAccount,
    fetchAssets, createAsset, updateAsset, deleteAsset,
    fetchInvestmentsBySymbol, deleteInvestment,
} from "@finance/api/api";
import AddInvestmentModal from "./AddInvestmentModal";

// ── Shared helpers ─────────────────────────────────────────────────────────────

const formatEur = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

// ── Accounts ──────────────────────────────────────────────────────────────────

function AccountRow({ account, onEdit, onDelete, deleting }) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="flex items-center gap-3 py-3 px-1">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{account.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Saldo inicial: {formatEur(account.initial_balance)}
                </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {confirmDelete ? (
                    <>
                        <Button
                            size="sm"
                            onClick={() => { onDelete(account.id); setConfirmDelete(false); }}
                            disabled={deleting}
                            className="h-8 px-2 bg-rose-500 hover:bg-rose-600 text-white text-xs"
                            aria-label={`Confirmar eliminación de ${account.name}`}
                        >
                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : 'Eliminar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} className="h-8 px-2 text-xs">
                            Cancelar
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(account)}
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            aria-label={`Editar ${account.name}`}>
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(true)}
                            className="h-8 w-8 text-slate-500 hover:text-rose-500"
                            aria-label={`Eliminar ${account.name}`}>
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

function AccountForm({ initial = null, onSave, onCancel, saving }) {
    const [name, setName] = useState(initial?.name ?? '');
    const [balance, setBalance] = useState(initial?.initial_balance != null ? String(initial.initial_balance) : '');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) { setError('Ingresa un nombre'); return; }
        onSave({ name: name.trim(), initial_balance: parseFloat(balance) || 0 });
    };

    return (
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="space-y-1">
                <Label htmlFor="account-name" className="text-xs text-slate-600 dark:text-slate-300">Nombre</Label>
                <Input
                    id="account-name" name="account-name" placeholder="Ej: BBVA…" autoComplete="off"
                    value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="h-9"
                />
            </div>
            <div className="space-y-1">
                <Label htmlFor="account-balance" className="text-xs text-slate-600 dark:text-slate-300">Saldo inicial (€)</Label>
                <Input
                    id="account-balance" name="account-balance" type="number" inputMode="decimal"
                    placeholder="0.00" autoComplete="off"
                    value={balance} onChange={(e) => setBalance(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="h-9"
                />
            </div>
            {error && <p className="text-xs text-rose-500" role="alert">{error}</p>}
            <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving} size="sm"
                    className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" aria-hidden="true" /> : <Check className="w-3 h-3 mr-1" aria-hidden="true" />}
                    {saving ? 'Guardando…' : initial ? 'Actualizar' : 'Crear cuenta'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving} className="h-9">
                    <X className="w-3 h-3" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

// ── Assets ────────────────────────────────────────────────────────────────────

const ASSET_CATEGORIES = [
    { value: "vehiculo", label: "Vehículo" },
    { value: "inmueble", label: "Inmueble" },
    { value: "electronico", label: "Electrónico" },
    { value: "otro", label: "Otro" },
];

function AssetRow({ asset, accounts, onEdit, onDelete, deleting }) {
    const [confirmDelete, setConfirmDelete] = useState(false);
    const category = ASSET_CATEGORIES.find(c => c.value === asset.category)?.label ?? asset.category;
    const accountName = accounts.find(a => a.id === asset.account_id)?.name;

    return (
        <div className="flex items-center gap-3 py-3 px-1">
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{asset.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {formatEur(asset.value)} · {category}
                    {accountName && <span className="ml-1">· {accountName}</span>}
                </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {confirmDelete ? (
                    <>
                        <Button
                            size="sm"
                            onClick={() => { onDelete(asset.id); setConfirmDelete(false); }}
                            disabled={deleting}
                            className="h-8 px-2 bg-rose-500 hover:bg-rose-600 text-white text-xs"
                            aria-label={`Confirmar eliminación de ${asset.name}`}
                        >
                            {deleting ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : 'Eliminar'}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)} className="h-8 px-2 text-xs">
                            Cancelar
                        </Button>
                    </>
                ) : (
                    <>
                        <Button size="icon" variant="ghost" onClick={() => onEdit(asset)}
                            className="h-8 w-8 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            aria-label={`Editar ${asset.name}`}>
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(true)}
                            className="h-8 w-8 text-slate-500 hover:text-rose-500"
                            aria-label={`Eliminar ${asset.name}`}>
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

function AssetForm({ initial = null, accounts, onSave, onCancel, saving }) {
    const [name, setName] = useState(initial?.name ?? '');
    const [value, setValue] = useState(initial?.value != null ? String(initial.value) : '');
    const [category, setCategory] = useState(initial?.category ?? 'otro');
    const [accountId, setAccountId] = useState(initial?.account_id != null ? String(initial.account_id) : 'none');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) { setError('Ingresa un nombre'); return; }
        if (!value || isNaN(parseFloat(value))) { setError('Ingresa un valor válido'); return; }
        onSave({
            name: name.trim(),
            value: parseFloat(value),
            category,
            acquisition_date: initial?.acquisition_date ?? new Date().toISOString().split('T')[0],
            is_initial: true,
            account_id: accountId !== 'none' ? parseInt(accountId, 10) : null,
        });
    };

    return (
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
            <div className="space-y-1">
                <Label htmlFor="asset-name" className="text-xs text-slate-600 dark:text-slate-300">Nombre</Label>
                <Input
                    id="asset-name" name="asset-name" placeholder="Ej: Honda Civic 2020…" autoComplete="off"
                    value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="h-9"
                />
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="asset-value" className="text-xs text-slate-600 dark:text-slate-300">Valor (€)</Label>
                    <Input
                        id="asset-value" name="asset-value" type="number" inputMode="decimal"
                        placeholder="0.00" autoComplete="off"
                        value={value} onChange={(e) => setValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="h-9"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="asset-category" className="text-xs text-slate-600 dark:text-slate-300">Categoría</Label>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="asset-category" className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ASSET_CATEGORIES.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {accounts.length > 0 && (
                <div className="space-y-1">
                    <Label htmlFor="asset-account" className="text-xs text-slate-600 dark:text-slate-300">Cuenta asociada (opcional)</Label>
                    <Select value={accountId} onValueChange={setAccountId}>
                        <SelectTrigger id="asset-account" className="h-9">
                            <SelectValue placeholder="Sin cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin cuenta</SelectItem>
                            {accounts.map(a => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {error && <p className="text-xs text-rose-500" role="alert">{error}</p>}
            <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={saving} size="sm"
                    className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                    {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" aria-hidden="true" /> : <Check className="w-3 h-3 mr-1" aria-hidden="true" />}
                    {saving ? 'Guardando…' : initial ? 'Actualizar' : 'Añadir activo'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel} disabled={saving} className="h-9">
                    <X className="w-3 h-3" aria-hidden="true" />
                </Button>
            </div>
        </div>
    );
}

// ── Investments (compact, for setup modal) ────────────────────────────────────

const fmtEur = (n) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

function InvestmentSymbolRow({ group, onDeletePurchase, onAddPurchase }) {
    const [expanded, setExpanded] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const { asset_symbol, asset_name, total_quantity, avg_purchase_price, cost_basis, profit_loss, profit_loss_pct, purchases } = group;
    const isGain = profit_loss >= 0;

    const handleDelete = async (id) => {
        setDeletingId(id);
        await onDeletePurchase(id);
        setDeletingId(null);
    };

    return (
        <>
            <div
                className="flex items-center gap-3 py-3 px-1 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors"
                onClick={() => setExpanded(v => !v)}
                role="button"
                aria-expanded={expanded}
            >
                <div className="shrink-0 text-slate-400">
                    {expanded
                        ? <ChevronDown className="w-4 h-4" aria-hidden="true" />
                        : <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    }
                </div>
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 leading-none">{asset_symbol}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white truncate text-sm">{asset_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {total_quantity} acc. · {fmtEur(avg_purchase_price)} medio
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">{fmtEur(cost_basis)}</p>
                    <p className={cn("text-xs font-medium tabular-nums flex items-center justify-end gap-0.5", isGain ? "text-emerald-500" : "text-rose-500")}>
                        {isGain ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {profit_loss_pct.toFixed(1)}%
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onAddPurchase?.({ asset_symbol, asset_name }); }}
                    className="p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 shrink-0 transition-colors"
                    aria-label={`Añadir compra de ${asset_name}`}
                >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
            </div>

            {expanded && (
                <div className="ml-7 space-y-1 pb-2 max-h-64 overflow-y-auto overscroll-contain">
                    {purchases.map(p => (
                        <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-sm">
                            <div className="flex-1 min-w-0">
                                <span className="text-slate-700 dark:text-slate-300 tabular-nums">
                                    {p.quantity} × {fmtEur(p.purchase_price)}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs">{fmtDate(p.purchase_date)}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(p.id)}
                                disabled={deletingId === p.id}
                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-400 hover:text-rose-500 transition-colors shrink-0"
                                aria-label="Eliminar compra"
                            >
                                {deletingId === p.id
                                    ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                    : <Trash2 className="w-3 h-3" aria-hidden="true" />
                                }
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

// ── Combined modal ─────────────────────────────────────────────────────────────

export default function AccountsModal({ open, onClose, onAccountsChanged }) {
    const [accounts, setAccounts] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [loadingAssets, setLoadingAssets] = useState(true);

    const [editingAccount, setEditingAccount] = useState(null);
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [savingAccount, setSavingAccount] = useState(false);
    const [deletingAccountId, setDeletingAccountId] = useState(null);

    const [editingAsset, setEditingAsset] = useState(null);
    const [creatingAsset, setCreatingAsset] = useState(false);
    const [savingAsset, setSavingAsset] = useState(false);
    const [deletingAssetId, setDeletingAssetId] = useState(null);

    const [investmentGroups, setInvestmentGroups] = useState([]);
    const [loadingInvestments, setLoadingInvestments] = useState(true);
    const [showAddInvestmentModal, setShowAddInvestmentModal] = useState(false);
    const [investmentPrefill, setInvestmentPrefill] = useState(null);

    const handleAddInvestmentPurchase = (prefill) => {
        setInvestmentPrefill(prefill);
        setShowAddInvestmentModal(true);
    };

    const [error, setError] = useState('');

    const loadAccounts = useCallback(async () => {
        setLoadingAccounts(true);
        try {
            setAccounts(await fetchAccounts());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAccounts(false);
        }
    }, []);

    const loadAssets = useCallback(async () => {
        setLoadingAssets(true);
        try {
            const data = await fetchAssets();
            setAssets(data.filter(a => a.is_initial));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingAssets(false);
        }
    }, []);

    const loadInvestments = useCallback(async () => {
        setLoadingInvestments(true);
        try {
            setInvestmentGroups(await fetchInvestmentsBySymbol({ is_initial: true }));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingInvestments(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            setError('');
            setCreatingAccount(false);
            setEditingAccount(null);
            setCreatingAsset(false);
            setEditingAsset(null);
            loadAccounts();
            loadAssets();
            loadInvestments();
        }
    }, [open, loadAccounts, loadAssets, loadInvestments]);

    // Account handlers
    const handleCreateAccount = async (data) => {
        setSavingAccount(true);
        try {
            await createAccount(data);
            setCreatingAccount(false);
            await loadAccounts();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setSavingAccount(false); }
    };

    const handleUpdateAccount = async (data) => {
        setSavingAccount(true);
        try {
            await updateAccount(editingAccount.id, data);
            setEditingAccount(null);
            await loadAccounts();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setSavingAccount(false); }
    };

    const handleDeleteAccount = async (id) => {
        setDeletingAccountId(id);
        try {
            await deleteAccount(id);
            await loadAccounts();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setDeletingAccountId(null); }
    };

    // Asset handlers
    const handleCreateAsset = async (data) => {
        setSavingAsset(true);
        try {
            await createAsset(data);
            setCreatingAsset(false);
            await loadAssets();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setSavingAsset(false); }
    };

    const handleUpdateAsset = async (data) => {
        setSavingAsset(true);
        try {
            await updateAsset(editingAsset.id, data);
            setEditingAsset(null);
            await loadAssets();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setSavingAsset(false); }
    };

    const handleDeleteAsset = async (id) => {
        setDeletingAssetId(id);
        try {
            await deleteAsset(id);
            await loadAssets();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
        finally { setDeletingAssetId(null); }
    };

    const handleDeleteInvestment = async (id) => {
        try {
            await deleteInvestment(id);
            await loadInvestments();
            onAccountsChanged?.();
        } catch (err) { setError(err.message); }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm overscroll-contain">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        Configuración inicial
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="accounts" className="w-full">
                    <TabsList className="w-full bg-slate-100 dark:bg-slate-700">
                        <TabsTrigger value="accounts" className="flex-1 text-sm">Cuentas</TabsTrigger>
                        <TabsTrigger value="assets" className="flex-1 text-sm">Activos</TabsTrigger>
                        <TabsTrigger value="investments" className="flex-1 text-sm">Inversiones</TabsTrigger>
                    </TabsList>

                    {/* ── Accounts tab ── */}
                    <TabsContent value="accounts" className="mt-4 space-y-1">
                        {loadingAccounts ? (
                            <div className="flex justify-center py-8" role="status" aria-label="Cargando cuentas…">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden="true" />
                            </div>
                        ) : accounts.length === 0 && !creatingAccount ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                No hay cuentas. Crea la primera.
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-600">
                                {accounts.map((account) => (
                                    editingAccount?.id === account.id ? (
                                        <div key={account.id} className="py-2">
                                            <AccountForm
                                                initial={editingAccount}
                                                onSave={handleUpdateAccount}
                                                onCancel={() => setEditingAccount(null)}
                                                saving={savingAccount}
                                            />
                                        </div>
                                    ) : (
                                        <AccountRow
                                            key={account.id}
                                            account={account}
                                            onEdit={setEditingAccount}
                                            onDelete={handleDeleteAccount}
                                            deleting={deletingAccountId === account.id}
                                        />
                                    )
                                ))}
                            </div>
                        )}

                        {creatingAccount ? (
                            <div className="pt-2">
                                <AccountForm
                                    onSave={handleCreateAccount}
                                    onCancel={() => setCreatingAccount(false)}
                                    saving={savingAccount}
                                />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => { setCreatingAccount(true); setEditingAccount(null); }}
                                className="w-full h-10 mt-3 border-dashed text-slate-600 dark:text-slate-300"
                            >
                                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                                Nueva cuenta
                            </Button>
                        )}
                    </TabsContent>

                    {/* ── Assets tab ── */}
                    <TabsContent value="assets" className="mt-4 space-y-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Patrimonio de partida — no cuentan como gasto.
                        </p>
                        {loadingAssets ? (
                            <div className="flex justify-center py-8" role="status" aria-label="Cargando activos…">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden="true" />
                            </div>
                        ) : assets.length === 0 && !creatingAsset ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                No hay activos. Añade el primero.
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-600">
                                {assets.map((asset) => (
                                    editingAsset?.id === asset.id ? (
                                        <div key={asset.id} className="py-2">
                                            <AssetForm
                                                initial={editingAsset}
                                                accounts={accounts}
                                                onSave={handleUpdateAsset}
                                                onCancel={() => setEditingAsset(null)}
                                                saving={savingAsset}
                                            />
                                        </div>
                                    ) : (
                                        <AssetRow
                                            key={asset.id}
                                            asset={asset}
                                            accounts={accounts}
                                            onEdit={setEditingAsset}
                                            onDelete={handleDeleteAsset}
                                            deleting={deletingAssetId === asset.id}
                                        />
                                    )
                                ))}
                            </div>
                        )}

                        {creatingAsset ? (
                            <div className="pt-2">
                                <AssetForm
                                    accounts={accounts}
                                    onSave={handleCreateAsset}
                                    onCancel={() => setCreatingAsset(false)}
                                    saving={savingAsset}
                                />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => { setCreatingAsset(true); setEditingAsset(null); }}
                                className="w-full h-10 mt-3 border-dashed text-slate-600 dark:text-slate-300"
                            >
                                <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                                Nuevo activo
                            </Button>
                        )}
                    </TabsContent>
                    {/* ── Investments tab ── */}
                    <TabsContent value="investments" className="mt-4 space-y-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                            Posiciones de partida — no se descuentan del balance (configuración inicial).
                        </p>
                        {loadingInvestments ? (
                            <div className="flex justify-center py-8" role="status" aria-label="Cargando inversiones…">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" aria-hidden="true" />
                            </div>
                        ) : investmentGroups.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                                Sin inversiones. Añade la primera.
                            </p>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-600">
                                {investmentGroups.map(group => (
                                    <InvestmentSymbolRow
                                        key={group.asset_symbol}
                                        group={group}
                                        onDeletePurchase={handleDeleteInvestment}
                                        onAddPurchase={handleAddInvestmentPurchase}
                                    />
                                ))}
                            </div>
                        )}

                        <Button
                            variant="outline"
                            onClick={() => { setInvestmentPrefill(null); setShowAddInvestmentModal(true); }}
                            className="w-full h-10 mt-3 border-dashed text-slate-600 dark:text-slate-300"
                        >
                            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                            Nueva compra
                        </Button>
                    </TabsContent>
                </Tabs>

                {error && (
                    <p className="text-sm text-rose-500 text-center pt-1" role="alert">{error}</p>
                )}
            </DialogContent>

            <AddInvestmentModal
                open={showAddInvestmentModal}
                onClose={() => { setShowAddInvestmentModal(false); setInvestmentPrefill(null); }}
                onSaved={() => { setShowAddInvestmentModal(false); setInvestmentPrefill(null); loadInvestments(); onAccountsChanged?.(); }}
                accounts={accounts}
                isInitial={true}
                prefill={investmentPrefill}
            />
        </Dialog>
    );
}
