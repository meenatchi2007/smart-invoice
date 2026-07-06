// components/layout/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store/ui.store';
import { 
  LayoutDashboard, 
  FileSpreadsheet, 
  Users, 
  Receipt, 
  BarChart3, 
  BrainCircuit, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Invoices', href: '/invoices', icon: FileSpreadsheet },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'AI Insights', href: '/ai-insights', icon: BrainCircuit },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside 
      className={`hidden md:flex flex-col border-r border-slate-800 bg-slate-900/50 backdrop-blur-md transition-all duration-300 relative z-20 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-white">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/35">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          {sidebarOpen && (
            <span className="bg-gradient-to-r from-indigo-200 via-indigo-100 to-white bg-clip-text text-transparent font-extrabold text-sm">
              SmartFinance
            </span>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-400 border-l-2 border-indigo-500 font-semibold shadow-[inset_0_0_8px_rgba(79,70,229,0.05)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              {sidebarOpen && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Toggle */}
      <div className="p-4 border-t border-slate-800 flex justify-center">
        <button
          onClick={toggleSidebar}
          className="h-8 w-8 rounded-full border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
