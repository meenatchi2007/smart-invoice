// app/(dashboard)/invoices/page.tsx
'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { Plus, Search, Calendar, User, ArrowUpDown, ChevronRight, FileText } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

const INVOICES_PAGE_QUERY = gql`
  query GetInvoices($status: String, $search: String, $page: Int, $limit: Int) {
    invoices(status: $status, search: $search, page: $page, limit: $limit) {
      items {
        id
        invoiceNumber
        title
        status
        issueDate
        dueDate
        currency
        total
        paidAmount
        client {
          name
          company
        }
      }
      totalCount
    }
    financialSummary {
      invoiceCount
      paidInvoiceCount
      overdueInvoiceCount
    }
  }
`;

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, refetch } = useQuery<any>(INVOICES_PAGE_QUERY, {
    variables: { status: statusFilter || null, search, page: 1, limit: 100 },
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'SENT':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'DRAFT':
        return 'bg-slate-500/10 text-slate-400 border border-slate-700/20';
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  const invoices = data?.invoices?.items || [];
  const metrics = data?.financialSummary;

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Billing Ledger</h1>
          <p className="text-xs text-slate-500 mt-1">Generate invoices, track transaction states, and record client collections.</p>
        </div>

        <Link
          href="/invoices/new"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 self-start"
        >
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </div>

      {/* KPI stats summaries */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex justify-between items-center bg-slate-900/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Invoices Generated</p>
              <h4 className="text-lg font-bold text-white font-mono mt-1">{metrics.invoiceCount}</h4>
            </div>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex justify-between items-center bg-slate-900/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Settled Account Records</p>
              <h4 className="text-lg font-bold text-emerald-400 font-mono mt-1">{metrics.paidInvoiceCount}</h4>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex justify-between items-center bg-slate-900/10">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">Delinquent Overdue Listings</p>
              <h4 className="text-lg font-bold text-rose-400 font-mono mt-1">{metrics.overdueInvoiceCount}</h4>
            </div>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by invoice number, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Void/Cancelled</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-4 px-4">Invoice #</th>
                <th className="py-4 px-3">Client</th>
                <th className="py-4 px-3">Due Date</th>
                <th className="py-4 px-3 text-right">Invoice Total</th>
                <th className="py-4 px-3 text-right">Balance Due</th>
                <th className="py-4 px-3 text-center">Status</th>
                <th className="py-4 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {invoices.map((inv: any) => {
                const balance = Math.max(0, inv.total - inv.paidAmount);
                return (
                  <tr key={inv.id} className="hover:bg-slate-900/30 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-white font-mono">
                      <Link href={`/invoices/${inv.id}`} className="hover:text-indigo-400">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-slate-200">{inv.client.name}</p>
                      {inv.client.company && <p className="text-[10px] text-slate-500">{inv.client.company}</p>}
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono flex items-center gap-1.5 mt-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-white font-mono">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className={`py-3.5 px-3 text-right font-bold font-mono ${balance > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {formatCurrency(balance)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase ${getStatusStyle(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Inspect Details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No billing statements matched. Click "Create Invoice" to start!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
