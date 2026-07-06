// components/layout/Header.tsx
'use client';

import React from 'react';
import { gql } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';
import { Bell, Search, Menu, LogOut, User as UserIcon, Building2 } from 'lucide-react';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { apolloClient } from '@/graphql/client';
import { useRouter } from 'next/navigation';

export const ME_QUERY = gql`
  query GetMe {
    me {
      id
      email
      name
      avatar
      role
      organization {
        name
        currency
      }
    }
  }
`;

export default function Header() {
  const { data, loading } = useQuery<any>(ME_QUERY);
  const { toggleSidebar } = useUIStore();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  const user = data?.me;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Search Bar / Left content */}
      <div className="flex items-center gap-4 w-1/3">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative hidden sm:block w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices, clients..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Right Content */}
      <div className="flex items-center gap-4">
        {/* Organization Name */}
        {user?.organization && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-800/40 border border-slate-800 rounded-full text-xs text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-semibold">{user.organization.name}</span>
          </div>
        )}

        {/* Notifications */}
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500"></span>
        </button>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors text-left"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || 'User'}
                className="h-8 w-8 rounded-full object-cover border border-slate-700"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-none">
                {loading ? 'Loading...' : user?.name || 'Demo User'}
              </p>
              <p className="text-[10px] text-slate-400 leading-none mt-1">
                {loading ? 'Please wait' : user?.role || 'OWNER'}
              </p>
            </div>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 z-30 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user?.name || 'Alex Mercer'}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email || 'demo@smartfinance.dev'}</p>
              </div>
              
              <Link 
                href="/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                Profile Settings
              </Link>
              
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  clearAuth();
                  apolloClient.clearStore().then(() => {
                    router.replace('/login');
                  });
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
