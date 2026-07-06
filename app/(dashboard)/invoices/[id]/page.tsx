// app/(dashboard)/invoices/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { gql } from '@apollo/client/core';
import { useQuery, useMutation } from '@apollo/client/react';
import { useUIStore } from '@/store/ui.store';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  Trash2, 
  Copy, 
  AlertCircle, 
  CreditCard, 
  DollarSign, 
  Printer, 
  Download,
  Calendar,
  Building,
  History,
  X,
  ExternalLink,
  Bell
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

const INVOICE_DETAIL_QUERY = gql`
  query GetInvoiceDetail($id: ID!) {
    invoice(id: $id) {
      id
      invoiceNumber
      title
      status
      issueDate
      dueDate
      currency
      subtotal
      taxRate
      taxAmount
      discountRate
      discountAmount
      total
      paidAmount
      notes
      terms
      pdfUrl
      isOverdue
      daysPastDue
      client {
        id
        name
        email
        company
        address
      }
      lineItems {
        id
        description
        quantity
        unitPrice
        amount
      }
      payments {
        id
        amount
        method
        reference
        notes
        paidAt
      }
      activities {
        id
        type
        description
        createdAt
      }
    }
  }
`;

const SEND_INVOICE_MUTATION = gql`
  mutation SendInvoice($id: ID!) {
    sendInvoice(id: $id) {
      id
      status
    }
  }
`;

const VOID_INVOICE_MUTATION = gql`
  mutation VoidInvoice($id: ID!) {
    voidInvoice(id: $id) {
      id
      status
    }
  }
`;

const DUPLICATE_INVOICE_MUTATION = gql`
  mutation DuplicateInvoice($id: ID!) {
    duplicateInvoice(id: $id) {
      id
    }
  }
`;

const DELETE_INVOICE_MUTATION = gql`
  mutation DeleteInvoice($id: ID!) {
    deleteInvoice(id: $id)
  }
`;

const RECORD_PAYMENT_MUTATION = gql`
  mutation RecordPayment($invoiceId: ID!, $input: PaymentInput!) {
    recordPayment(invoiceId: $invoiceId, input: $input) {
      id
    }
  }
`;

const STRIPE_LINK_MUTATION = gql`
  mutation CreateStripeLink($invoiceId: ID!) {
    createStripePaymentLink(invoiceId: $invoiceId)
  }
`;

