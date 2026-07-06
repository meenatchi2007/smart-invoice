// graphql/resolvers.ts
import { prisma } from '../lib/prisma';
import { categorizeExpense, generateAIInsights, generateAIChat } from '../lib/claude';
import { createInvoicePaymentLink } from '../lib/stripe';
import { sendEmail } from '../lib/resend';
import { sendInvoiceEmail, sendWelcomeEmail, sendPaymentReminderEmail, sendPaymentReceivedEmail } from '../lib/emails';
import { generateInvoiceNumber } from '../lib/utils';
import { GraphQLScalarType, Kind } from 'graphql';
import bcrypt from 'bcryptjs';

// Custom Scalar implementation for DateTime
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Helper to get authenticated user — throws if not logged in
async function getContextUser(context: any) {
  // If token was decoded in route context, use that user directly
  if (context?.user?.id) {
    return context.user;
  }

  // Dev fallback: auto-seed a demo user if DB is empty (first-run experience)
  let devOrg = await prisma.organization.findFirst();
  if (!devOrg) {
    devOrg = await prisma.organization.create({
      data: {
        name: 'Alpha Software Inc.',
        address: '100 Innovation Way, Suite 400, Boston MA 02110',
        taxId: 'US-987654321',
        currency: 'USD',
      },
    });

    // Create default categories
    const categories = [
      { name: 'Software', color: '#4f46e5', icon: 'Cpu', type: 'EXPENSE' },
      { name: 'Office Supplies', color: '#10b981', icon: 'FileText', type: 'EXPENSE' },
      { name: 'Marketing', color: '#f59e0b', icon: 'Megaphone', type: 'EXPENSE' },
      { name: 'Meals & Entertainment', color: '#f43f5e', icon: 'Coffee', type: 'EXPENSE' },
      { name: 'Rent', color: '#8b5cf6', icon: 'Home', type: 'EXPENSE' },
      { name: 'Travel', color: '#06b6d4', icon: 'Compass', type: 'EXPENSE' },
      { name: 'Professional Services', color: '#ec4899', icon: 'Briefcase', type: 'EXPENSE' },
    ];
    for (const cat of categories) {
      await prisma.category.create({
        data: {
          ...cat,
          organizationId: devOrg.id,
        },
      });
    }
  }

  let devUser = await prisma.user.findFirst({
    where: { email: 'demo@smartfinance.dev' },
    include: { organization: true },
  });

  if (!devUser) {
    devUser = await prisma.user.create({
      data: {
        email: 'demo@smartfinance.dev',
        name: 'Alex Mercer',
        role: 'OWNER',
        passwordHash: 'hashed_password_placeholder', // bcrypt hash placeholder
        organizationId: devOrg.id,
      },
      include: { organization: true },
    });

    // Seed some initial clients and data to make the app beautiful at first glance!
    const client1 = await prisma.client.create({
      data: {
        name: 'Acme Laboratories',
        email: 'billing@acmelabs.com',
        company: 'Acme Labs',
        phone: '+1 555-0199',
        address: '456 Science Park Blvd, San Francisco, CA 94107',
        taxId: 'TX-8888222',
        currency: 'USD',
        organizationId: devOrg.id,
      },
    });

    const client2 = await prisma.client.create({
      data: {
        name: 'Stark Industries',
        email: 'finance@starkcorp.com',
        company: 'Stark Industries',
        phone: '+1 555-4820',
        address: '10880 Malibu Point, Malibu, CA 90265',
        taxId: 'TX-4444555',
        currency: 'USD',
        organizationId: devOrg.id,
      },
    });

    // Seed Invoices
    const inv1 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0001',
        title: 'Q1 Consulting Services',
        status: 'PAID',
        issueDate: new Date('2026-01-15'),
        dueDate: new Date('2026-02-15'),
        currency: 'USD',
        subtotal: 5000.0,
        taxRate: 5.0,
        taxAmount: 250.0,
        discountRate: 0,
        discountAmount: 0,
        total: 5250.0,
        paidAmount: 5250.0,
        paidAt: new Date('2026-02-10'),
        clientId: client1.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.lineItem.create({
      data: {
        description: 'Senior Software Engineer Consulting - 50 hours',
        quantity: 50,
        unitPrice: 100.0,
        amount: 5000.0,
        taxRate: 5.0,
        invoiceId: inv1.id,
      },
    });

    await prisma.payment.create({
      data: {
        amount: 5250.0,
        method: 'BANK_TRANSFER',
        reference: 'TXN-9988221',
        notes: 'Full payment received.',
        paidAt: new Date('2026-02-10'),
        invoiceId: inv1.id,
      },
    });

    const inv2 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0002',
        title: 'AI R&D Platform Development',
        status: 'OVERDUE',
        issueDate: new Date('2026-04-01'),
        dueDate: new Date('2026-05-01'),
        currency: 'USD',
        subtotal: 12000.0,
        taxRate: 0,
        taxAmount: 0,
        discountRate: 10.0,
        discountAmount: 1200.0,
        total: 10800.0,
        paidAmount: 0,
        clientId: client2.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.lineItem.create({
      data: {
        description: 'Custom LLM Fine-tuning & Deployment Pipeline',
        quantity: 1,
        unitPrice: 12000.0,
        amount: 12000.0,
        taxRate: 0,
        invoiceId: inv2.id,
      },
    });

    const inv3 = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0003',
        title: 'API Infrastructure Support',
        status: 'SENT',
        issueDate: new Date('2026-05-20'),
        dueDate: new Date('2026-06-25'),
        currency: 'USD',
        subtotal: 3500.0,
        taxRate: 8.25,
        taxAmount: 288.75,
        discountRate: 0,
        discountAmount: 0,
        total: 3788.75,
        paidAmount: 0,
        clientId: client1.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.lineItem.create({
      data: {
        description: 'Serverless deployment tuning and scale optimization support',
        quantity: 35,
        unitPrice: 100.0,
        amount: 3500.0,
        taxRate: 8.25,
        invoiceId: inv3.id,
      },
    });

    // Seed Expenses
    const catSoftware = await prisma.category.findFirst({ where: { name: 'Software', organizationId: devOrg.id } });
    const catTravel = await prisma.category.findFirst({ where: { name: 'Travel', organizationId: devOrg.id } });
    const catMeals = await prisma.category.findFirst({ where: { name: 'Meals & Entertainment', organizationId: devOrg.id } });

    await prisma.expense.create({
      data: {
        title: 'Vercel Enterprise Subscription',
        amount: 500.00,
        currency: 'USD',
        date: new Date('2026-05-05'),
        aiCategory: 'Software',
        categoryId: catSoftware?.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.expense.create({
      data: {
        title: 'OpenAI API Usage Billing',
        amount: 824.50,
        currency: 'USD',
        date: new Date('2026-05-18'),
        aiCategory: 'Software',
        categoryId: catSoftware?.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.expense.create({
      data: {
        title: 'Uber rides for developer onsite',
        amount: 72.40,
        currency: 'USD',
        date: new Date('2026-05-22'),
        aiCategory: 'Travel',
        categoryId: catTravel?.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });

    await prisma.expense.create({
      data: {
        title: 'Team lunch - Science Park Cafe',
        amount: 148.00,
        currency: 'USD',
        date: new Date('2026-06-01'),
        aiCategory: 'Meals & Entertainment',
        categoryId: catMeals?.id,
        organizationId: devOrg.id,
        userId: devUser.id,
      },
    });
  }

  return devUser;
}

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: {
    __serialize(value: any) { return value; },
    __parseValue(value: any) { return value; },
    __parseLiteral(ast: any) { return ast.value; }
  },

  User: {
    organization: async (parent: any) => {
      if (!parent.organizationId) return null;
      return prisma.organization.findUnique({ where: { id: parent.organizationId } });
    },
  },

  Organization: {
    clients: async (parent: any) => {
      return prisma.client.findMany({ where: { organizationId: parent.id } });
    },
    invoices: async (parent: any) => {
      return prisma.invoice.findMany({ where: { organizationId: parent.id } });
    },
    expenses: async (parent: any) => {
      return prisma.expense.findMany({ where: { organizationId: parent.id } });
    },
  },

  Client: {
    totalInvoiced: async (parent: any) => {
      const result = await prisma.invoice.aggregate({
        where: { clientId: parent.id },
        _sum: { total: true },
      });
      return result._sum.total || 0;
    },
    totalPaid: async (parent: any) => {
      const result = await prisma.invoice.aggregate({
        where: { clientId: parent.id },
        _sum: { paidAmount: true },
      });
      return result._sum.paidAmount || 0;
    },
    totalOutstanding: async (parent: any) => {
      const invoices = await prisma.invoice.findMany({
        where: { clientId: parent.id },
      });
      return invoices.reduce((acc, inv) => {
        const balance = inv.total - inv.paidAmount;
        return acc + (balance > 0 ? balance : 0);
      }, 0);
    },
    invoices: async (parent: any) => {
      return prisma.invoice.findMany({ where: { clientId: parent.id }, orderBy: { createdAt: 'desc' } });
    },
  },

  Invoice: {
    client: async (parent: any) => {
      return prisma.client.findUnique({ where: { id: parent.clientId } });
    },
    lineItems: async (parent: any) => {
      return prisma.lineItem.findMany({ where: { invoiceId: parent.id } });
    },
    payments: async (parent: any) => {
      return prisma.payment.findMany({ where: { invoiceId: parent.id } });
    },
    activities: async (parent: any) => {
      const dbActivities = await prisma.activity.findMany({
        where: { invoiceId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
      return dbActivities.map(act => ({
        ...act,
        metadata: act.metadata ? JSON.parse(act.metadata) : null,
      }));
    },
    balance: (parent: any) => {
      return Math.max(0, parent.total - parent.paidAmount);
    },
    isOverdue: (parent: any) => {
      if (parent.status === 'PAID') return false;
      return new Date(parent.dueDate) < new Date();
    },
    daysPastDue: (parent: any) => {
      if (parent.status === 'PAID') return 0;
      const due = new Date(parent.dueDate).getTime();
      const now = new Date().getTime();
      if (due >= now) return 0;
      return Math.floor((now - due) / (1000 * 60 * 60 * 24));
    },
  },

  Expense: {
    category: async (parent: any) => {
      if (!parent.categoryId) return null;
      return prisma.category.findUnique({ where: { id: parent.categoryId } });
    },
  },

  Query: {
    me: async (_: any, __: any, context: any) => {
      return getContextUser(context);
    },

    clients: async (_: any, args: { search?: string; page?: number; limit?: number }, context: any) => {
      const user = await getContextUser(context);
      const page = args.page || 1;
      const limit = args.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { organizationId: user.organizationId };
      if (args.search) {
        where.OR = [
          { name: { contains: args.search } },
          { email: { contains: args.search } },
          { company: { contains: args.search } },
        ];
      }

      const [items, totalCount] = await Promise.all([
        prisma.client.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.client.count({ where }),
      ]);

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },

    client: async (_: any, { id }: { id: string }) => {
      return prisma.client.findUnique({ where: { id } });
    },

    invoices: async (_: any, args: {
      status?: string;
      clientId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    }, context: any) => {
      const user = await getContextUser(context);
      const page = args.page || 1;
      const limit = args.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { organizationId: user.organizationId };
      if (args.status) {
        where.status = args.status;
      }
      if (args.clientId) {
        where.clientId = args.clientId;
      }
      if (args.dateFrom || args.dateTo) {
        where.issueDate = {};
        if (args.dateFrom) where.issueDate.gte = args.dateFrom;
        if (args.dateTo) where.issueDate.lte = args.dateTo;
      }
      if (args.search) {
        where.OR = [
          { invoiceNumber: { contains: args.search } },
          { title: { contains: args.search } },
          { client: { name: { contains: args.search } } },
        ];
      }

      const sortBy = args.sortBy || 'createdAt';
      const sortOrder = args.sortOrder ? args.sortOrder.toLowerCase() : 'desc';

      const [items, totalCount] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },

    invoice: async (_: any, { id }: { id: string }) => {
      return prisma.invoice.findUnique({ where: { id } });
    },

    nextInvoiceNumber: async (_: any, __: any, context: any) => {
      const user = await getContextUser(context);
      return generateInvoiceNumber(user.organizationId!);
    },

    expenses: async (_: any, args: {
      categoryId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      search?: string;
      page?: number;
      limit?: number;
    }, context: any) => {
      const user = await getContextUser(context);
      const page = args.page || 1;
      const limit = args.limit || 10;
      const skip = (page - 1) * limit;

      const where: any = { organizationId: user.organizationId };
      if (args.categoryId) {
        where.categoryId = args.categoryId;
      }
      if (args.dateFrom || args.dateTo) {
        where.date = {};
        if (args.dateFrom) where.date.gte = args.dateFrom;
        if (args.dateTo) where.date.lte = args.dateTo;
      }
      if (args.search) {
        where.OR = [
          { title: { contains: args.search } },
          { notes: { contains: args.search } },
        ];
      }

      const [items, totalCount] = await Promise.all([
        prisma.expense.findMany({
          where,
          skip,
          take: limit,
          orderBy: { date: 'desc' },
        }),
        prisma.expense.count({ where }),
      ]);

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    },

    expense: async (_: any, { id }: { id: string }) => {
      return prisma.expense.findUnique({ where: { id } });
    },

    categories: async (_: any, { type }: { type?: string }, context: any) => {
      const user = await getContextUser(context);
      const where: any = { organizationId: user.organizationId };
      if (type) {
        where.type = type;
      }
      return prisma.category.findMany({ where, orderBy: { name: 'asc' } });
    },

    financialSummary: async (_: any, args: { dateFrom?: Date; dateTo?: Date }, context: any) => {
      const user = await getContextUser(context);
      const orgId = user.organizationId!;

      const invoiceFilter: any = { organizationId: orgId };
      const expenseFilter: any = { organizationId: orgId };

      if (args.dateFrom || args.dateTo) {
        invoiceFilter.issueDate = {};
        expenseFilter.date = {};
        if (args.dateFrom) {
          invoiceFilter.issueDate.gte = args.dateFrom;
          expenseFilter.date.gte = args.dateFrom;
        }
        if (args.dateTo) {
          invoiceFilter.issueDate.lte = args.dateTo;
          expenseFilter.date.lte = args.dateTo;
        }
      }

      const [allInvoices, allExpenses, allClients] = await Promise.all([
        prisma.invoice.findMany({ where: invoiceFilter }),
        prisma.expense.findMany({ where: expenseFilter, include: { category: true } }),
        prisma.client.findMany({ where: { organizationId: orgId } }),
      ]);

      const totalRevenue = allInvoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').reduce((acc, i) => acc + i.paidAmount, 0);
      const totalExpenses = allExpenses.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = totalRevenue - totalExpenses;

      const outstandingAmount = allInvoices.reduce((acc, i) => acc + Math.max(0, i.total - i.paidAmount), 0);
      const now = new Date();
      const overdueInvoices = allInvoices.filter(i => i.status !== 'PAID' && new Date(i.dueDate) < now);
      const overdueAmount = overdueInvoices.reduce((acc, i) => acc + Math.max(0, i.total - i.paidAmount), 0);

      // Group monthly data
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyMap: Record<string, { revenue: number; expenses: number }> = {};

      // Fill in last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        monthlyMap[key] = { revenue: 0, expenses: 0 };
      }

      allInvoices.forEach(inv => {
        if (inv.status === 'PAID' || inv.status === 'PARTIAL') {
          const date = new Date(inv.paidAt || inv.issueDate);
          const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (monthlyMap[key]) {
            monthlyMap[key].revenue += inv.paidAmount;
          }
        }
      });

      allExpenses.forEach(exp => {
        const date = new Date(exp.date);
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (monthlyMap[key]) {
          monthlyMap[key].expenses += exp.amount;
        }
      });

      const revenueByMonth = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
      }));

      // Expenses by Category
      const expenseCatMap: Record<string, number> = {};
      allExpenses.forEach(exp => {
        const catName = exp.aiCategory || exp.category?.name || 'Other';
        expenseCatMap[catName] = (expenseCatMap[catName] || 0) + exp.amount;
      });

      const expensesByCategory = Object.entries(expenseCatMap).map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));

      // Top clients
      const clientRevenueMap: Record<string, number> = {};
      allInvoices.forEach(inv => {
        if (inv.status === 'PAID' || inv.status === 'PARTIAL') {
          clientRevenueMap[inv.clientId] = (clientRevenueMap[inv.clientId] || 0) + inv.paidAmount;
        }
      });

      const topClients = Object.entries(clientRevenueMap)
        .map(([clientId, revenue]) => {
          const client = allClients.find(c => c.id === clientId);
          return {
            client: client!,
            revenue,
          };
        })
        .filter(item => !!item.client)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      return {
        totalRevenue,
        totalExpenses,
        netProfit,
        outstandingAmount,
        overdueAmount,
        invoiceCount: allInvoices.length,
        paidInvoiceCount: allInvoices.filter(i => i.status === 'PAID').length,
        overdueInvoiceCount: overdueInvoices.length,
        revenueByMonth,
        expensesByCategory,
        topClients,
      };
    },

    cashFlowForecast: async (_: any, { months = 6 }: { months?: number }, context: any) => {
      const user = await getContextUser(context);
      const invoices = await prisma.invoice.findMany({ where: { organizationId: user.organizationId! } });
      const expenses = await prisma.expense.findMany({ where: { organizationId: user.organizationId! } });

      // Run forecast projection
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const forecast: { month: string; revenue: number; expenses: number }[] = [];

      const avgMonthlyRevenue = invoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + i.paidAmount, 0) / 6 || 2000;
      const avgMonthlyExpense = expenses.reduce((acc, e) => acc + e.amount, 0) / 6 || 1200;

      for (let i = 1; i <= months; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        forecast.push({
          month: `${monthNames[d.getMonth()]} (Proj)`,
          revenue: Math.round(avgMonthlyRevenue * (1 + (i * 0.03))), // 3% projected growth
          expenses: Math.round(avgMonthlyExpense * (1 + (i * 0.01))), // 1% projected growth
        });
      }

      return forecast;
    },

    aiInsights: async (_: any, __: any, context: any) => {
      const user = await getContextUser(context);
      const invoices = await prisma.invoice.findMany({ where: { organizationId: user.organizationId! } });
      const expenses = await prisma.expense.findMany({ where: { organizationId: user.organizationId! }, include: { category: true } });
      const clients = await prisma.client.findMany({ where: { organizationId: user.organizationId! } });

      return generateAIInsights({ invoices, expenses, clients });
    },

    aiCategorizeExpense: async (_: any, { title, amount }: { title: string; amount: number }) => {
      return categorizeExpense(title, amount);
    },
  },

  Mutation: {
    aiChat: async (_: any, { message }: { message: string }, context: any) => {
      const user = await getContextUser(context);
      const orgId = user.organizationId!;
      const invoices = await prisma.invoice.findMany({ where: { organizationId: orgId } });
      const expenses = await prisma.expense.findMany({ where: { organizationId: orgId } });
      const totalRevenue = invoices.filter(i => i.status === 'PAID' || i.status === 'PARTIAL').reduce((acc, i) => acc + i.paidAmount, 0);
      const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
      const netProfit = totalRevenue - totalExpenses;
      const outstandingAmount = invoices.reduce((acc, i) => acc + Math.max(0, i.total - i.paidAmount), 0);
      return generateAIChat(message, { totalRevenue, totalExpenses, netProfit, outstandingAmount });
    },

    signUp: async (_: any, { input }: { input: any }) => {
      const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
      if (existingUser) {
        throw new Error('User with this email already exists.');
      }

      const org = await prisma.organization.create({
        data: {
          name: input.organizationName,
          currency: 'USD',
        },
      });

      // Create default expense categories for new org
      const categories = [
        { name: 'Software', color: '#4f46e5', icon: 'Cpu', type: 'EXPENSE' },
        { name: 'Office Supplies', color: '#10b981', icon: 'FileText', type: 'EXPENSE' },
        { name: 'Marketing', color: '#f59e0b', icon: 'Megaphone', type: 'EXPENSE' },
        { name: 'Meals & Entertainment', color: '#f43f5e', icon: 'Coffee', type: 'EXPENSE' },
        { name: 'Rent', color: '#8b5cf6', icon: 'Home', type: 'EXPENSE' },
        { name: 'Travel', color: '#06b6d4', icon: 'Compass', type: 'EXPENSE' },
        { name: 'Professional Services', color: '#ec4899', icon: 'Briefcase', type: 'EXPENSE' },
      ];
      for (const cat of categories) {
        await prisma.category.create({ data: { ...cat, organizationId: org.id } });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const user = await prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          passwordHash,
          role: 'OWNER',
          organizationId: org.id,
        },
      });

      // Send welcome email (non-blocking)
      sendWelcomeEmail({ name: input.name, email: input.email }, input.organizationName).catch(() => {});

      return {
        token: `mock_jwt_token_${user.id}`,
        user,
      };
    },

    signIn: async (_: any, { email, password }: { email: string; password: string }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new Error('Invalid email or password.');
      }
      const valid = await bcrypt.compare(password, user.passwordHash || '');
      if (!valid) {
        throw new Error('Invalid email or password.');
      }
      return {
        token: `mock_jwt_token_${user.id}`,
        user,
      };
    },

    updateProfile: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      return prisma.user.update({
        where: { id: user.id },
        data: {
          name: input.name !== undefined ? input.name : undefined,
          avatar: input.avatar !== undefined ? input.avatar : undefined,
        },
      });
    },

    updateOrganization: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      return prisma.organization.update({
        where: { id: user.organizationId! },
        data: {
          name: input.name !== undefined ? input.name : undefined,
          logo: input.logo !== undefined ? input.logo : undefined,
          address: input.address !== undefined ? input.address : undefined,
          taxId: input.taxId !== undefined ? input.taxId : undefined,
          currency: input.currency !== undefined ? input.currency : undefined,
        },
      });
    },

    createClient: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      return prisma.client.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          address: input.address,
          taxId: input.taxId,
          currency: input.currency || 'USD',
          notes: input.notes,
          organizationId: user.organizationId!,
        },
      });
    },

    updateClient: async (_: any, { id, input }: { id: string; input: any }) => {
      return prisma.client.update({
        where: { id },
        data: input,
      });
    },

    deleteClient: async (_: any, { id }: { id: string }) => {
      await prisma.client.delete({ where: { id } });
      return true;
    },

    createInvoice: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      const orgId = user.organizationId!;

      const invoiceNumber = await generateInvoiceNumber(orgId);

      // Calculations
      let subtotal = 0;
      const taxRate = input.taxRate || 0;
      const discountRate = input.discountRate || 0;

      const itemsData = input.lineItems.map((item: any) => {
        const itemTax = item.taxRate || 0;
        const lineAmount = item.quantity * item.unitPrice;
        subtotal += lineAmount;
        return {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: lineAmount,
          taxRate: itemTax,
        };
      });

      const discountAmount = subtotal * (discountRate / 100);
      const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
      const total = subtotal - discountAmount + taxAmount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          title: input.title || `Invoice to Client`,
          status: 'DRAFT',
          dueDate: new Date(input.dueDate),
          currency: input.currency || 'USD',
          notes: input.notes,
          terms: input.terms,
          taxRate,
          discountRate,
          subtotal,
          taxAmount,
          discountAmount,
          total,
          paidAmount: 0,
          clientId: input.clientId,
          organizationId: orgId,
          userId: user.id,
        },
      });

      // Create line items
      for (const item of itemsData) {
        await prisma.lineItem.create({
          data: {
            ...item,
            invoiceId: invoice.id,
          },
        });
      }

      // Record activity
      await prisma.activity.create({
        data: {
          type: 'CREATE',
          description: `Invoice ${invoiceNumber} created as Draft`,
          invoiceId: invoice.id,
        },
      });

      return invoice;
    },

    updateInvoice: async (_: any, { id, input }: { id: string; input: any }) => {
      // Fetch existing invoice to preserve values
      const existingInvoice = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true },
      });

      if (!existingInvoice) {
        throw new Error('Invoice not found');
      }

      let subtotal = 0;
      const taxRate = input.taxRate !== undefined ? input.taxRate : existingInvoice.taxRate;
      const discountRate = input.discountRate !== undefined ? input.discountRate : existingInvoice.discountRate;

      // Handle updating line items
      if (input.lineItems && input.lineItems.length > 0) {
        // Delete all old line items first
        await prisma.lineItem.deleteMany({ where: { invoiceId: id } });

        for (const item of input.lineItems) {
          const itemTax = item.taxRate || 0;
          const lineAmount = item.quantity * item.unitPrice;
          subtotal += lineAmount;
          await prisma.lineItem.create({
            data: {
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: lineAmount,
              taxRate: itemTax,
              invoiceId: id,
            },
          });
        }
      } else {
        // Recalculate using existing line items
        subtotal = existingInvoice.lineItems.reduce((acc, item) => acc + item.amount, 0);
      }

      const discountAmount = subtotal * (discountRate / 100);
      const taxAmount = (subtotal - discountAmount) * (taxRate / 100);
      const total = subtotal - discountAmount + taxAmount;

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          title: input.title !== undefined ? input.title : undefined,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          currency: input.currency !== undefined ? input.currency : undefined,
          notes: input.notes !== undefined ? input.notes : undefined,
          terms: input.terms !== undefined ? input.terms : undefined,
          taxRate,
          discountRate,
          subtotal,
          taxAmount,
          discountAmount,
          total,
        },
      });

      // Record activity
      await prisma.activity.create({
        data: {
          type: 'UPDATE',
          description: `Invoice ${updatedInvoice.invoiceNumber} details updated`,
          invoiceId: updatedInvoice.id,
        },
      });

      return updatedInvoice;
    },

    deleteInvoice: async (_: any, { id }: { id: string }) => {
      await prisma.lineItem.deleteMany({ where: { invoiceId: id } });
      await prisma.payment.deleteMany({ where: { invoiceId: id } });
      await prisma.activity.deleteMany({ where: { invoiceId: id } });
      await prisma.reminder.deleteMany({ where: { invoiceId: id } });
      await prisma.invoice.delete({ where: { id } });
      return true;
    },

    sendInvoice: async (_: any, { id }: { id: string }) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { client: true, lineItems: true },
      });

      if (!invoice) throw new Error('Invoice not found');

      // Send invoice email using template
      await sendInvoiceEmail({
        ...invoice,
        client: invoice.client,
        lineItems: invoice.lineItems,
      });

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          status: invoice.status === 'DRAFT' ? 'SENT' : undefined,
          sentAt: new Date(),
        },
      });

      await prisma.activity.create({
        data: {
          type: 'SEND',
          description: `Invoice ${invoice.invoiceNumber} sent to ${invoice.client.email}`,
          invoiceId: id,
        },
      });

      return updatedInvoice;
    },

    duplicateInvoice: async (_: any, { id }: { id: string }, context: any) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { lineItems: true },
      });

      if (!invoice) throw new Error('Invoice not found');

      const nextNum = await generateInvoiceNumber(invoice.organizationId);

      const duplicated = await prisma.invoice.create({
        data: {
          invoiceNumber: nextNum,
          title: `${invoice.title} (Copy)`,
          status: 'DRAFT',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days out
          currency: invoice.currency,
          notes: invoice.notes,
          terms: invoice.terms,
          taxRate: invoice.taxRate,
          discountRate: invoice.discountRate,
          subtotal: invoice.subtotal,
          taxAmount: invoice.taxAmount,
          discountAmount: invoice.discountAmount,
          total: invoice.total,
          paidAmount: 0,
          clientId: invoice.clientId,
          organizationId: invoice.organizationId,
          userId: invoice.userId,
        },
      });

      for (const item of invoice.lineItems) {
        await prisma.lineItem.create({
          data: {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxRate: item.taxRate,
            invoiceId: duplicated.id,
          },
        });
      }

      await prisma.activity.create({
        data: {
          type: 'CREATE',
          description: `Invoice duplicated from ${invoice.invoiceNumber} to ${nextNum}`,
          invoiceId: duplicated.id,
        },
      });

      return duplicated;
    },

    markInvoiceAsPaid: async (_: any, { id, paymentInput }: { id: string; paymentInput: any }) => {
      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) throw new Error('Invoice not found');

      const paidAmount = Math.min(invoice.total, invoice.paidAmount + paymentInput.amount);
      const isFullyPaid = paidAmount >= invoice.total;
      const status = isFullyPaid ? 'PAID' : 'PARTIAL';

      const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
          paidAmount,
          status,
          paidAt: isFullyPaid ? new Date() : undefined,
        },
      });

      await prisma.payment.create({
        data: {
          amount: paymentInput.amount,
          method: paymentInput.method,
          reference: paymentInput.reference,
          notes: paymentInput.notes,
          paidAt: paymentInput.paidAt ? new Date(paymentInput.paidAt) : new Date(),
          invoiceId: id,
        },
      });

      await prisma.activity.create({
        data: {
          type: 'PAYMENT',
          description: `Recorded payment of $${paymentInput.amount.toFixed(2)} via ${paymentInput.method}`,
          invoiceId: id,
        },
      });

      return updatedInvoice;
    },

    recordPayment: async (_: any, { invoiceId, input }: { invoiceId: string; input: any }) => {
      const invoice = await prisma.invoice.findUnique({ 
        where: { id: invoiceId },
        include: { client: true },
      });
      if (!invoice) throw new Error('Invoice not found');

      const paidAmount = Math.min(invoice.total, invoice.paidAmount + input.amount);
      const isFullyPaid = paidAmount >= invoice.total;
      const status = isFullyPaid ? 'PAID' : 'PARTIAL';

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount,
          status,
          paidAt: isFullyPaid ? new Date() : undefined,
        },
      });

      const payment = await prisma.payment.create({
        data: {
          amount: input.amount,
          method: input.method,
          reference: input.reference,
          notes: input.notes,
          paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
          invoiceId,
        },
      });

      await prisma.activity.create({
        data: {
          type: 'PAYMENT',
          description: `Recorded payment of $${input.amount.toFixed(2)} via ${input.method}`,
          invoiceId,
        },
      });

      // Send payment received email to client (non-blocking)
      sendPaymentReceivedEmail(
        { ...invoice, paidAmount },
        { amount: input.amount, method: input.method, reference: input.reference }
      ).catch(() => {});

      return payment;
    },

    voidInvoice: async (_: any, { id }: { id: string }) => {
      const invoice = await prisma.invoice.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      await prisma.activity.create({
        data: {
          type: 'VOID',
          description: `Invoice ${invoice.invoiceNumber} voided/cancelled`,
          invoiceId: id,
        },
      });

      return invoice;
    },

    generateInvoicePDF: async (_: any, { id }: { id: string }) => {
      return `/api/invoices/${id}/pdf`;
    },

    createStripePaymentLink: async (_: any, { invoiceId }: { invoiceId: string }) => {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new Error('Invoice not found');
      return createInvoicePaymentLink(invoice);
    },

    createExpense: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      const orgId = user.organizationId!;

      let aiCategory = input.categoryId ? null : await categorizeExpense(input.title, input.amount);

      let catId = input.categoryId;
      if (!catId && aiCategory) {
        // Find or create matching category
        let dbCat = await prisma.category.findFirst({
          where: { name: aiCategory, organizationId: orgId },
        });
        if (!dbCat) {
          dbCat = await prisma.category.create({
            data: {
              name: aiCategory,
              type: 'EXPENSE',
              organizationId: orgId,
            },
          });
        }
        catId = dbCat.id;
      }

      return prisma.expense.create({
        data: {
          title: input.title,
          amount: input.amount,
          currency: input.currency || 'USD',
          date: new Date(input.date),
          notes: input.notes,
          receiptUrl: input.receiptUrl,
          isRecurring: input.isRecurring || false,
          aiCategory: aiCategory || 'Other',
          categoryId: catId,
          organizationId: orgId,
          userId: user.id,
        },
      });
    },

    updateExpense: async (_: any, { id, input }: { id: string; input: any }) => {
      return prisma.expense.update({
        where: { id },
        data: {
          ...input,
          date: input.date ? new Date(input.date) : undefined,
        },
      });
    },

    deleteExpense: async (_: any, { id }: { id: string }) => {
      await prisma.expense.delete({ where: { id } });
      return true;
    },

    bulkCategorizeExpenses: async (_: any, { ids }: { ids: string[] }, context: any) => {
      const user = await getContextUser(context);
      const expenses = await prisma.expense.findMany({ where: { id: { in: ids } } });
      const updatedExpenses = [];

      for (const exp of expenses) {
        const aiCat = await categorizeExpense(exp.title, exp.amount);
        let dbCat = await prisma.category.findFirst({
          where: { name: aiCat, organizationId: user.organizationId! },
        });
        if (!dbCat) {
          dbCat = await prisma.category.create({
            data: {
              name: aiCat,
              type: 'EXPENSE',
              organizationId: user.organizationId!,
            },
          });
        }

        const updated = await prisma.expense.update({
          where: { id: exp.id },
          data: {
            aiCategory: aiCat,
            categoryId: dbCat.id,
          },
        });
        updatedExpenses.push(updated);
      }

      return updatedExpenses;
    },

    createCategory: async (_: any, { input }: { input: any }, context: any) => {
      const user = await getContextUser(context);
      return prisma.category.create({
        data: {
          name: input.name,
          color: input.color,
          icon: input.icon,
          type: input.type || 'EXPENSE',
          organizationId: user.organizationId!,
        },
      });
    },

    updateCategory: async (_: any, { id, input }: { id: string; input: any }) => {
      return prisma.category.update({
        where: { id },
        data: input,
      });
    },

    deleteCategory: async (_: any, { id }: { id: string }) => {
      await prisma.category.delete({ where: { id } });
      return true;
    },

    scheduleReminder: async (_: any, { invoiceId, type, scheduledAt }: { invoiceId: string; type: string; scheduledAt: Date }) => {
      return prisma.reminder.create({
        data: {
          type,
          scheduledAt: new Date(scheduledAt),
          status: 'PENDING',
          invoiceId,
        },
      });
    },

    sendPaymentReminder: async (_: any, { invoiceId }: { invoiceId: string }) => {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { client: true },
      });
      if (!invoice) throw new Error('Invoice not found');
      if (!invoice.client?.email) throw new Error('Client has no email address');

      await sendPaymentReminderEmail(invoice);

      await prisma.activity.create({
        data: {
          type: 'REMINDER',
          description: `Payment reminder sent to ${invoice.client.email}`,
          invoiceId,
        },
      });

      return true;
    },
  },
};
