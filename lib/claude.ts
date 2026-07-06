// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY || '';
const anthropic = apiKey ? new Anthropic({ apiKey }) : null;

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  actionable: boolean;
  suggestion: string;
}

// Pre-defined categories from prompt:
// [Software, Travel, Office Supplies, Marketing, Meals & Entertainment, Utilities, Professional Services, Equipment, Rent, Insurance, Other]
export async function categorizeExpense(title: string, amount: number): Promise<string> {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Categorize this business expense into ONE of: 
[Software, Travel, Office Supplies, Marketing, Meals & Entertainment, 
 Utilities, Professional Services, Equipment, Rent, Insurance, Other]

Expense: "${title}", Amount: $${amount}

Reply with ONLY the category name, nothing else.`
        }]
      });
      const text = (response.content[0] as { text: string }).text.trim();
      return text;
    } catch (e) {
      console.warn('Claude API error, falling back to local categorizer:', e);
    }
  }

  // Local rule-based categorizer
  const t = title.toLowerCase();
  if (t.includes('aws') || t.includes('github') || t.includes('openai') || t.includes('vercel') || t.includes('adobe') || t.includes('zoom') || t.includes('slack') || t.includes('microsoft') || t.includes('host') || t.includes('domain') || t.includes('server') || t.includes('saas') || t.includes('software')) {
    return 'Software';
  }
  if (t.includes('flight') || t.includes('uber') || t.includes('taxi') || t.includes('hotel') || t.includes('trip') || t.includes('airline') || t.includes('travel') || t.includes('gas') || t.includes('train')) {
    return 'Travel';
  }
  if (t.includes('paper') || t.includes('pen') || t.includes('notebook') || t.includes('stapler') || t.includes('desk') || t.includes('chair') || t.includes('office') || t.includes('supplies')) {
    return 'Office Supplies';
  }
  if (t.includes('facebook') || t.includes('google ad') || t.includes('ad') || t.includes('marketing') || t.includes('seo') || t.includes('campaign') || t.includes('newsletter') || t.includes('promo')) {
    return 'Marketing';
  }
  if (t.includes('restaurant') || t.includes('coffee') || t.includes('meal') || t.includes('food') || t.includes('lunch') || t.includes('dinner') || t.includes('starbucks') || t.includes('entertainment')) {
    return 'Meals & Entertainment';
  }
  if (t.includes('water') || t.includes('electricity') || t.includes('internet') || t.includes('phone bill') || t.includes('utilities') || t.includes('power') || t.includes('gas bill')) {
    return 'Utilities';
  }
  if (t.includes('lawyer') || t.includes('accountant') || t.includes('consultant') || t.includes('legal') || t.includes('advisor') || t.includes('audit')) {
    return 'Professional Services';
  }
  if (t.includes('laptop') || t.includes('macbook') || t.includes('monitor') || t.includes('keyboard') || t.includes('printer') || t.includes('equipment') || t.includes('hardware')) {
    return 'Equipment';
  }
  if (t.includes('rent') || t.includes('office space') || t.includes('coworking') || t.includes('lease')) {
    return 'Rent';
  }
  if (t.includes('insurance') || t.includes('health') || t.includes('liability')) {
    return 'Insurance';
  }
  return 'Other';
}

export async function generateAIChat(
  message: string,
  financialData: { totalRevenue: number; totalExpenses: number; netProfit: number; outstandingAmount: number }
): Promise<string> {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 400,
        system: `You are a concise financial assistant for a SaaS invoice management tool. 
The user's current financial data: Revenue=$${financialData.totalRevenue.toFixed(2)}, Expenses=$${financialData.totalExpenses.toFixed(2)}, Net Profit=$${financialData.netProfit.toFixed(2)}, Outstanding=$${financialData.outstandingAmount.toFixed(2)}.
Answer in 2-3 sentences max. Be specific with numbers when relevant.`,
        messages: [{ role: 'user', content: message }],
      });
      return (response.content[0] as { text: string }).text.trim();
    } catch (e) {
      console.warn('Claude chat error, using rule-based fallback:', e);
    }
  }

  // Rule-based fallback
  const q = message.toLowerCase();
  if (q.includes('profit') || q.includes('revenue') || q.includes('make') || q.includes('earn')) {
    return `You have collected $${financialData.totalRevenue.toFixed(2)} in revenue. After $${financialData.totalExpenses.toFixed(2)} in expenses, your net profit is $${financialData.netProfit.toFixed(2)}.`;
  }
  if (q.includes('expense') || q.includes('cost') || q.includes('spend')) {
    return `Your total recorded expenses are $${financialData.totalExpenses.toFixed(2)}. Review your Software and Marketing categories for potential savings.`;
  }
  if (q.includes('unpaid') || q.includes('outstanding') || q.includes('overdue') || q.includes('invoice')) {
    return `You currently have $${financialData.outstandingAmount.toFixed(2)} in outstanding receivables. Sending payment reminders is the fastest way to collect.`;
  }
  return `Your net profit is $${financialData.netProfit.toFixed(2)} with $${financialData.outstandingAmount.toFixed(2)} still outstanding. Ask me about revenue, expenses, or overdue invoices for more detail.`;
}

export async function generateAIInsights(financialData: {
  invoices: any[];
  expenses: any[];
  clients: any[];
}): Promise<AIInsight[]> {
  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Analyze this financial data and return insights as a JSON array:
${JSON.stringify(financialData)}

Return ONLY a valid JSON array of insights with the following TypeScript shape, and absolutely NO markdown enclosing backticks:
[{ "type": "warning|info|critical", "title": "...", "description": "...", "severity": "info|warning|critical", "actionable": true|false, "suggestion": "..." }]`
        }]
      });
      const text = (response.content[0] as { text: string }).text;
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.warn('Claude API error, falling back to local insights:', e);
    }
  }

  // Local insight generator based on data analysis
  const insights: AIInsight[] = [];
  const invoices = financialData.invoices || [];
  const expenses = financialData.expenses || [];
  const clients = financialData.clients || [];

  // Anomaly 1: Late payments or overdue invoices
  const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;
  const overdueAmount = invoices.filter(inv => inv.status === 'OVERDUE').reduce((acc, i) => acc + (i.total - i.paidAmount), 0);
  if (overdueCount > 0) {
    insights.push({
      type: 'critical',
      title: 'High Volume of Overdue Invoices',
      description: `You currently have ${overdueCount} overdue invoice(s) totaling $${overdueAmount.toFixed(2)}. This is slowing down your cash flow.`,
      severity: 'critical',
      actionable: true,
      suggestion: 'Set up automatic email reminders or offer a 2% early payment discount to encourage faster payments.'
    });
  }

  // Anomaly 2: Expenses spikes or software expense concentrations
  const softwareExpenses = expenses.filter(e => e.aiCategory === 'Software').reduce((acc, e) => acc + e.amount, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  if (softwareExpenses > 0 && totalExpenses > 0 && (softwareExpenses / totalExpenses) > 0.4) {
    insights.push({
      type: 'warning',
      title: 'Concentrated Software Spending',
      description: `Software expenses make up ${(softwareExpenses / totalExpenses * 100).toFixed(1)}% of your total spending ($${softwareExpenses.toFixed(2)}).`,
      severity: 'warning',
      actionable: true,
      suggestion: 'Review your active SaaS subscriptions. Check for duplicate seats or unused subscriptions in your team.'
    });
  }

  // Insight 3: Top clients concentration
  if (clients.length > 0) {
    // Generate outstanding count per client
    const clientLateStats = clients.map(client => {
      const clientInvs = invoices.filter(inv => inv.clientId === client.id);
      const lateInvs = clientInvs.filter(inv => inv.status === 'OVERDUE');
      return {
        name: client.name,
        lateCount: lateInvs.length,
      };
    }).filter(c => c.lateCount >= 2);

    clientLateStats.forEach(stat => {
      insights.push({
        type: 'warning',
        title: `Late Payment Behavior: ${stat.name}`,
        description: `${stat.name} has ${stat.lateCount} overdue invoices currently. This client is frequently late.`,
        severity: 'warning',
        actionable: true,
        suggestion: 'Consider requiring a 30% or 50% deposit upfront before starting new milestones for this client.'
      });
    });
  }

  // Generic cash flow healthy/warning insights
  const totalRevenue = invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').reduce((acc, i) => acc + i.paidAmount, 0);
  if (totalRevenue > totalExpenses * 1.5) {
    insights.push({
      type: 'info',
      title: 'Strong Cash Flow Margin',
      description: 'Your collected revenue exceeds your expenses by over 50%. Your financial runway is growing.',
      severity: 'info',
      actionable: false,
      suggestion: 'Consider allocating a portion of surplus cash into high-yield business savings or business development.'
    });
  } else if (totalExpenses > totalRevenue && totalExpenses > 0) {
    insights.push({
      type: 'warning',
      title: 'Negative Net Cash Flow',
      description: 'Your monthly expenses exceed your collected revenue. This is draining cash reserves.',
      severity: 'warning',
      actionable: true,
      suggestion: 'Postpone non-essential expenses and trigger immediate follow-up on sent but unpaid invoices.'
    });
  }

  // Default initial insights if database is empty
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Welcome to Smart Finance Insights',
      description: 'AI Insights are active. Once you add invoices, clients, and expenses, we will analyze late payment trends, spending anomalies, and predict cash flow.',
      severity: 'info',
      actionable: false,
      suggestion: 'Start by creating your first client and invoicing them, or uploading an expense receipt!'
    });
  }

  return insights;
}
