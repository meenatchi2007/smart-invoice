// lib/stripe.ts
import Stripe from 'stripe';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
export const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' as any }) : null;

export async function createInvoicePaymentLink(invoice: {
  id: string;
  invoiceNumber: string;
  total: number;
  currency: string;
}): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (stripe) {
    try {
      // Find or create product
      const product = await stripe.products.create({
        name: `Invoice ${invoice.invoiceNumber}`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(invoice.total * 100),
        currency: invoice.currency.toLowerCase(),
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: price.id, quantity: 1 }],
        mode: 'payment',
        success_url: `${appUrl}/invoices/${invoice.id}?status=paid&stripe_session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/invoices/${invoice.id}?status=cancelled`,
        metadata: { invoiceId: invoice.id },
      });

      return session.url || '';
    } catch (e) {
      console.warn('Stripe checkout session creation failed, using mock:', e);
    }
  }

  // Simulated Payment Link (points to a local mock checkout flow)
  return `${appUrl}/api/stripe-checkout-mock?invoiceId=${invoice.id}`;
}
