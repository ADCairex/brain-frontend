import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Textarea } from "@shared/components/ui/textarea";
import { Calendar } from "@shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@shared/lib/utils";
import { createInvestment } from "@finance/api/api";

export default function AddInvestmentModal({ open, onClose, onSaved, accounts = [], isInitial = false, prefill = null }) {
    const [symbol, setSymbol] = useState('');
    const [assetName, setAssetName] = useState('');
    const [assetType, setAssetType] = useState('stock');
    const [totalPaid, setTotalPaid] = useState('');
    const [commission, setCommission] = useState('');
    const [quantity, setQuantity] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date());
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    // Pre-fill symbol & name when adding a purchase to an existing asset
    useEffect(() => {
        if (open && prefill) {
            setSymbol(prefill.asset_symbol || '');
            setAssetName(prefill.asset_name || '');
        }
    }, [open, prefill]);

    // Precio unitario derivado = (total pagado - comisión) / cantidad recibida
    const commissionVal = parseFloat(commission) || 0;
    const netInvested = parseFloat(totalPaid) > 0 ? parseFloat(totalPaid) - commissionVal : 0;
    const derivedPricePerUnit = netInvested > 0 && parseFloat(quantity) > 0
        ? netInvested / parseFloat(quantity)
        : null;

    const resetForm = () => {
        setSymbol('');
        setAssetName('');
        setAssetType('stock');
        setTotalPaid('');
        setCommission('');
        setQuantity('');
        setPurchaseDate(new Date());
        setSourceAccountId('');
        setNotes('');
        setError('');
        setFieldErrors({});
    };

    const handleSave = async () => {
        setError('');
        const errs = {};
        if (!symbol.trim()) errs.symbol = 'Ingresa el símbolo (ej: AAPL)';
        if (!assetName.trim()) errs.assetName = 'Ingresa el nombre del activo';
        if (!totalPaid || parseFloat(totalPaid) <= 0) errs.totalPaid = 'Ingresa el importe pagado';
        if (!quantity || parseFloat(quantity) <= 0) errs.quantity = 'Ingresa la cantidad recibida';
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        setFieldErrors({});
        setSaving(true);
        const qty = parseFloat(quantity);
        const paid = parseFloat(totalPaid);
        const comm = parseFloat(commission) || 0;
        try {
            await createInvestment({
                asset_symbol: symbol.trim().toUpperCase(),
                asset_name: assetName.trim(),
                asset_type: assetType,
                quantity: qty,
                purchase_price: (paid - comm) / qty,  // precio unitario = (total - comisión) / unidades
                purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
                source_account_id: sourceAccountId && sourceAccountId !== 'none' ? parseInt(sourceAccountId, 10) : null,
                is_initial: isInitial,
                notes: notes.trim() || null,
            });
            resetForm();
            onSaved?.();
        } catch (err) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md overscroll-contain">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                        {prefill ? `Nueva compra — ${prefill.asset_name}` : 'Nueva Inversión'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Symbol + Name row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="inv-symbol" className="text-slate-700 dark:text-slate-300">Símbolo</Label>
                            <Input
                                id="inv-symbol"
                                name="inv-symbol"
                                placeholder="AAPL…"
                                autoComplete="off"
                                spellCheck={false}
                                className="h-12 uppercase"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                disabled={!!prefill}
                            />
                            {fieldErrors.symbol && <p className="text-xs text-rose-500" role="alert">{fieldErrors.symbol}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-name" className="text-slate-700 dark:text-slate-300">Nombre</Label>
                            <Input
                                id="inv-name"
                                name="inv-name"
                                placeholder="Apple Inc.…"
                                autoComplete="off"
                                className="h-12"
                                value={assetName}
                                onChange={(e) => setAssetName(e.target.value)}
                                disabled={!!prefill}
                            />
                            {fieldErrors.assetName && <p className="text-xs text-rose-500" role="alert">{fieldErrors.assetName}</p>}
                        </div>
                    </div>

                    {/* Asset type */}
                    <div className="space-y-2">
                        <Label htmlFor="inv-type" className="text-slate-700 dark:text-slate-300">Tipo de activo</Label>
                        <Select value={assetType} onValueChange={setAssetType} name="inv-type" disabled={!!prefill}>
                            <SelectTrigger id="inv-type" className="h-12">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="stock">Acción</SelectItem>
                                <SelectItem value="etf">ETF</SelectItem>
                                <SelectItem value="crypto">Criptomoneda</SelectItem>
                                <SelectItem value="fund">Fondo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Total paid + Commission row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="inv-total" className="text-slate-700 dark:text-slate-300">Total pagado (€)</Label>
                            <Input
                                id="inv-total"
                                name="inv-total"
                                type="number"
                                inputMode="decimal"
                                placeholder="600"
                                autoComplete="off"
                                className="h-12"
                                value={totalPaid}
                                onChange={(e) => setTotalPaid(e.target.value)}
                            />
                            {fieldErrors.totalPaid && <p className="text-xs text-rose-500" role="alert">{fieldErrors.totalPaid}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inv-commission" className="text-slate-700 dark:text-slate-300">Comisión (€)</Label>
                            <Input
                                id="inv-commission"
                                name="inv-commission"
                                type="number"
                                inputMode="decimal"
                                placeholder="1"
                                autoComplete="off"
                                className="h-12"
                                value={commission}
                                onChange={(e) => setCommission(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="inv-quantity" className="text-slate-700 dark:text-slate-300">Cantidad recibida</Label>
                        <Input
                            id="inv-quantity"
                            name="inv-quantity"
                            type="number"
                            inputMode="decimal"
                            placeholder="1"
                            autoComplete="off"
                            className="h-12"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                        {fieldErrors.quantity && <p className="text-xs text-rose-500" role="alert">{fieldErrors.quantity}</p>}
                    </div>

                    {/* Derived price per unit (informational) */}
                    {derivedPricePerUnit !== null && (
                        <div className="space-y-1 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Invertido en acciones</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 tabular-nums text-sm">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(netInvested)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Precio unitario</span>
                                <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(derivedPricePerUnit)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Purchase date */}
                    <div className="space-y-2">
                        <Label htmlFor="inv-date-button" className="text-slate-700 dark:text-slate-300">Fecha de compra</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="inv-date-button"
                                    variant="outline"
                                    className={cn("w-full h-12 justify-start text-left font-normal", !purchaseDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                                    {purchaseDate ? format(purchaseDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={purchaseDate} onSelect={setPurchaseDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Source account */}
                    {accounts.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="inv-account" className="text-slate-700 dark:text-slate-300">Cuenta origen (opcional)</Label>
                            <Select value={sourceAccountId} onValueChange={setSourceAccountId} name="inv-account">
                                <SelectTrigger id="inv-account" className="h-12">
                                    <SelectValue placeholder="Sin cuenta asociada" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Sin cuenta asociada</SelectItem>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={String(acc.id)}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {sourceAccountId && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {isInitial
                                        ? 'Cuenta de referencia — no se descontará del saldo (configuración inicial).'
                                        : 'El importe se descontará del saldo de esta cuenta.'
                                    }
                                </p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="inv-notes" className="text-slate-700 dark:text-slate-300">Notas (opcional)</Label>
                        <Textarea
                            id="inv-notes"
                            name="inv-notes"
                            placeholder="Agregar notas adicionales…"
                            className="resize-none"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-rose-500 text-center" role="alert" aria-live="polite">{error}</p>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1 h-12" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-12 font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" /> : null}
                        {saving ? 'Guardando…' : 'Registrar Inversión'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
