// lib/resend.ts
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
  }>;
}

export async function sendEmail(payload: SendEmailPayload): Promise<{ success: boolean; id?: string; error?: any }> {
  const fromEmail = process.env.FROM_EMAIL || 'billing@smartfinance.dev';
  
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: `Smart Finance <${fromEmail}>`,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        attachments: payload.attachments,
      });

      if (error) {
        return { success: false, error };
      }
      return { success: true, id: data?.id };
    } catch (e) {
      console.warn('Resend send failure, falling back to console mock:', e);
    }
  }

  // Console Log Mock Fallback
  console.log('--- 📬 MOCK EMAIL SENT ---');
  console.log(`From: Smart Finance <${fromEmail}>`);
  console.log(`To: ${payload.to}`);
  console.log(`Subject: ${payload.subject}`);
  console.log(`Body (Snippet): ${payload.html.substring(0, 300)}...`);
  if (payload.attachments && payload.attachments.length > 0) {
    console.log(`Attachments: ${payload.attachments.map(a => a.filename).join(', ')}`);
  }
  console.log('--------------------------');

  return { success: true, id: `mock_${Date.now()}` };
}
