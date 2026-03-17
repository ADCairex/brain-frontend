import React, { useState } from 'react';
import { cn } from "@shared/lib/utils";
import { Trash2 } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

const categoryConfig = {
    comida: { color: "bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400", emoji: "🍔" },
    transporte: { color: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400", emoji: "🚗" },
    entretenimiento: { color: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400", emoji: "🎬" },
    salud: { color: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", emoji: "💊" },
    compras: { color: "bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400", emoji: "🛍️" },
    servicios: { color: "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400", emoji: "📱" },
    educacion: { color: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400", emoji: "📚" },
    ingreso: { color: "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400", emoji: "💰" },
    otros: { color: "bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-300", emoji: "📦" },
};

function formatDate(dateStr) {
    try {
        const d = new Date(dateStr);
        if (isToday(d)) return `Hoy, ${format(d, "h:mm a")}`;
        if (isYesterday(d)) return `Ayer, ${format(d, "h:mm a")}`;
        return format(d, "d MMM", { locale: es });
    } catch {
        return dateStr;
    }
}

export default function TransactionItem({ description, amount, category, date, isIncome, onDelete, hideAmount = false }) {
    const config = categoryConfig[category] || categoryConfig.otros;
    const displayDate = formatDate(date);
    const [confirming, setConfirming] = useState(false);

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (confirming) {
            onDelete();
        } else {
            setConfirming(true);
        }
    };

    const handleCancelDelete = (e) => {
        e.stopPropagation();
        setConfirming(false);
    };

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600/50 transition-colors group">
            <div
                className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl", config.color)}
                aria-hidden="true"
            >
                {config.emoji}
            </div>
            
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{description}</p>
                <p className="text-sm text-slate-500 dark:text-slate-300 capitalize">{category} • {displayDate}</p>
            </div>
            
            <p className={cn(
                "font-semibold text-lg",
                isIncome ? "text-emerald-500" : "text-slate-900 dark:text-white"
            )}>
                {hideAmount ? '****** €' : `${isIncome ? '+' : '-'}${amount.toLocaleString('es-ES')} €`}
            </p>

            {onDelete && (
                confirming ? (
                    <div className="flex items-center gap-1 opacity-100">
                        <button
                            onClick={handleDeleteClick}
                            className="px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-colors"
                            aria-label={`Confirmar eliminación de ${description}`}
                        >
                            Eliminar
                        </button>
                        <button
                            onClick={handleCancelDelete}
                            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                            aria-label="Cancelar eliminación"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleDeleteClick}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                        aria-label={`Eliminar ${description}`}
                    >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                )
            )}
        </div>
    );
}