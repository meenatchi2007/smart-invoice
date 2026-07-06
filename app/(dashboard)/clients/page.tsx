// app/(dashboard)/clients/page.tsx
'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus, Search, Trash2, Mail, Phone, Building2, FileSpreadsheet, X, Pencil } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

const CLIENTS_QUERY = gql`
  query GetClients($search: String, $page: Int, $limit: Int) {
    clients(search: $search, page: $page, limit: $limit) {
      items {
        id
        name
        email
        phone
        company
        address
        taxId
        currency
        notes
        totalInvoiced
        totalPaid
        totalOutstanding
      }
      totalCount
    }
  }
`;

const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      name
    }
  }
`;

const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient($id: ID!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      name
    }
  }
`;

const DELETE_CLIENT_MUTATION = gql`
  mutation DeleteClient($id: ID!) {
    deleteClient(id: $id)
  }
`;

export default function ClientsPage() {
  const { showNotification } = useUIStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    address: '',
    taxId: '',
    notes: '',
  });

  const openEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
      address: client.address || '',
      taxId: client.taxId || '',
      notes: client.notes || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', phone: '', address: '', taxId: '', notes: '' });
  };

  const { data, loading, refetch } = useQuery<any>(CLIENTS_QUERY, {
    variables: { search, page: 1, limit: 50 },
  });

  const [createClient] = useMutation<any>(CREATE_CLIENT_MUTATION, {
    onCompleted: () => {
      showNotification('Client added successfully!', 'success');
      closeModal();
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const [updateClient] = useMutation<any>(UPDATE_CLIENT_MUTATION, {
    onCompleted: () => {
      showNotification('Client updated successfully!', 'success');
      closeModal();
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const [deleteClient] = useMutation<any>(DELETE_CLIENT_MUTATION, {
    onCompleted: () => {
      showNotification('Client deleted successfully', 'info');
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      showNotification('Name and email are required', 'error');
      return;
    }
    if (editingClient) {
      updateClient({ variables: { id: editingClient.id, input: formData } });
    } else {
      createClient({ variables: { input: formData } });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete client "${name}"? This will also affect their linked invoices.`)) {
      deleteClient({ variables: { id } });
    }
  };

  const clients = data?.clients?.items || [];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1">Manage customer contacts, billing profiles, and accounts receivable.</p>
        </div>
        
        <button
          onClick={() => { setEditingClient(null); setFormData({ name: '', email: '', company: '', phone: '', address: '', taxId: '', notes: '' }); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 self-start"
        >
          <Plus className="h-4 w-4" />
          Add New Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Filter by name, company or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map((client: any) => (
          <div key={client.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-indigo-500/30 transition-all duration-300">
            {/* Header info */}
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">{client.name}</h3>
                  {client.company && (
                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-1.5 uppercase tracking-wider">
                      <Building2 className="h-3 w-3 text-indigo-400" />
                      {client.company}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => openEdit(client)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                  title="Edit Client"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Delete Client"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Contact list */}
              <div className="mt-4 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  <a href={`mailto:${client.email}`} className="hover:text-indigo-400 truncate">{client.email}</a>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Financial summaries */}
            <div className="mt-5 pt-4 border-t border-slate-800/80">
              <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                <div>
                  <p className="text-slate-500 uppercase font-semibold">Invoiced</p>
                  <p className="text-xs font-bold text-white font-mono mt-1">
                    {formatCurrency(client.totalInvoiced)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-semibold">Collected</p>
                  <p className="text-xs font-bold text-emerald-400 font-mono mt-1">
                    {formatCurrency(client.totalPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 uppercase font-semibold">Outstanding</p>
                  <p className={`text-xs font-bold font-mono mt-1 ${
                    client.totalOutstanding > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {formatCurrency(client.totalOutstanding)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {clients.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
            No customers found matching filters.
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{editingClient ? 'Edit Client Account' : 'Add New Client Account'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Full Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Tony Stark" />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="tony@stark.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Company</label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="Stark Industries" />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="+1 555-0000" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Tax ID / VAT</label>
                <input type="text" value={formData.taxId} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="US-123456789" />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 h-12 resize-none" placeholder="Street, City, ZIP" />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 h-12 resize-none" placeholder="Payment preferences, billing dates..." />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-3 py-1.5 border border-slate-800 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">{editingClient ? 'Update Account' : 'Save Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