const SEND_REMINDER_MUTATION = gql`
  mutation SendReminder($invoiceId: ID!) {
    sendPaymentReminder(invoiceId: $invoiceId)
  }
`;

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { showNotification } = useUIStore();

  const [showPayModal, setShowPayModal] = useState(false);
  const [stripeLink, setStripeLink] = useState('');
  
  // Payment Form
  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'BANK_TRANSFER',
    reference: '',
    notes: '',
  });

  const { data, loading, refetch } = useQuery<any>(INVOICE_DETAIL_QUERY, {
    variables: { id },
  });

  const [sendInvoice, { loading: sending }] = useMutation<any>(SEND_INVOICE_MUTATION, {
    onCompleted: () => {
      showNotification('Invoice sent successfully!', 'success');
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [voidInvoice] = useMutation<any>(VOID_INVOICE_MUTATION, {
    onCompleted: () => {
      showNotification('Invoice status set to Void', 'info');
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [duplicateInvoice] = useMutation<any>(DUPLICATE_INVOICE_MUTATION, {
    onCompleted: (res) => {
      showNotification('Invoice duplicated as Draft', 'success');
      router.push(`/invoices/${res.duplicateInvoice.id}`);
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [deleteInvoice] = useMutation<any>(DELETE_INVOICE_MUTATION, {
    onCompleted: () => {
      showNotification('Invoice deleted successfully', 'info');
      router.push('/invoices');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [recordPayment, { loading: recording }] = useMutation<any>(RECORD_PAYMENT_MUTATION, {
    onCompleted: () => {
      showNotification('Payment recorded successfully', 'success');
      setShowPayModal(false);
      setPayForm({ amount: '', method: 'BANK_TRANSFER', reference: '', notes: '' });
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [createStripeLink, { loading: creatingStripe }] = useMutation<any>(STRIPE_LINK_MUTATION, {
    onCompleted: (res) => {
      setStripeLink(res.createStripePaymentLink);
      showNotification('Stripe checkout link generated!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const [sendReminder, { loading: sendingReminder }] = useMutation<any>(SEND_REMINDER_MUTATION, {
    onCompleted: () => {
      showNotification('Payment reminder sent to client!', 'success');
      refetch();
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    recordPayment({
      variables: {
        invoiceId: id,
        input: {
          amount,
          method: payForm.method,
          reference: payForm.reference,
          notes: payForm.notes,
          paidAt: new Date(),
        },
      },
    });
  };

  const invoice = data?.invoice;
  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs">Fetching invoice details...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-5 border border-rose-500/20 rounded-2xl bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
        <span>Invoice statement record not found.</span>
        <Link href="/invoices" className="underline font-bold">Back to ledger</Link>
      </div>
    );
  }

  const balance = Math.max(0, invoice.total - invoice.paidAmount);

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Top Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Link 
            href="/invoices" 
            className="p-2 rounded-lg border border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-slate-500 mt-0.5">{invoice.title || 'Client Invoice'}</p>
          </div>
        </div>

        {/* Action button rows */}
        <div className="flex flex-wrap gap-2">
          {/* Record manual payment */}
          {balance > 0 && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setPayForm({ ...payForm, amount: balance.toFixed(2) });
                setShowPayModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-colors"
            >
              <DollarSign className="h-4 w-4" />
              Collect Payment
            </button>
          )}

          {/* Create payment links */}
          {balance > 0 && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => createStripeLink({ variables: { invoiceId: id } })}
              disabled={creatingStripe}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
            >
              <CreditCard className="h-4 w-4 text-indigo-400" />
              {creatingStripe ? 'Generating...' : stripeLink ? 'Regenerate Stripe Link' : 'Stripe Link'}
            </button>
          )}

          {/* Email to client */}
          {invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => sendInvoice({ variables: { id } })}
              disabled={sending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Invoice'}
            </button>
          )}

          {/* Payment Reminder */}
          {balance > 0 && invoice.status !== 'CANCELLED' && invoice.status !== 'DRAFT' && (
            <button
              onClick={() => sendReminder({ variables: { invoiceId: id } })}
              disabled={sendingReminder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-800/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Bell className="h-4 w-4" />
              {sendingReminder ? 'Sending...' : 'Send Reminder'}
            </button>
          )}

          {/* PDF Download */}
          <a
            href={`/api/invoices/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF Download
          </a>

          {/* Copy statement */}
          <button
            onClick={() => duplicateInvoice({ variables: { id } })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
            title="Duplicate Draft"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>

          {/* Void / Cancel statement */}
          {invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
                  voidInvoice({ variables: { id } });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-950/30 transition-colors"
            >
              Void
            </button>
          )}

          {/* Delete statement */}
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this invoice? This will wipe all payment history.')) {
                deleteInvoice({ variables: { id } });
              }
            }}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-rose-950 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Delete statement"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stripe payment alert link */}
      {stripeLink && balance > 0 && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between no-print animate-fade-in">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-indigo-400" />
            <div>
              <p className="font-bold text-indigo-300">Stripe Payment Link Ready</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click "Launch checkout" to test the simulated Stripe payment checkout flow.</p>
            </div>
          </div>
          <a
            href={stripeLink}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
          >
            Launch Checkout
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Printable Invoice PDF Layout */}
        <div className="lg:col-span-2 bg-white text-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col justify-between min-h-[580px]">
          <div>
            {/* Logo and header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Alpha Software Inc.</h2>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[180px] leading-relaxed">
                  100 Innovation Way, Suite 400<br />Boston MA 02110
                </p>
              </div>

              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wide uppercase ${
                  invoice.status === 'PAID' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : invoice.status === 'OVERDUE'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {invoice.status}
                </span>
                <h3 className="text-lg font-black text-slate-900 font-mono mt-2">{invoice.invoiceNumber}</h3>
                <p className="text-[9px] text-slate-400 mt-1">Issue Date: {formatDate(invoice.issueDate)}</p>
                <p className="text-[9px] text-slate-400 font-semibold">Due Date: {formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            {/* Bill To */}
            <div className="py-6 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Bill To</p>
                <div className="mt-1.5 text-[10px]">
                  <p className="font-extrabold text-slate-900">{invoice.client.name}</p>
                  {invoice.client.company && <p className="text-slate-500 mt-0.5">{invoice.client.company}</p>}
                  {invoice.client.address && <p className="text-slate-400 mt-1 whitespace-pre-line leading-relaxed">{invoice.client.address}</p>}
                  <p className="text-slate-400 mt-1">{invoice.client.email}</p>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
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
                {invoice.lineItems.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-2.5 text-slate-800 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                    <td className="py-2.5 text-right font-mono">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer calculation blocks */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 text-[9px] text-slate-400 leading-relaxed max-w-[200px]">
                {invoice.notes && (
                  <div className="mb-2">
                    <p className="font-bold text-slate-500">Notes:</p>
                    <p className="text-slate-400 mt-0.5">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <p className="font-bold text-slate-500">Terms & Conditions:</p>
                    <p className="text-slate-400 mt-0.5">{invoice.terms}</p>
                  </div>
                )}
              </div>

              {/* Math summaries */}
              <div className="w-48 text-[10px] space-y-1.5 text-slate-500 font-medium">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-800">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                {invoice.discountRate > 0 && (
                  <div className="flex justify-between text-rose-500 font-semibold">
                    <span>Discount ({invoice.discountRate}%):</span>
                    <span className="font-mono">- {formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                  </div>
                )}
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span>VAT / Tax ({invoice.taxRate}%):</span>
                    <span className="font-mono text-slate-800">+ {formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(invoice.total, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                  <span>Amount Paid:</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900 border-t border-dashed border-slate-200 pt-1.5">
                  <span>Remaining Balance:</span>
                  <span className="font-mono text-indigo-600">{formatCurrency(balance, invoice.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (Payment History & Activity Logs) */}
        <div className="space-y-6 no-print">
          {/* Payment History */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <DollarSign className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Payment ledger history</h3>
            </div>

            <div className="space-y-3">
              {invoice.payments.map((p: any) => (
                <div key={p.id} className="p-3 bg-slate-950/50 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{p.method.replace('_', ' ')}</p>
                    {p.reference && <p className="text-[10px] text-slate-500 font-mono mt-0.5">Ref: {p.reference}</p>}
                    <p className="text-[9px] text-slate-500 mt-1">{formatDate(p.paidAt)}</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(p.amount, invoice.currency)}
                  </span>
                </div>
              ))}
              {invoice.payments.length === 0 && (
                <p className="text-slate-500 italic py-2">No payment logs recorded.</p>
              )}
            </div>
          </div>

          {/* Activity Logs */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/10">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <History className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Statement activity audit</h3>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {invoice.activities.map((a: any) => (
                <div key={a.id} className="border-l-2 border-slate-800 pl-3 py-0.5">
                  <p className="text-slate-300">{a.description}</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{formatDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Record Manual Payment</h3>
              <button 
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Payment Amount ({invoice.currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. 150.00"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Payment Method *</label>
                <select
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="CASH">Cash</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="CHECK">Check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Transaction reference ID</label>
                <input
                  type="text"
                  value={payForm.reference}
                  onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="e.g. TXN-9988221, Bank ref number"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes / Description</label>
                <textarea
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-indigo-500 h-16 resize-none"
                  placeholder="e.g. First installment cleared"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-900 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recording}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {recording ? 'Recording...' : 'Post Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
