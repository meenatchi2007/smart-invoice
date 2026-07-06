// components/dashboard/RecentActivity.tsx
import React from 'react';
import { formatDate } from '@/lib/utils';
import { Plus, Send, CheckCircle2, AlertCircle, Copy } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface RecentActivityProps {
  activities: ActivityItem[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500 text-xs border border-slate-800/40 rounded-2xl bg-slate-900/10 min-h-[220px]">
        No recent activities recorded.
      </div>
    );
  }

  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'CREATE':
        return {
          icon: Plus,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/15',
        };
      case 'SEND':
        return {
          icon: Send,
          color: 'text-sky-400',
          bg: 'bg-sky-500/15',
        };
      case 'PAYMENT':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-slate-400',
          bg: 'bg-slate-800',
        };
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col h-full">
      <div>
        <h3 className="text-sm font-semibold text-white">Audit Trail</h3>
        <p className="text-xs text-slate-500 mt-1">Real-time ledger events</p>
      </div>

      <div className="mt-5 space-y-4 overflow-y-auto max-h-[260px] pr-1">
        {activities.map((activity) => {
          const style = getActivityStyle(activity.type);
          const Icon = style.icon;

          return (
            <div key={activity.id} className="flex gap-4 items-start relative group">
              {/* Icon Container */}
              <div className={`p-2 rounded-xl ${style.bg} ${style.color} relative z-10 flex-shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              
              {/* Text details */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200 font-medium">
                  {activity.description}
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  {formatDate(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
