// app/(dashboard)/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { useUIStore } from '@/store/ui.store';
import { Building2, User2, Save, Sparkles, Key } from 'lucide-react';

const SETTINGS_QUERY = gql`
  query GetSettings {
    me {
      id
      name
      email
      avatar
      role
      organization {
        id
        name
        logo
        address
        taxId
        currency
      }
    }
  }
`;

const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_ORG_MUTATION = gql`
  mutation UpdateOrg($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      name
      currency
    }
  }
`;

export default function SettingsPage() {
  const { showNotification } = useUIStore();
  const { data, loading, refetch } = useQuery<any>(SETTINGS_QUERY);

  // Form states
  const [profileForm, setProfileForm] = useState({ name: '' });
  const [orgForm, setOrgForm] = useState({
    name: '',
    taxId: '',
    address: '',
    currency: 'USD',
  });

  useEffect(() => {
    if (data?.me) {
      setProfileForm({ name: data.me.name || '' });
      if (data.me.organization) {
        setOrgForm({
          name: data.me.organization.name || '',
          taxId: data.me.organization.taxId || '',
          address: data.me.organization.address || '',
          currency: data.me.organization.currency || 'USD',
        });
      }
    }
  }, [data]);

  const [updateProfile, { loading: updatingProfile }] = useMutation<any>(UPDATE_PROFILE_MUTATION, {
    onCompleted: () => {
      showNotification('Profile updated successfully!', 'success');
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [updateOrg, { loading: updatingOrg }] = useMutation<any>(UPDATE_ORG_MUTATION, {
    onCompleted: () => {
      showNotification('Organization settings saved!', 'success');
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ variables: { input: profileForm } });
  };

  const handleOrgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrg({ variables: { input: orgForm } });
  };

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-medium">Loading settings profiles...</p>
      </div>
    );
  }

  const user = data?.me;

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Console Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure profile records, billing details, and default organization currencies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
            <User2 className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white font-sans">User Profile Settings</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-slate-500 cursor-not-allowed font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Contact your system administrator to change email configurations.</p>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Display Name</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Tony Stark"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Authorized Console Role</label>
              <input
                type="text"
                disabled
                value={user?.role || 'OWNER'}
                className="w-full bg-slate-950 border border-slate-800/80 rounded-lg p-2.5 text-slate-500 cursor-not-allowed uppercase font-mono font-bold"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingProfile}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Organization Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/10">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
            <Building2 className="h-5 w-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white font-sans">Business Organization Settings</h3>
          </div>

          <form onSubmit={handleOrgSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Company / Organization Name</label>
              <input
                type="text"
                required
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Stark Enterprises"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Default Ledger Currency</label>
                <select
                  value={orgForm.currency}
                  onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tax Registration / VAT ID</label>
                <input
                  type="text"
                  value={orgForm.taxId}
                  onChange={(e) => setOrgForm({ ...orgForm, taxId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. US-987654321"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Billing / Address Header</label>
              <textarea
                value={orgForm.address}
                onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 h-[84px] resize-none"
                placeholder="Business location printed on top of all client invoices"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={updatingOrg}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updatingOrg ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
