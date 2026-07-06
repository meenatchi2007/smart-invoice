// graphql/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    email: String!
    name: String
    avatar: String
    role: String!
    organization: Organization
    createdAt: DateTime!
  }

  type Organization {
    id: ID!
    name: String!
    logo: String
    address: String
    taxId: String
    currency: String!
    clients: [Client!]!
    invoices: [Invoice!]!
    expenses: [Expense!]!
  }

  type Client {
    id: ID!
    name: String!
    email: String!
    phone: String
    company: String
    address: String
    taxId: String
    currency: String!
    notes: String
    totalInvoiced: Float!
    totalPaid: Float!
    totalOutstanding: Float!
    invoices: [Invoice!]!
    createdAt: DateTime!
  }

  type Invoice {
    id: ID!
    invoiceNumber: String!
    title: String
    status: String!
    issueDate: DateTime!
    dueDate: DateTime!
    currency: String!
    subtotal: Float!
    taxRate: Float!
    taxAmount: Float!
    discountRate: Float!
    discountAmount: Float!
    total: Float!
    paidAmount: Float!
    balance: Float!
    notes: String
    terms: String
    pdfUrl: String
    client: Client!
    lineItems: [LineItem!]!
    payments: [Payment!]!
    activities: [Activity!]!
    isOverdue: Boolean!
    daysPastDue: Int
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type LineItem {
    id: ID!
    description: String!
    quantity: Float!
    unitPrice: Float!
    amount: Float!
    taxRate: Float!
  }

  type Payment {
    id: ID!
    amount: Float!
    method: String!
    reference: String
    notes: String
    paidAt: DateTime!
    stripePaymentId: String
  }

  type Expense {
    id: ID!
    title: String!
    amount: Float!
    currency: String!
    date: DateTime!
    receiptUrl: String
    notes: String
    aiCategory: String
    category: Category
    isRecurring: Boolean!
    createdAt: DateTime!
  }

  type Category {
    id: ID!
    name: String!
    color: String
    icon: String
    type: String!
  }

  type Activity {
    id: ID!
    type: String!
    description: String!
    metadata: JSON
    createdAt: DateTime!
  }

  type Reminder {
    id: ID!
    type: String!
    scheduledAt: DateTime!
    sentAt: DateTime
    status: String!
  }

  # Connection types for pagination
  type ClientConnection {
    items: [Client!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type InvoiceConnection {
    items: [Invoice!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type ExpenseConnection {
    items: [Expense!]!
    totalCount: Int!
    totalPages: Int!
    currentPage: Int!
  }

  type FinancialSummary {
    totalRevenue: Float!
    totalExpenses: Float!
    netProfit: Float!
    outstandingAmount: Float!
    overdueAmount: Float!
    invoiceCount: Int!
    paidInvoiceCount: Int!
    overdueInvoiceCount: Int!
    revenueByMonth: [MonthlyData!]!
    expensesByCategory: [CategoryData!]!
    topClients: [ClientRevenue!]!
  }

  type MonthlyData {
    month: String!
    revenue: Float!
    expenses: Float!
  }

  type CategoryData {
    category: String!
    amount: Float!
    percentage: Float!
  }

  type ClientRevenue {
    client: Client!
    revenue: Float!
  }

  type AIInsight {
    type: String!
    title: String!
    description: String!
    severity: String!
    actionable: Boolean!
    suggestion: String
  }

  type AuthPayload {
    token: String
    user: User!
  }

  enum SortOrder {
    ASC
    DESC
  }

  type Query {
    # Auth
    me: User!
    
    # Clients
    clients(search: String, page: Int, limit: Int): ClientConnection!
    client(id: ID!): Client!
    
    # Invoices
    invoices(
      status: String
      clientId: ID
      dateFrom: DateTime
      dateTo: DateTime
      search: String
      page: Int
      limit: Int
      sortBy: String
      sortOrder: SortOrder
    ): InvoiceConnection!
    invoice(id: ID!): Invoice!
    nextInvoiceNumber: String!
    
    # Expenses
    expenses(
      categoryId: ID
      dateFrom: DateTime
      dateTo: DateTime
      search: String
      page: Int
      limit: Int
    ): ExpenseConnection!
    expense(id: ID!): Expense!
    
    # Categories
    categories(type: String): [Category!]!
    
    # Reports & Analytics
    financialSummary(dateFrom: DateTime, dateTo: DateTime): FinancialSummary!
    cashFlowForecast(months: Int): [MonthlyData!]!
    
    # AI
    aiInsights: [AIInsight!]!
    aiCategorizeExpense(title: String!, amount: Float!): String!
  }

  type Mutation {
    # Auth
    signUp(input: SignUpInput!): AuthPayload!
    signIn(email: String!, password: String!): AuthPayload!
    aiChat(message: String!): String!
    updateProfile(input: UpdateProfileInput!): User!
    
    # Organization
    updateOrganization(input: UpdateOrganizationInput!): Organization!
    
    # Clients
    createClient(input: CreateClientInput!): Client!
    updateClient(id: ID!, input: UpdateClientInput!): Client!
    deleteClient(id: ID!): Boolean!
    
    # Invoices
    createInvoice(input: CreateInvoiceInput!): Invoice!
    updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!
    deleteInvoice(id: ID!): Boolean!
    sendInvoice(id: ID!): Invoice!
    duplicateInvoice(id: ID!): Invoice!
    markInvoiceAsPaid(id: ID!, paymentInput: PaymentInput!): Invoice!
    recordPayment(invoiceId: ID!, input: PaymentInput!): Payment!
    voidInvoice(id: ID!): Invoice!
    generateInvoicePDF(id: ID!): String!
    createStripePaymentLink(invoiceId: ID!): String!
    
    # Expenses
    createExpense(input: CreateExpenseInput!): Expense!
    updateExpense(id: ID!, input: UpdateExpenseInput!): Expense!
    deleteExpense(id: ID!): Boolean!
    bulkCategorizeExpenses(ids: [ID!]!): [Expense!]!
    
    # Categories
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    
    # Reminders
    scheduleReminder(invoiceId: ID!, type: String!, scheduledAt: DateTime!): Reminder!
    sendPaymentReminder(invoiceId: ID!): Boolean!
  }

  # Input types
  input CreateInvoiceInput {
    clientId: ID!
    title: String
    dueDate: DateTime!
    currency: String
    taxRate: Float
    discountRate: Float
    notes: String
    terms: String
    lineItems: [LineItemInput!]!
  }

  input UpdateInvoiceInput {
    clientId: ID
    title: String
    dueDate: DateTime
    currency: String
    taxRate: Float
    discountRate: Float
    notes: String
    terms: String
    lineItems: [LineItemInput!]
    status: String
  }

  input LineItemInput {
    description: String!
    quantity: Float!
    unitPrice: Float!
    taxRate: Float
  }

  input PaymentInput {
    amount: Float!
    method: String!
    reference: String
    notes: String
    paidAt: DateTime
  }

  input CreateClientInput {
    name: String!
    email: String!
    phone: String
    company: String
    address: String
    taxId: String
    currency: String
    notes: String
  }

  input UpdateClientInput {
    name: String
    email: String
    phone: String
    company: String
    address: String
    taxId: String
    currency: String
    notes: String
  }

  input CreateExpenseInput {
    title: String!
    amount: Float!
    currency: String
    date: DateTime!
    categoryId: ID
    notes: String
    receiptUrl: String
    isRecurring: Boolean
  }

  input UpdateExpenseInput {
    title: String
    amount: Float
    currency: String
    date: DateTime
    categoryId: ID
    notes: String
    receiptUrl: String
    isRecurring: Boolean
  }

  input SignUpInput {
    name: String!
    email: String!
    password: String!
    organizationName: String!
  }

  input UpdateProfileInput {
    name: String
    avatar: String
  }

  input UpdateOrganizationInput {
    name: String
    logo: String
    address: String
    taxId: String
    currency: String
  }

  input CreateCategoryInput {
    name: String!
    color: String
    icon: String
    type: String
  }

  input UpdateCategoryInput {
    name: String
    color: String
    icon: String
  }
`;
