export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
}

export interface Company {
  id: string;
  name: string;
  taxId?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  logo?: string;
  iban?: string;
  currency: string;
  fiscalYear?: number;
}

export interface Customer {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
  invoices?: InvoiceSummary[];
}

export interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country: string;
  notes?: string;
  createdAt: string;
}

export interface TaxRate {
  id: string;
  name: string;
  rate: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  taxRateId: string;
  taxRate?: TaxRate;
  category?: string;
  stock?: number;
}

export interface InvoiceLine {
  id?: string;
  productId?: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';
export type DocumentType = 'INVOICE' | 'RECEIPT' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'QUOTE' | 'PROFORMA';

export interface Invoice {
  id: string;
  number: string;
  type: DocumentType;
  status: InvoiceStatus;
  customerId: string;
  customer?: Customer;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  notes?: string;
  payments?: Payment[];
  createdAt: string;
}

export interface InvoiceSummary {
  id: string;
  number: string;
  status: InvoiceStatus;
  total: number;
  dueDate: string;
  issueDate: string;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH' | 'MBWAY' | 'CHECK';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference?: string;
  notes?: string;
}

export type ExpenseStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface ExpenseLine {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  accountId?: string;
  total: number;
}

export interface Expense {
  id: string;
  supplierId?: string;
  supplier?: Supplier;
  number?: string;
  date: string;
  dueDate?: string;
  status: ExpenseStatus;
  lines: ExpenseLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  createdAt: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  children?: Account[];
}

export interface JournalLine {
  accountId: string;
  account?: Account;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  reference?: string;
  lines: JournalLine[];
  createdAt: string;
  createdBy: string;
}

export interface BankAccount {
  id: string;
  name: string;
  iban?: string;
  currency: string;
  balance: number;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  balance: number;
  reconciled: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardData {
  kpis: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    monthlyProfit: number;
    accountsReceivable: number;
    overdueInvoices: number;
    ytdRevenue: number;
    ytdExpenses: number;
  };
  recentInvoices: Invoice[];
  chartData: { month: string; revenue: number; expenses: number }[];
}
