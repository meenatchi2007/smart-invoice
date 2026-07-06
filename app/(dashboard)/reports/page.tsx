// app/(dashboard)/reports/page.tsx
'use client';

import React from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { formatCurrency } from '@/lib/utils';
import { Printer, CalendarRange, TrendingUp, Sparkles, BrainCircuit } from 'lucide-react';

const REPORTS_QUERY = gql`
  query GetReports {
    financialSummary {
      totalRevenue
      totalExpenses
      netProfit
      expensesByCategory {
        category
        amount
        percentage
      }
      revenueByMonth {
        month
        revenue
        expenses
      }
    }
    cashFlowForecast(months: 6) {
      month
      revenue
      expenses
    }
  }
`;

export default function ReportsPage() {
  const { data, loading, error } = useQuery<any>(REPORTS_QUERY);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Compiling financial indexes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-5 border border-rose-500/20 rounded-2xl bg-rose-500/10 text-rose-300 text-xs">
        <p className="font-bold">Error loading reports: {error.message}</p>
      </div>
    );
  }

  const summary = data?.financialSummary;
  const forecast = data?.cashFlowForecast || [];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Reports</h1>
          <p className="text-xs text-slate-500 mt-1">Export profit & loss statements and view cash flow forecasts.</p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Statement
        </button>
      </div>

      {/* Print-only brand banner */}
      <div className="hidden print:block text-slate-900 pb-6 mb-6 border-b">
        <h1 className="text-2xl font-bold">Smart Invoice & Finance Manager</h1>
        <p className="text-xs text-slate-500">Corporate Profit & Loss Statement - Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* P&L Statement Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit & Loss */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
            <CalendarRange className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Profit & Loss Summary</h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue Block */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-2">
                <span>1. Operating Revenue</span>
                <span className="font-mono text-emerald-400">{formatCurrency(summary.totalRevenue)}</span>
              </div>
              <div className="pl-4 flex justify-between text-slate-400 py-1 border-l border-slate-800">
                <span>Invoiced Revenue (Collected)</span>
                <span className="font-mono">{formatCurrency(summary.totalRevenue)}</span>
              </div>
            </div>

            {/* Expenses Block */}
            <div>
              <div className="flex justify-between font-bold text-slate-300 mb-2">
                <span>2. Operating Cost of Goods (Expenses)</span>
                <span className="font-mono text-rose-400">({formatCurrency(summary.totalExpenses)})</span>
              </div>
              <div className="pl-4 space-y-1.5 border-l border-slate-800">
                {summary.expensesByCategory.map((cat: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-400 py-0.5">
                    <span>{cat.category}</span>
                    <span className="font-mono">{formatCurrency(cat.amount)}</span>
                  </div>
                ))}
                {summary.expensesByCategory.length === 0 && (
                  <p className="text-slate-500 italic py-1">No cost listings recorded.</p>
                )}
              </div>
            </div>

            {/* Net Profits Block */}
            <div className="border-t border-slate-800 pt-4 mt-2">
              <div className="flex justify-between text-sm font-bold text-white">
                <span>Net Earnings (Profit Margin)</span>
                <span className={`font-mono ${summary.netProfit >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                  {formatCurrency(summary.netProfit)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 italic">
                * Based on actual bank clearances, invoices marked as PAID, and logged expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Forecasting */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">6-Month Cash Flow Forecast</h3>
            </div>
            <span className="text-[10px] bg-indigo-600/15 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              AI Projected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Month</th>
                  <th className="pb-3 text-right">Proj. Revenue</th>
                  <th className="pb-3 text-right">Proj. Expenses</th>
                  <th className="pb-3 text-right">Proj. Net Cash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {forecast.map((row: any, idx: number) => {
                  const net = row.revenue - row.expenses;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 font-semibold text-slate-300 font-sans">{row.month}</td>
                      <td className="py-3 text-right text-emerald-400">{formatCurrency(row.revenue)}</td>
                      <td className="py-3 text-right text-rose-400">{formatCurrency(row.expenses)}</td>
                      <td className={`py-3 text-right font-bold ${net >= 0 ? 'text-indigo-400' : 'text-rose-500'}`}>
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
