// lib/emails.ts
import { sendEmail } from './resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const FROM = process.env.FROM_EMAIL || 'billing@smartfinance.dev';

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
  .header { background: #4f46e5; padding: 32px 40px; }
  .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px; }
  .header p { color: #c7d2fe; margin: 6px 0 0; font-size: 13px; }
  .body { padding: 40px; color: #334155; font-size: 14px; line-height: 1.6; }
  .body h2 { color: #0f172a; font-size: 18px; margin: 0 0 16px; }
  .body p { margin: 0 0 16px; color: #475569; }
  .table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 13px; }
  .table th { background: #f8fafc; padding: 10px 14px; text-align: left; color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
  .table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  .table .amount { font-weight: 700; font-family: monospace; }
  .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 8px 0; }
  .btn-outline { display: inline-block; border: 2px solid #4f46e5; color: #4f46e5 !important; padding: 12px 26px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin: 8px 0; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-paid { background: #dcfce7; color: #16a34a; }
  .badge-overdue { background: #fee2e2; color: #dc2626; }
  .badge-sent { background: #dbeafe; color: #2563eb; }
  .total-row { background: #f8fafc; font-weight: 700; }
  .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  .footer { background: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  .highlight-box { background: #f0f9ff; border-left: 4px solid #4f46e5; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .warning-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
  .success-box { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
</style>
</head>
<body>
<div class="wrapper">
  ${content}
  <div class="footer">
    <p>SmartFinance • Automated billing & finance management</p>
    <p style="margin-top:6px;">You received this email because you are a client or user of this account.</p>
  </div>
</div>
</body>
</html>`;
}

function formatMoney(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── 1. INVOICE EMAIL ────────────────────────────────────────────────────────

export async function sendInvoiceEmail(invoice: any) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const invoiceUrl = `${APP_URL}/invoices/${invoice.id}`;

  const lineItemsHtml = (invoice.lineItems || []).map((item: any) => `
    <tr>
      <td>${item.description}</td>
      <td style="text-align:center;">${item.quantity}</td>
      <td style="text-align:right;" class="amount">${formatMoney(item.unitPrice, invoice.currency)}</td>
      <td style="text-align:right;" class="amount">${formatMoney(item.amount, invoice.currency)}</td>
    </tr>
  `).join('');

  const html = baseTemplate(`
    <div class="header">
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>${invoice.title || 'New invoice from SmartFinance'}</p>
    </div>
    <div class="body">
      <h2>Hi ${invoice.client?.name || 'there'},</h2>
      <p>You have a new invoice ready for review and payment. Please find the details below.</p>

      <div class="highlight-box">
        <table style="width:100%;font-size:13px;">
          <tr>
            <td style="color:#64748b;">Invoice Number</td>
            <td style="font-weight:700;text-align:right;font-family:monospace;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Issue Date</td>
            <td style="text-align:right;padding-top:6px;">${formatDate(invoice.issueDate)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Due Date</td>
            <td style="font-weight:700;color:#dc2626;text-align:right;padding-top:6px;">${formatDate(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Amount Due</td>
            <td style="font-weight:700;font-size:18px;color:#4f46e5;text-align:right;padding-top:6px;font-family:monospace;">${formatMoney(balance, invoice.currency)}</td>
          </tr>
        </table>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
        <tfoot>
          ${invoice.discountRate > 0 ? `<tr><td colspan="3" style="text-align:right;padding:10px 14px;color:#64748b;">Discount (${invoice.discountRate}%)</td><td style="text-align:right;padding:10px 14px;color:#dc2626;font-family:monospace;font-weight:700;">- ${formatMoney(invoice.discountAmount, invoice.currency)}</td></tr>` : ''}
          ${invoice.taxRate > 0 ? `<tr><td colspan="3" style="text-align:right;padding:10px 14px;color:#64748b;">Tax (${invoice.taxRate}%)</td><td style="text-align:right;padding:10px 14px;font-family:monospace;">+ ${formatMoney(invoice.taxAmount, invoice.currency)}</td></tr>` : ''}
          <tr class="total-row">
            <td colspan="3" style="text-align:right;padding:12px 14px;">Total Due</td>
            <td style="text-align:right;padding:12px 14px;font-family:monospace;font-size:16px;color:#4f46e5;">${formatMoney(invoice.total, invoice.currency)}</td>
          </tr>
        </tfoot>
      </table>

      ${invoice.notes ? `<p style="font-size:13px;color:#64748b;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
      ${invoice.terms ? `<p style="font-size:13px;color:#64748b;"><strong>Terms:</strong> ${invoice.terms}</p>` : ''}

      <div style="text-align:center;margin-top:32px;">
        <a href="${invoiceUrl}" class="btn">View Invoice &amp; Pay Online →</a>
      </div>
    </div>
  `);

  return sendEmail({
    to: invoice.client?.email,
    subject: `Invoice ${invoice.invoiceNumber} — ${formatMoney(balance, invoice.currency)} due ${formatDate(invoice.dueDate)}`,
    html,
  });
}

// ─── 2. WELCOME EMAIL ────────────────────────────────────────────────────────

export async function sendWelcomeEmail(user: { name: string; email: string }, orgName: string) {
  const dashboardUrl = `${APP_URL}/`;

  const html = baseTemplate(`
    <div class="header">
      <h1>Welcome to SmartFinance 🎉</h1>
      <p>Your finance console is ready</p>
    </div>
    <div class="body">
      <h2>Hi ${user.name},</h2>
      <p>Your account for <strong>${orgName}</strong> has been created successfully. You can now start managing invoices, tracking expenses, and gaining AI-powered financial insights.</p>

      <div class="success-box">
        <p style="margin:0;font-weight:600;color:#15803d;">✓ Account created for ${user.email}</p>
        <p style="margin:6px 0 0;font-size:13px;color:#166534;">Organization: <strong>${orgName}</strong></p>
      </div>

      <p>Here's what you can do with SmartFinance:</p>
      <table style="width:100%;font-size:13px;margin:16px 0;">
        <tr>
          <td style="padding:8px 0;">📄</td>
          <td style="padding:8px 12px;"><strong>Create & send invoices</strong> — professional PDF invoices with one click</td>
        </tr>
        <tr>
          <td style="padding:8px 0;">💰</td>
          <td style="padding:8px 12px;"><strong>Track expenses</strong> — AI auto-categorizes your spending</td>
        </tr>
        <tr>
          <td style="padding:8px 0;">📊</td>
          <td style="padding:8px 12px;"><strong>Financial reports</strong> — P&L statements and 6-month forecasts</td>
        </tr>
        <tr>
          <td style="padding:8px 0;">🤖</td>
          <td style="padding:8px 12px;"><strong>AI insights</strong> — Claude-powered financial analysis and chat</td>
        </tr>
      </table>

      <div style="text-align:center;margin-top:32px;">
        <a href="${dashboardUrl}" class="btn">Go to Your Dashboard →</a>
      </div>
    </div>
  `);

  return sendEmail({
    to: user.email,
    subject: `Welcome to SmartFinance, ${user.name}! Your account is ready.`,
    html,
  });
}

// ─── 3. PAYMENT REMINDER EMAIL ───────────────────────────────────────────────

export async function sendPaymentReminderEmail(invoice: any) {
  const balance = Math.max(0, invoice.total - invoice.paidAmount);
  const invoiceUrl = `${APP_URL}/invoices/${invoice.id}`;
  const dueDate = new Date(invoice.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysDiff = Math.abs(Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  const overdueText = isOverdue ? `${daysDiff} day${daysDiff !== 1 ? 's' : ''} overdue` : `due in ${daysDiff} day${daysDiff !== 1 ? 's' : ''}`;

  const html = baseTemplate(`
    <div class="header" style="background:${isOverdue ? '#dc2626' : '#f59e0b'};">
      <h1>${isOverdue ? '⚠️ Payment Overdue' : '🔔 Payment Reminder'}</h1>
      <p>Invoice ${invoice.invoiceNumber} is ${overdueText}</p>
    </div>
    <div class="body">
      <h2>Hi ${invoice.client?.name || 'there'},</h2>
      <p>This is a ${isOverdue ? '<strong>friendly reminder</strong>' : 'reminder'} that payment for invoice <strong>${invoice.invoiceNumber}</strong> is ${isOverdue ? 'now <strong style="color:#dc2626;">overdue</strong>' : 'coming up soon'}.</p>

      <div class="${isOverdue ? 'warning-box' : 'highlight-box'}">
        <table style="width:100%;font-size:13px;">
          <tr>
            <td style="color:#64748b;">Invoice</td>
            <td style="font-weight:700;text-align:right;font-family:monospace;">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Due Date</td>
            <td style="font-weight:700;color:${isOverdue ? '#dc2626' : '#d97706'};text-align:right;padding-top:6px;">${formatDate(invoice.dueDate)}</td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Status</td>
            <td style="text-align:right;padding-top:6px;"><span class="badge badge-${isOverdue ? 'overdue' : 'sent'}">${isOverdue ? 'OVERDUE' : 'PENDING'}</span></td>
          </tr>
          <tr>
            <td style="color:#64748b;padding-top:6px;">Amount Due</td>
            <td style="font-weight:700;font-size:18px;color:${isOverdue ? '#dc2626' : '#4f46e5'};text-align:right;padding-top:6px;font-family:monospace;">${formatMoney(balance, invoice.currency)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:#64748b;">Please arrange payment at your earliest convenience to avoid any service interruption. If you have already sent payment, please disregard this notice.</p>

      <div style="text-align:center;margin-top:32px;">
        <a href="${invoiceUrl}" class="btn">Pay Now →</a>
      </div>

      <p style="font-size:12px;color:#94a3b8;margin-top:24px;text-align:center;">
        Having trouble? Reply to this email or contact us directly.
      </p>
    </div>
  `);

  return sendEmail({
    to: invoice.client?.email,
    subject: `${isOverdue ? '⚠️ OVERDUE' : '🔔 Reminder'}: Invoice ${invoice.invoiceNumber} — ${formatMoney(balance, invoice.currency)} ${overdueText}`,
    html,
  });
}

// ─── 4. PAYMENT RECEIVED EMAIL ───────────────────────────────────────────────

export async function sendPaymentReceivedEmail(invoice: any, payment: { amount: number; method: string; reference?: string }) {
  const remaining = Math.max(0, invoice.total - invoice.paidAmount);
  const isFullyPaid = remaining === 0;
  const invoiceUrl = `${APP_URL}/invoices/${invoice.id}`;

  const html = baseTemplate(`
    <div class="header" style="background:#16a34a;">
      <h1>✓ Payment Received</h1>
      <p>Thank you for your payment on Invoice ${invoice.invoiceNumber}</p>
    </div>
    <div class="body">
      <h2>Hi ${invoice.client?.name || 'there'},</h2>
      <p>We have successfully received your payment. ${isFullyPaid ? 'This invoice is now <strong>fully paid</strong>. Thank you!' : `A partial payment has been recorded. There is still a remaining balance on this invoice.`}</p>

      <div class="success-box">
        <table style="width:100%;font-size:13px;">
          <tr>
            <td style="color:#166534;">Payment Amount</td>
            <td style="font-weight:700;font-size:18px;color:#15803d;text-align:right;font-family:monospace;">${formatMoney(payment.amount, invoice.currency)}</td>
          </tr>
          <tr>
            <td style="color:#166534;padding-top:6px;">Payment Method</td>
            <td style="text-align:right;padding-top:6px;font-weight:600;">${payment.method.replace(/_/g, ' ')}</td>
          </tr>
          ${payment.reference ? `<tr><td style="color:#166534;padding-top:6px;">Reference</td><td style="text-align:right;padding-top:6px;font-family:monospace;">${payment.reference}</td></tr>` : ''}
          <tr>
            <td style="color:#166534;padding-top:6px;">Date</td>
            <td style="text-align:right;padding-top:6px;">${formatDate(new Date())}</td>
          </tr>
          <tr>
            <td style="color:#166534;padding-top:6px;">Invoice Status</td>
            <td style="text-align:right;padding-top:6px;"><span class="badge badge-paid">${isFullyPaid ? 'PAID' : 'PARTIAL'}</span></td>
          </tr>
          ${!isFullyPaid ? `<tr><td style="color:#92400e;padding-top:6px;font-weight:600;">Remaining Balance</td><td style="text-align:right;padding-top:6px;font-weight:700;color:#d97706;font-family:monospace;">${formatMoney(remaining, invoice.currency)}</td></tr>` : ''}
        </table>
      </div>

      <p style="font-size:13px;color:#64748b;">You can view your full invoice and payment history by clicking the button below.</p>

      <div style="text-align:center;margin-top:32px;">
        <a href="${invoiceUrl}" class="btn-outline">View Invoice →</a>
      </div>
    </div>
  `);

  return sendEmail({
    to: invoice.client?.email,
    subject: `✓ Payment of ${formatMoney(payment.amount, invoice.currency)} received — Invoice ${invoice.invoiceNumber}`,
    html,
  });
}
