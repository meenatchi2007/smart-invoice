// lib/utils.ts
import { prisma } from './prisma';

export function cn(...inputs: (string | undefined | null | boolean | {[key: string]: boolean})[]) {
  const classes: string[] = [];
  inputs.forEach(input => {
    if (!input) return;
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object') {
      Object.entries(input).forEach(([key, val]) => {
        if (val) classes.push(key);
      });
    }
  });
  return classes.join(' ');
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  } catch (e) {
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  }
}

export function formatDate(dateInput: string | Date | number): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear();
  // Fetch existing count of invoices for the organization this year
  const count = await prisma.invoice.count({
    where: {
      organizationId,
      issueDate: {
        gte: new Date(`${year}-01-01`),
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}
