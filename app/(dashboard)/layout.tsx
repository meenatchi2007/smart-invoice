// app/(dashboard)/layout.tsx
'use client';

import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/graphql/client';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { notification, clearNotification } = useUIStore();
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, []);

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ApolloProvider client={apolloClient}>
      <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Sidebar */}
        <Sidebar />

        {/* Core Frame */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <Header />

          {/* Toast Notification Banner */}
          {notification && (
            <div className="absolute top-4 right-4 z-50 animate-fade-in max-w-sm w-full">
              <div className={`p-4 rounded-xl border flex gap-3 shadow-lg backdrop-blur-md ${
                notification.type === 'success' 
                  ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' 
                  : notification.type === 'error'
                  ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300'
              }`}>
                {notification.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
                {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />}
                {notification.type === 'info' && <Info className="h-5 w-5 text-indigo-400 flex-shrink-0" />}
                
                <div className="flex-1">
                  <p className="text-xs font-medium">{notification.message}</p>
                </div>

                <button 
                  onClick={clearNotification}
                  className="text-slate-400 hover:text-white transition-colors self-start"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Dashboard Children Container */}
          <main className="flex-1 overflow-y-auto bg-slate-950/50 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ApolloProvider>
  );
}
