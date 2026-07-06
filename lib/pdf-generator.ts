// lib/pdf-generator.ts
import React from 'react';
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1pt solid #e2e8f0' },
  orgName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  orgAddress: { fontSize: 8, color: '#64748b', marginTop: 4, lineHeight: 1.5 },
  statusBadge: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 1 },
  invoiceNumber: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 4 },
  metaText: { fontSize: 8, color: '#94a3b8', marginTop: 2 },
  billToLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  billToName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  billToDetail: { fontSize: 8, color: '#64748b', marginTop: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: '8 10', borderBottom: '1pt solid #e2e8f0', borderTop: '1pt solid #e2e8f0', marginTop: 24 },
  tableHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', padding: '10 10', borderBottom: '0.5pt solid #f1f5f9' },
  tableCell: { fontSize: 9, color: '#334155' },
  desc: { flex: 3 },
  qty: { flex: 1, textAlign: 'center' },
  price: { flex: 1, textAlign: 'right' },
  amount: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  totalsLabel: { fontSize: 9, color: '#64748b', width: 120, textAlign: 'right', paddingRight: 12 },
  totalsValue: { fontSize: 9, color: '#0f172a', width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1pt solid #e2e8f0' },
  grandTotalLabel: { fontSize: 11, color: '#0f172a', fontFamily: 'Helvetica-Bold', width: 120, textAlign: 'right', paddingRight: 12 },
  grandTotalValue: { fontSize: 11, color: '#4f46e5', fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right' },
  notes: { marginTop: 32, paddingTop: 16, borderTop: '0.5pt solid #e2e8f0' },
  notesLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b', marginBottom: 4 },
  notesText: { fontSize: 8, color: '#94a3b8', lineHeight: 1.5 },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, borderTop: '0.5pt solid #e2e8f0', paddingTop: 10 },
  footerText: { fontSize: 7, color: '#cbd5e1', textAlign: 'center' },
  balanceRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  balanceLabel: { fontSize: 9, color: '#f59e0b', width: 120, textAlign: 'right', paddingRight: 12 },
  balanceValue: { fontSize: 9, color: '#f59e0b', fontFamily: 'Helvetica-Bold', width: 80, textAlign: 'right' },
});

function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function generateInvoicePDFBuffer(invoice: any): Promise<Buffer> {
  const lineItems: any[] = invoice.lineItems || [];
  const payments: any[] = invoice.payments || [];
  const client = invoice.client || {};
  const org = invoice.organization || {};
  const balance = Math.max(0, invoice.total - invoice.paidAmount);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.orgName }, org.name || 'Alpha Software Inc.'),
          React.createElement(Text, { style: styles.orgAddress }, org.address || ''),
          org.taxId ? React.createElement(Text, { style: { fontSize: 8, color: '#94a3b8', marginTop: 2 } }, `VAT/Tax ID: ${org.taxId}`) : null,
        ),
        React.createElement(
          View,
          { style: { alignItems: 'flex-end' } },
          React.createElement(Text, { style: styles.statusBadge }, invoice.status),
          React.createElement(Text, { style: styles.invoiceNumber }, invoice.invoiceNumber),
          React.createElement(Text, { style: styles.metaText }, `Issue Date: ${formatDate(invoice.issueDate)}`),
          React.createElement(Text, { style: { ...styles.metaText, fontFamily: 'Helvetica-Bold' } }, `Due Date: ${formatDate(invoice.dueDate)}`),
        ),
      ),
      // Bill To
      React.createElement(
        View,
        { style: { marginBottom: 24 } },
        React.createElement(Text, { style: styles.billToLabel }, 'Bill To'),
        React.createElement(Text, { style: styles.billToName }, client.name || ''),
        client.company ? React.createElement(Text, { style: styles.billToDetail }, client.company) : null,
        client.address ? React.createElement(Text, { style: styles.billToDetail }, client.address) : null,
        React.createElement(Text, { style: styles.billToDetail }, client.email || ''),
      ),
      // Table Header
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 3 } }, 'Description'),
        React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: 'center' } }, 'Qty'),
        React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: 'right' } }, 'Unit Price'),
        React.createElement(Text, { style: { ...styles.tableHeaderText, flex: 1, textAlign: 'right' } }, 'Amount'),
      ),
      // Line Items
      ...lineItems.map((item: any) =>
        React.createElement(
          View,
          { style: styles.tableRow, key: item.id },
          React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, item.description),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'center' } }, String(item.quantity)),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right' } }, formatMoney(item.unitPrice, invoice.currency)),
          React.createElement(Text, { style: { ...styles.tableCell, flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' } }, formatMoney(item.amount, invoice.currency)),
        )
      ),
      // Totals
      React.createElement(View, { style: { marginTop: 16 } },
        React.createElement(View, { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, 'Subtotal:'),
          React.createElement(Text, { style: styles.totalsValue }, formatMoney(invoice.subtotal, invoice.currency)),
        ),
        invoice.discountRate > 0 ? React.createElement(View, { style: styles.totalsRow },
          React.createElement(Text, { style: { ...styles.totalsLabel, color: '#ef4444' } }, `Discount (${invoice.discountRate}%):`),
          React.createElement(Text, { style: { ...styles.totalsValue, color: '#ef4444' } }, `- ${formatMoney(invoice.discountAmount, invoice.currency)}`),
        ) : null,
        invoice.taxRate > 0 ? React.createElement(View, { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, `Tax (${invoice.taxRate}%):`),
          React.createElement(Text, { style: styles.totalsValue }, `+ ${formatMoney(invoice.taxAmount, invoice.currency)}`),
        ) : null,
        React.createElement(View, { style: styles.grandTotalRow },
          React.createElement(Text, { style: styles.grandTotalLabel }, 'Total:'),
          React.createElement(Text, { style: styles.grandTotalValue }, formatMoney(invoice.total, invoice.currency)),
        ),
        invoice.paidAmount > 0 ? React.createElement(View, { style: styles.totalsRow },
          React.createElement(Text, { style: { ...styles.totalsLabel, color: '#10b981' } }, 'Amount Paid:'),
          React.createElement(Text, { style: { ...styles.totalsValue, color: '#10b981' } }, formatMoney(invoice.paidAmount, invoice.currency)),
        ) : null,
        balance > 0 ? React.createElement(View, { style: styles.balanceRow },
          React.createElement(Text, { style: styles.balanceLabel }, 'Balance Due:'),
          React.createElement(Text, { style: styles.balanceValue }, formatMoney(balance, invoice.currency)),
        ) : null,
      ),
      // Notes & Terms
      (invoice.notes || invoice.terms) ? React.createElement(View, { style: styles.notes },
        invoice.notes ? React.createElement(View, { style: { marginBottom: 8 } },
          React.createElement(Text, { style: styles.notesLabel }, 'Notes:'),
          React.createElement(Text, { style: styles.notesText }, invoice.notes),
        ) : null,
        invoice.terms ? React.createElement(View, null,
          React.createElement(Text, { style: styles.notesLabel }, 'Terms & Conditions:'),
          React.createElement(Text, { style: styles.notesText }, invoice.terms),
        ) : null,
      ) : null,
      // Footer
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, `${org.name || 'Smart Finance'} • Generated on ${formatDate(new Date())} • Thank you for your business.`),
      ),
    )
  );

  return await renderToBuffer(doc);
}
