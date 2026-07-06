// components/dashboard/OverdueAlert.tsx
import React from 'react';
import { AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface OverdueAlertProps {
  overdueCount: number;
  overdueAmount: number;
}

export default function OverdueAlert({ overdueCount, overdueAmount }: OverdueAlertProps) {
  if (overdueCount === 0 || overdueAmount === 0) return null;

  return (
    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-rose-950/20 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5 sm:mt-0">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">Payments Overdue</h4>
          <p className="text-xs text-slate-300 mt-1">
            You have <span className="text-white font-bold">{overdueCount}</span> overdue invoices, totaling{' '}
            <span className="text-rose-400 font-bold font-mono">{formatCurrency(overdueAmount)}</span> outstanding.
          </p>
        </div>
      </div>

      <Link
        href="/invoices?status=OVERDUE"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-all text-xs font-semibold self-stretch sm:self-auto justify-center"
      >
        Resolve Accounts Receivable
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
