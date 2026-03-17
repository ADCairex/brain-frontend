import React from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, amount, icon: Icon, trend, trendUp }) {
    return (
        <div className="bg-white dark:bg-slate-600/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-600 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-500 dark:text-slate-300 font-medium">{title}</span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-600 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" aria-hidden="true" />
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{amount}</p>
            <div className="flex items-center gap-1">
                {trendUp ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                ) : (
                    <TrendingDown className="w-4 h-4 text-rose-500" aria-hidden="true" />
                )}
                <span className={`text-sm font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trend}
                </span>
                <span className="text-sm text-slate-400 dark:text-slate-400">vs mes anterior</span>
            </div>
        </div>
    );
}