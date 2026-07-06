// components/dashboard/ExpensePieChart.tsx
'use client';

import React from 'react';
import { formatCurrency } from '@/lib/utils';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpensePieChartProps {
  data: CategoryData[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'Software': '#4f46e5',
  'Office Supplies': '#10b981',
  'Marketing': '#f59e0b',
  'Meals & Entertainment': '#f43f5e',
  'Rent': '#8b5cf6',
  'Travel': '#06b6d4',
  'Professional Services': '#ec4899',
  'Equipment': '#e2e8f0',
  'Insurance': '#eab308',
  'Other': '#64748b'
};

export default function ExpensePieChart({ data }: ExpensePieChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.amount, 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full items-center justify-center text-slate-500 text-sm min-h-[260px]">
        No expenses recorded yet
      </div>
    );
  }

  // Circle coordinates
  const radius = 50;
  const circ = 2 * Math.PI * radius; // 314.159
  let accumulatedPercent = 0;

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
      <div>
        <h3 className="text-sm font-semibold text-white">Expense Distribution</h3>
        <p className="text-xs text-slate-500 mt-1">Breakdown by AI Category</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mt-6 flex-1 justify-center">
        {/* Donut SVG */}
        <div className="relative h-36 w-36 flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="#0f172a"
              strokeWidth="12"
            />
            {data.map((slice, idx) => {
              const color = CATEGORY_COLORS[slice.category] || CATEGORY_COLORS['Other'];
              const strokeDash = (slice.amount / total) * circ;
              const strokeOffset = circ - (accumulatedPercent / 100) * circ;
              
              accumulatedPercent += (slice.amount / total) * 100;

              return (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="transparent"
                  stroke={color}
                  strokeWidth="12"
                  strokeDasharray={`${strokeDash} ${circ}`}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 hover:stroke-[14px]"
                  style={{ transformOrigin: 'center' }}
                />
              );
            })}
          </svg>
          {/* Inner Total Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total</span>
            <span className="text-sm font-bold text-white font-mono leading-none mt-1">
              ${total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
          {data.slice(0, 5).map((slice, idx) => {
            const color = CATEGORY_COLORS[slice.category] || CATEGORY_COLORS['Other'];
            return (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span className="text-slate-300 truncate font-medium">{slice.category}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400 font-semibold">{slice.percentage.toFixed(1)}%</span>
                  <span className="text-white font-bold">{formatCurrency(slice.amount)}</span>
                </div>
              </div>
            );
          })}
          {data.length > 5 && (
            <div className="text-[10px] text-center text-slate-500 pt-1 font-medium">
              + {data.length - 5} other categories
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
