// app/api/stripe-checkout-mock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoiceId');

  if (!invoiceId) {
    return new NextResponse('Invoice ID is required', { status: 400 });
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const unpaidAmount = Math.max(0, invoice.total - invoice.paidAmount);

    if (unpaidAmount > 0) {
      // Record payment
      await prisma.payment.create({
        data: {
          amount: unpaidAmount,
          method: 'STRIPE',
          reference: `ch_mock_${Math.random().toString(36).substring(7)}`,
          notes: 'Simulated Stripe checkout payment.',
          paidAt: new Date(),
          invoiceId: invoiceId,
        },
      });

      // Update invoice
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: invoice.total,
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // Record activity
      await prisma.activity.create({
        data: {
          type: 'PAYMENT',
          description: `Invoice paid in full ($${invoice.total.toFixed(2)}) via Stripe Checkout (Simulated)`,
          invoiceId: invoiceId,
        },
      });
    }

    // Redirect to the invoice view page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${appUrl}/invoices/${invoiceId}?payment_success=true`);
  } catch (error: any) {
    console.error('Error in mock stripe payment:', error);
    return new NextResponse(`Payment processing error: ${error.message}`, { status: 500 });
  }
}
