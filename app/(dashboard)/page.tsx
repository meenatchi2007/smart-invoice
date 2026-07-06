// app/(dashboard)/page.tsx
'use client';

import React from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import KPICards from '@/components/dashboard/KPICards';
import OverdueAlert from '@/components/dashboard/OverdueAlert';
import RevenueChart from '@/components/dashboard/RevenueChart';
import ExpensePieChart from '@/components/dashboard/ExpensePieChart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { FileSpreadsheet, Plus, ArrowRight, UserPlus, FileText } from 'lucide-react';

const DASHBOARD_QUERY = gql`
  query GetDashboardData {
    financialSummary {
      totalRevenue
      totalExpenses
      netProfit
      outstandingAmount
      overdueAmount
      invoiceCount
      paidInvoiceCount
      overdueInvoiceCount
      revenueByMonth {
        month
        revenue
        expenses
      }
      expensesByCategory {
        category
        amount
        percentage
      }
      topClients {
        client {
          id
          name
          company
        }
        revenue
      }
    }
    invoices(limit: 5) {
      items {
        id
        invoiceNumber
        title
        status
        total
        dueDate
        client {
          name
        }
        activities {
          id
          type
          description
          createdAt
        }
      }
    }
  }
`;

export default function DashboardPage() {
  const { data, loading, error, refetch } = useQuery<any>(DASHBOARD_QUERY, {
    pollInterval: 10000, // Refresh every 10 seconds for real-time vibe
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Assembling your ledger records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-rose-500/20 rounded-2xl bg-rose-500/10 text-rose-300 text-sm">
        <p className="font-bold">Failed to load financial records</p>
        <p className="text-xs mt-1">{error.message}</p>
        <button onClick={() => refetch()} className="mt-3 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg text-xs font-semibold text-white">
          Retry Query
        </button>
      </div>
    );
  }

  const summary = data?.financialSummary;
  const recentInvoices = data?.invoices?.items || [];
  
  // Aggregate recent activities from recent invoices
  const allActivities = recentInvoices
    .flatMap((inv: any) => inv.activities || [])
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'SENT':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-500/15 text-slate-400 border border-slate-700/20';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Finance Console</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time overview of invoices, liabilities, and AI insights.</p>
        </div>
        
        {/* Quick Action buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/clients"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Client
          </Link>
          <Link
            href="/invoices/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Overdue alert banner */}
      {summary && (
        <OverdueAlert 
          overdueCount={summary.overdueInvoiceCount} 
          overdueAmount={summary.overdueAmount} 
        />
      )}

      {/* KPI metrics row */}
      {summary && <KPICards summary={summary} />}

      {/* Visual Charts panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {summary && <RevenueChart data={summary.revenueByMonth} />}
        </div>
        <div>
          {summary && <ExpensePieChart data={summary.expensesByCategory} />}
        </div>
      </div>

      {/* Recent Lists (Invoices & Activities) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoices List */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white font-sans">Recent Invoices</h3>
                <p className="text-xs text-slate-500 mt-1">Latest billing ledger items</p>
              </div>
              <Link 
                href="/invoices"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View Ledger
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="pb-3">Invoice</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 font-bold text-white font-mono">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-indigo-400">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3.5 text-slate-300 font-medium">{inv.client.name}</td>
                      <td className="py-3.5 text-slate-400 font-mono">{formatDate(inv.dueDate)}</td>
                      <td className="py-3.5 text-right font-bold text-white font-mono">
                        {formatCurrency(inv.total)}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${getStatusBadgeClass(inv.status)}`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                        No invoices created yet. Click "Create Invoice" to start!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit feed */}
        <div>
          <RecentActivity activities={allActivities} />
        </div>
      </div>
    </div>
  );
}
