import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shared/components/ui/select";
import { Textarea } from "@shared/components/ui/textarea";
import { Switch } from "@shared/components/ui/switch";
import { Calendar } from "@shared/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@shared/lib/utils";
import { createTransaction } from "@finance/api/api";

const categories = [
    { value: 'comida', label: '🍔 Comida' },
    { value: 'transporte', label: '🚗 Transporte' },
    { value: 'entretenimiento', label: '🎬 Entretenimiento' },
    { value: 'salud', label: '💊 Salud' },
    { value: 'compras', label: '🛍️ Compras' },
    { value: 'servicios', label: '📱 Servicios' },
    { value: 'educacion', label: '📚 Educación' },
    { value: 'otros', label: '📦 Otros' },
];

export default function AddExpenseModal({ open, onClose, onSaved, accounts = /** @type {Array<{id: number, name: string, initial_balance: number}>} */([]), defaultAccountId = /** @type {number | null} */(null) }) {
    const [isIncome, setIsIncome] = useState(false);
    const [date, setDate] = useState(new Date());
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [accountId, setAccountId] = useState(defaultAccountId ? String(defaultAccountId) : '');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState(/** @type {{ [key: string]: string }} */({}));

    const resetForm = () => {
        setIsIncome(false);
        setDate(new Date());
        setAmount('');
        setDescription('');
        setCategory('');
        setAccountId(defaultAccountId ? String(defaultAccountId) : '');
        setNotes('');
        setError('');
        setFieldErrors({});
    };

    const handleSave = async () => {
        setError('');
        const errs = /** @type {{ [key: string]: string }} */({});
        if (!amount || parseFloat(amount) <= 0) errs.amount = 'Ingresa un monto válido';
        if (!description.trim()) errs.description = 'Ingresa una descripción';
        if (!isIncome && !category) errs.category = 'Selecciona una categoría';
        if (Object.keys(errs).length > 0) {
            setFieldErrors(errs);
            return;
        }
        setFieldErrors({});

        setSaving(true);
        try {
            await createTransaction({
                description: description.trim(),
                amount: parseFloat(amount),
                category: isIncome ? 'ingreso' : category,
                date: date.toISOString(),
                is_income: isIncome,
                notes: notes.trim() || null,
                account_id: accountId ? parseInt(accountId, 10) : null,
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
                        {isIncome ? 'Nuevo Ingreso' : 'Nuevo Gasto'}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-5 py-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                        <Label htmlFor="income-switch" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            {isIncome ? '💰 Es un ingreso' : '💸 Es un gasto'}
                        </Label>
                        <Switch
                            id="income-switch"
                            checked={isIncome}
                            onCheckedChange={setIsIncome}
                            aria-label={isIncome ? 'Cambiar a gasto' : 'Cambiar a ingreso'}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-slate-700 dark:text-slate-300">Monto</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium" aria-hidden="true">€</span>
                            <Input
                                id="amount"
                                name="amount"
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                autoComplete="off"
                                className="pl-8 h-12 text-lg font-medium"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        {fieldErrors.amount && <p className="text-sm text-rose-500" role="alert">{fieldErrors.amount}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">Descripción</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="Ej: Almuerzo en restaurante…"
                            autoComplete="off"
                            className="h-12"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        {fieldErrors.description && <p className="text-sm text-rose-500" role="alert">{fieldErrors.description}</p>}
                    </div>

                    {!isIncome && (
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-slate-700 dark:text-slate-300">Categoría</Label>
                            <Select value={category} onValueChange={setCategory} name="category">
                                <SelectTrigger id="category" className="h-12">
                                    <SelectValue placeholder="Seleccionar categoría" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {fieldErrors.category && <p className="text-sm text-rose-500" role="alert">{fieldErrors.category}</p>}
                        </div>
                    )}

                    {accounts.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="account-select" className="text-slate-700 dark:text-slate-300">Cuenta (opcional)</Label>
                            <Select value={accountId} onValueChange={setAccountId} name="account">
                                <SelectTrigger id="account-select" className="h-12">
                                    <SelectValue placeholder="Sin cuenta asociada" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={String(acc.id)}>
                                            {acc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="date-button" className="text-slate-700 dark:text-slate-300">Fecha</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date-button"
                                    variant="outline"
                                    className={cn(
                                        "w-full h-12 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-slate-700 dark:text-slate-300">Notas (opcional)</Label>
                        <Textarea
                            id="notes"
                            name="notes"
                            placeholder="Agregar notas adicionales…"
                            className="resize-none"
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                
                {error && (
                    <p className="text-sm text-rose-500 text-center pt-2" role="alert" aria-live="polite">{error}</p>
                )}
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} className="flex-1 h-12" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                            "flex-1 h-12 font-medium text-white",
                            isIncome
                                ? "bg-emerald-600 hover:bg-emerald-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" /> : null}
                        {saving ? 'Guardando…' : isIncome ? 'Guardar Ingreso' : 'Guardar Gasto'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}