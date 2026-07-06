// app/(dashboard)/invoices/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { useUIStore } from '@/store/ui.store';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, FileText, ArrowLeft, Building, Calculator } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

const BUILDER_RESOURCES_QUERY = gql`
  query GetBuilderResources {
    clients {
      items {
        id
        name
        company
        address
        email
      }
    }
    nextInvoiceNumber
    me {
      organization {
        name
        address
        taxId
        currency
      }
    }
  }
`;

const CREATE_INVOICE_MUTATION = gql`
  mutation CreateInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
      invoiceNumber
    }
  }
`;

interface LineItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { showNotification } = useUIStore();

  const { data, loading } = useQuery<any>(BUILDER_RESOURCES_QUERY);

  // Form states
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30); // Default 30 days due
    return d.toISOString().split('T')[0];
  });
  const [taxRate, setTaxRate] = useState(0);
  const [discountRate, setDiscountRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Payment is due within 30 days from issue date.');
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: 'Consulting Services', quantity: 1, unitPrice: 1000 },
  ]);

  const [createInvoice, { loading: saving }] = useMutation<any>(CREATE_INVOICE_MUTATION, {
    onCompleted: (res) => {
      showNotification(`Invoice ${res.createInvoice.invoiceNumber} created!`, 'success');
      router.push(`/invoices/${res.createInvoice.id}`);
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const handleAddLine = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof LineItemForm, val: any) => {
    const updated = [...lineItems];
    if (field === 'description') {
      updated[idx].description = val;
    } else {
      updated[idx][field] = parseFloat(val) || 0;
    }
    setLineItems(updated);
  };

  // Live Math calculations
  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountAmount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      showNotification('Please select a client', 'error');
      return;
    }
    if (lineItems.some(item => !item.description.trim() || item.quantity <= 0 || item.unitPrice <= 0)) {
      showNotification('Please fill in description and values for all line items', 'error');
      return;
    }

    createInvoice({
      variables: {
        input: {
          clientId,
          title: title || 'Service Invoice',
          dueDate: new Date(dueDate),
          currency: data?.me?.organization?.currency || 'USD',
          taxRate,
          discountRate,
          notes,
          terms,
          lineItems: lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: 0,
          })),
        },
      },
    });
  };

  const clients = data?.clients?.items || [];
  const org = data?.me?.organization;
  const nextNum = data?.nextInvoiceNumber || 'INV-2026-XXXX';

  const selectedClient = clients.find((c: any) => c.id === clientId);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Initializing Ledger Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          href="/invoices" 
          className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Statement Builder</h1>
          <p className="text-xs text-slate-500 mt-1">Compile billing line items and preview generated invoice formats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Builder Panel */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Metadata Block */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Invoice Details</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Select Client *</label>
                <select
                  value={clientId}
                  required
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">-- Choose Account --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Statement Title / Description</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Q2 consulting support, Design milestones..."
              />
            </div>
          </div>

          {/* Line Items Block */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="h-4.5 w-4.5 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Line Items Ledger</h3>
              </div>
              <button
                type="button"
                onClick={handleAddLine}
                className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-6">
                    {idx === 0 && <label className="block text-slate-400 font-medium mb-1">Description *</label>}
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. Senior development support"
                    />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <label className="block text-slate-400 font-medium mb-1">Qty *</label>}
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                    />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <label className="block text-slate-400 font-medium mb-1">Price *</label>}
                    <input
                      type="number"
                      required
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-indigo-500 font-mono text-right"
                    />
                  </div>
                  <div className="col-span-1 text-center pb-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      disabled={lineItems.length === 1}
                      className="text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Notes Block */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">VAT / Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Discount Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Invoice Notes / Terms</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 h-16 resize-none"
                placeholder="Wiring instructions, support channels, thank-you messages..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <Link
                href="/invoices"
                className="px-4 py-2.5 border border-slate-800 bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                Discard
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Creating Draft...' : 'Publish Invoice'}
              </button>
            </div>
          </div>
        </form>

        {/* Side-by-Side live printable CSS Preview panel */}
        <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl min-h-[560px] border border-slate-200 flex flex-col justify-between select-none">
          <div>
            {/* Logo & Org Address */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {org?.name || 'Alpha Software Inc.'}
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed whitespace-pre-line">
                  {org?.address || '100 Innovation Way, Suite 400\nBoston MA 02110'}
                </p>
                {org?.taxId && <p className="text-[9px] text-slate-400 mt-1">VAT: {org.taxId}</p>}
              </div>

              <div className="text-right">
                <span className="text-[10px] bg-slate-100 font-extrabold text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">
                  DRAFT
                </span>
                <h3 className="text-lg font-black text-slate-900 font-mono mt-2">{nextNum}</h3>
                <p className="text-[9px] text-slate-400 mt-1">Date: {formatDate(new Date())}</p>
                <p className="text-[9px] text-slate-400 font-semibold">Due: {formatDate(new Date(dueDate))}</p>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="py-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bill To</p>
                {selectedClient ? (
                  <div className="mt-1.5 text-[10px]">
                    <p className="font-extrabold text-slate-900">{selectedClient.name}</p>
                    {selectedClient.company && <p className="text-slate-500 mt-0.5">{selectedClient.company}</p>}
                    {selectedClient.address && <p className="text-slate-400 mt-1 whitespace-pre-line leading-relaxed">{selectedClient.address}</p>}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic mt-1.5">No client selected</p>
                )}
              </div>
            </div>

            {/* Table Items */}
            <table className="w-full text-left text-[10px] border-b border-slate-100">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px] pb-2">
                  <th className="pb-2">Item Description</th>
                  <th className="pb-2 text-center w-12">Qty</th>
                  <th className="pb-2 text-right w-16">Unit Price</th>
                  <th className="pb-2 text-right w-16">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 text-slate-800 font-medium max-w-[160px] truncate">
                      {item.description || <span className="text-slate-400 italic">Empty description</span>}
                    </td>
                    <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice, org?.currency)}</td>
                    <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(item.quantity * item.unitPrice, org?.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-start gap-6">
              {/* Terms */}
              <div className="flex-1 text-[9px] text-slate-400 leading-relaxed max-w-[200px]">
                {notes && (
                  <div className="mb-2">
                    <p className="font-bold text-slate-500">Notes:</p>
                    <p className="text-slate-400 mt-0.5">{notes}</p>
                  </div>
                )}
                {terms && (
                  <div>
                    <p className="font-bold text-slate-500">Terms & Conditions:</p>
                    <p className="text-slate-400 mt-0.5">{terms}</p>
                  </div>
                )}
              </div>

              {/* Math totals */}
              <div className="w-48 text-[10px] space-y-1.5 text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(subtotal, org?.currency)}</span>
                </div>
                {discountRate > 0 && (
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>Discount ({discountRate}%):</span>
                    <span className="font-mono">- {formatCurrency(discountAmount, org?.currency)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between">
                    <span>VAT / Tax ({taxRate}%):</span>
                    <span className="font-mono text-slate-800">+ {formatCurrency(taxAmount, org?.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(total, org?.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
