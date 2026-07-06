// app/api/invoices/[id]/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateInvoicePDFBuffer } from '@/lib/pdf-generator';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { client: true, lineItems: true, payments: true, organization: true },
    });

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(invoice);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF download:', error);
    return new NextResponse(`PDF Generation error: ${error.message}`, { status: 500 });
  }
}
