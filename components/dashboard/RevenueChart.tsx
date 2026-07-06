// components/dashboard/RevenueChart.tsx
'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
}

interface RevenueChartProps {
  data: MonthlyData[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 text-slate-500 text-sm">
        No financial history available
      </div>
    );
  }

  // Calculate scaling factors
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses, 1000)));
  const chartHeight = 180;
  const chartWidth = 500;
  const padding = 40;

  // Grid ticks
  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxVal / yTicks) * i);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white">Cash Flow Analytics</h3>
          <p className="text-xs text-slate-500 mt-1">Revenue vs. Expenses (Last 6 Months)</p>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-emerald-500"></span>
            <span className="text-slate-300">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-rose-500"></span>
            <span className="text-slate-300">Expenses</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 w-full relative">
        <svg 
          viewBox={`0 0 ${chartWidth} ${chartHeight + padding}`} 
          className="w-full h-auto overflow-visible"
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTickValues.map((val, i) => {
            const y = chartHeight - (val / maxVal) * chartHeight;
            return (
              <g key={i} className="opacity-40">
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={chartWidth - padding} 
                  y2={y} 
                  stroke="#334155" 
                  strokeDasharray="4"
                  strokeWidth="1"
                />
                <text 
                  x={padding - 8} 
                  y={y + 4} 
                  className="fill-slate-500 text-[9px] text-right font-mono"
                  textAnchor="end"
                >
                  {val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`}
                </text>
              </g>
            );
          })}

          {/* Render Bars */}
          {data.map((d, idx) => {
            const colWidth = (chartWidth - padding * 2) / data.length;
            const xOffset = padding + idx * colWidth + colWidth * 0.15;
            
            // Heights
            const revH = (d.revenue / maxVal) * chartHeight;
            const expH = (d.expenses / maxVal) * chartHeight;

            // X values
            const barW = colWidth * 0.32;
            const revX = xOffset;
            const expX = xOffset + barW + colWidth * 0.05;

            // Y values
            const revY = chartHeight - revH;
            const expY = chartHeight - expH;

            const isHovered = hoveredIdx === idx;

            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Background column highlight on hover */}
                {isHovered && (
                  <rect 
                    x={xOffset - colWidth * 0.05} 
                    y={0} 
                    width={colWidth * 0.8} 
                    height={chartHeight + 10} 
                    fill="rgba(255,255,255,0.03)"
                    rx="8"
                  />
                )}

                {/* Revenue Bar */}
                <rect 
                  x={revX} 
                  y={revY} 
                  width={barW} 
                  height={revH} 
                  fill="url(#revenueGrad)" 
                  stroke="#10b981"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  rx="3" 
                  className="transition-all duration-300"
                />

                {/* Expense Bar */}
                <rect 
                  x={expX} 
                  y={expY} 
                  width={barW} 
                  height={expH} 
                  fill="url(#expenseGrad)" 
                  stroke="#f43f5e"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  rx="3"
                  className="transition-all duration-300"
                />

                {/* X axis month name */}
                <text 
                  x={xOffset + barW + colWidth * 0.025} 
                  y={chartHeight + 20} 
                  className={`text-[10px] font-medium text-center ${
                    isHovered ? 'fill-indigo-400 font-bold' : 'fill-slate-400'
                  }`}
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && (
          <div 
            className="absolute bg-slate-900 border border-slate-700/60 rounded-xl p-3 shadow-xl z-20 pointer-events-none text-xs flex flex-col gap-1 min-w-[140px] animate-fade-in"
            style={{
              left: `${Math.min(
                (hoveredIdx / data.length) * 100 + 10,
                70
              )}%`,
              top: '10%',
            }}
          >
            <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 mb-1">
              {data[hoveredIdx].month}
            </p>
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span>Revenue:</span>
              <span className="font-mono">{formatCurrency(data[hoveredIdx].revenue)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400 font-medium">
              <span>Expenses:</span>
              <span className="font-mono">{formatCurrency(data[hoveredIdx].expenses)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300 font-semibold border-t border-slate-800 pt-1 mt-1">
              <span>Net:</span>
              <span className="font-mono">
                {formatCurrency(data[hoveredIdx].revenue - data[hoveredIdx].expenses)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
