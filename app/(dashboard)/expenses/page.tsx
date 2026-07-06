// app/(dashboard)/expenses/page.tsx
'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { Plus, Trash2, BrainCircuit, Calendar, CheckSquare, Square, Filter, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useUIStore } from '@/store/ui.store';

const EXPENSES_QUERY = gql`
  query GetExpenses($categoryId: ID, $search: String, $page: Int, $limit: Int) {
    expenses(categoryId: $categoryId, search: $search, page: $page, limit: $limit) {
      items {
        id
        title
        amount
        currency
        date
        notes
        aiCategory
        isRecurring
        createdAt
        category {
          id
          name
          color
        }
      }
      totalCount
    }
    categories {
      id
      name
      color
    }
  }
`;

const CREATE_EXPENSE_MUTATION = gql`
  mutation CreateExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      title
      aiCategory
    }
  }
`;

const DELETE_EXPENSE_MUTATION = gql`
  mutation DeleteExpense($id: ID!) {
    deleteExpense(id: $id)
  }
`;

const BULK_CATEGORIZE_MUTATION = gql`
  mutation BulkCategorizeExpenses($ids: [ID!]!) {
    bulkCategorizeExpenses(ids: $ids) {
      id
      aiCategory
    }
  }
`;

const MOCK_AI_CATEGORIZE_QUERY = gql`
  query AICategorize($title: String!, $amount: Float!) {
    aiCategorizeExpense(title: $title, amount: $amount)
  }
`;

export default function ExpensesPage() {
  const { showNotification } = useUIStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    notes: '',
    isRecurring: false,
  });

  const { data, loading, refetch } = useQuery<any>(EXPENSES_QUERY, {
    variables: { categoryId: categoryFilter || null, search, page: 1, limit: 100 },
  });

  const [createExpense, { loading: creating }] = useMutation<any>(CREATE_EXPENSE_MUTATION, {
    onCompleted: (res) => {
      showNotification(
        `Expense logged. AI Class: "${res.createExpense.aiCategory}"`,
        'success'
      );
      setShowAddModal(false);
      setFormData({
        title: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        notes: '',
        isRecurring: false,
      });
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const [deleteExpense] = useMutation<any>(DELETE_EXPENSE_MUTATION, {
    onCompleted: () => {
      showNotification('Expense record removed', 'info');
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const [bulkCategorize, { loading: bulkCategorizing }] = useMutation<any>(BULK_CATEGORIZE_MUTATION, {
    onCompleted: () => {
      showNotification('AI Recategorized selected expenses', 'success');
      setSelectedIds([]);
      refetch();
    },
    onError: (err) => {
      showNotification(err.message, 'error');
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      showNotification('Title and amount are required', 'error');
      return;
    }
    
    createExpense({
      variables: {
        input: {
          title: formData.title,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date),
          categoryId: formData.categoryId || null,
          notes: formData.notes,
          isRecurring: formData.isRecurring,
        }
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      deleteExpense({ variables: { id } });
    }
  };

  const handleSelectToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = (items: any[]) => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(x => x.id));
    }
  };

  const handleBulkAI = () => {
    if (selectedIds.length === 0) return;
    bulkCategorize({ variables: { ids: selectedIds } });
  };

  const expenses = data?.expenses?.items || [];
  const categories = data?.categories || [];

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Expense Tracker</h1>
          <p className="text-xs text-slate-500 mt-1">Record purchases, view operating costs, and run AI invoice classification.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 self-start"
        >
          <Plus className="h-4 w-4" />
          Log Purchase
        </button>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <input
            type="text"
            placeholder="Search items, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Action Button */}
        {selectedIds.length > 0 && (
          <button
            onClick={handleBulkAI}
            disabled={bulkCategorizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold disabled:opacity-50"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            {bulkCategorizing ? 'Reclassifying...' : `Run AI Categorizer (${selectedIds.length})`}
          </button>
        )}
      </div>

      {/* Expenses List */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-850 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="p-4 w-10 text-center">
                  <button 
                    onClick={() => handleSelectAll(expenses)}
                    className="text-slate-400 hover:text-white"
                  >
                    {selectedIds.length === expenses.length && expenses.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="py-4 px-3">Date</th>
                <th className="py-4 px-3">Expense item</th>
                <th className="py-4 px-3">Category</th>
                <th className="py-4 px-3 text-right">Amount</th>
                <th className="py-4 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expenses.map((exp: any) => (
                <tr key={exp.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleSelectToggle(exp.id)}
                      className="text-slate-400 hover:text-white"
                    >
                      {selectedIds.includes(exp.id) ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {formatDate(exp.date)}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-white">{exp.title}</p>
                    {exp.notes && <p className="text-[10px] text-slate-500 mt-0.5">{exp.notes}</p>}
                  </td>
                  <td className="py-3 px-3">
                    <span 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                      style={{
                        backgroundColor: (exp.category?.color || '#334155') + '10',
                        color: exp.category?.color || '#94a3b8',
                        borderColor: (exp.category?.color || '#334155') + '30',
                      }}
                    >
                      {exp.category?.name || exp.aiCategory || 'Other'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-white font-mono">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    No expense reports recorded. Log a purchase above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full mx-4 shadow-2xl animate-fade-in">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Log Purchase Expense</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-4 space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Expense Title / Vendor *</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500" placeholder="e.g. AWS Cloud Hosting, Github seats" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Amount *</label>
                  <input type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-mono" placeholder="524.50" />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Date *</label>
                  <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Category <span className="text-[10px] text-indigo-400 font-bold">(leave empty for AI)</span></label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-300 focus:outline-none focus:border-indigo-500">
                  <option value="">🤖 AI Auto-Classify</option>
                  {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 h-12 resize-none" placeholder="Seat details, billing periods..." />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isRecurring" checked={formData.isRecurring} onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })} className="h-3.5 w-3.5 bg-slate-950 rounded border-slate-800 text-indigo-600" />
                <label htmlFor="isRecurring" className="text-slate-300 select-none">Recurring monthly/annual cost</label>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border border-slate-800 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={creating} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors">{creating ? 'Saving...' : 'Record Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
