// components/dashboard/KPICards.tsx
import React from 'react';
import { formatCurrency } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface KPICardsProps {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    outstandingAmount: number;
    overdueAmount: number;
  };
}

export default function KPICards({ summary }: KPICardsProps) {
  const cards = [
    {
      title: 'Collected Revenue',
      value: formatCurrency(summary.totalRevenue),
      subtitle: 'PAID & PARTIAL Invoices',
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      trend: {
        label: 'vs last month',
        value: '+12.4%',
        isPositive: true,
      }
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses),
      subtitle: 'Operating costs recorded',
      icon: TrendingDown,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
      trend: {
        label: 'vs last month',
        value: '+4.2%',
        isPositive: false, // expenses going up
      }
    },
    {
      title: 'Net Profit Margin',
      value: formatCurrency(summary.netProfit),
      subtitle: 'Revenue minus expenses',
      icon: TrendingUp,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
      trend: {
        label: 'vs last month',
        value: '+8.1%',
        isPositive: true,
      }
    },
    {
      title: 'Outstanding Receivables',
      value: formatCurrency(summary.outstandingAmount),
      subtitle: `Including $${summary.overdueAmount.toFixed(0)} overdue`,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      trend: {
        label: 'Overdue invoices',
        value: 'Urgent follow-up',
        isPositive: null,
      }
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={idx} 
            className={`glass-panel glow-card p-5 rounded-2xl border ${card.borderColor} flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl ${card.bgColor} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-bold tracking-tight text-white font-mono">
                {card.value}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {card.subtitle}
              </p>
            </div>

            {card.trend.value && (
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-500">{card.trend.label}</span>
                {card.trend.isPositive !== null ? (
                  <span className={`flex items-center gap-1 font-semibold ${
                    card.trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {card.trend.isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {card.trend.value}
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                    <Activity className="h-3.5 w-3.5" />
                    {card.trend.value}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
