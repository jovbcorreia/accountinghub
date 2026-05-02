import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config;
    // Never intercept auth endpoints — avoids reload loops on /auth/me and /auth/refresh
    if (original.url?.startsWith('/auth/')) {
      return Promise.reject(err);
    }
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        return api(original);
      } catch {
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  register: (data: { companyName: string; taxId: string; email: string; password: string; name: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

// Customers
export const customersApi = {
  list: (params?: Record<string, unknown>) => api.get('/customers', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/customers', data).then(r => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/customers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/customers/${id}`).then(r => r.data),
};

// Suppliers
export const suppliersApi = {
  list: (params?: Record<string, unknown>) => api.get('/suppliers', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/suppliers', data).then(r => r.data),
  get: (id: string) => api.get(`/suppliers/${id}`).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/suppliers/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/suppliers/${id}`).then(r => r.data),
};

// Products
export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/products', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/products', data).then(r => r.data),
  get: (id: string) => api.get(`/products/${id}`).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/products/${id}`).then(r => r.data),
};

// Invoices
export const invoicesApi = {
  list: (params?: Record<string, unknown>) => api.get('/invoices', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/invoices', data).then(r => r.data),
  get: (id: string) => api.get(`/invoices/${id}`).then(r => r.data),
  issue: (id: string) => api.post(`/invoices/${id}/issue`).then(r => r.data),
  cancel: (id: string) => api.post(`/invoices/${id}/cancel`).then(r => r.data),
  registerPayment: (id: string, data: unknown) => api.post(`/invoices/${id}/payment`, data).then(r => r.data),
  getPdf: (id: string) => api.get(`/invoices/${id}/pdf`).then(r => r.data),
  sendEmail: (id: string) => api.post(`/invoices/${id}/send-email`).then(r => r.data),
};

// Expenses
export const expensesApi = {
  list: (params?: Record<string, unknown>) => api.get('/expenses', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/expenses', data).then(r => r.data),
  get: (id: string) => api.get(`/expenses/${id}`).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/expenses/${id}`, data).then(r => r.data),
  markPaid: (id: string) => api.post(`/expenses/${id}/pay`).then(r => r.data),
  delete: (id: string) => api.delete(`/expenses/${id}`).then(r => r.data),
};

// Accounts
export const accountsApi = {
  list: () => api.get('/accounts').then(r => r.data),
  create: (data: unknown) => api.post('/accounts', data).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/accounts/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/accounts/${id}`).then(r => r.data),
  seedSNC: () => api.post('/accounts/seed-snc').then(r => r.data),
};

// Journal
export const journalApi = {
  list: (params?: Record<string, unknown>) => api.get('/journal', { params }).then(r => r.data),
  create: (data: unknown) => api.post('/journal', data).then(r => r.data),
  get: (id: string) => api.get(`/journal/${id}`).then(r => r.data),
};

// Reports
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard').then(r => r.data),
  trialBalance: () => api.get('/reports/trial-balance').then(r => r.data),
  profitLoss: (params?: Record<string, unknown>) => api.get('/reports/profit-loss', { params }).then(r => r.data),
  vat: (params?: Record<string, unknown>) => api.get('/reports/vat', { params }).then(r => r.data),
};

// Bank
export const bankApi = {
  listAccounts: () => api.get('/bank/accounts').then(r => r.data),
  createAccount: (data: unknown) => api.post('/bank/accounts', data).then(r => r.data),
  listTransactions: (id: string, params?: Record<string, unknown>) =>
    api.get(`/bank/accounts/${id}/transactions`, { params }).then(r => r.data),
  addTransaction: (id: string, data: unknown) =>
    api.post(`/bank/accounts/${id}/transactions`, data).then(r => r.data),
};

// Tax rates
export const taxRatesApi = {
  list: () => api.get('/companies').then(r => r.data),
};

// Company
export const companyApi = {
  get: () => api.get('/companies').then(r => r.data),
  update: (data: unknown) => api.put('/companies', data).then(r => r.data),
};

// Users
export const usersApi = {
  list: () => api.get('/users').then(r => r.data),
  create: (data: unknown) => api.post('/users', data).then(r => r.data),
  update: (id: string, data: unknown) => api.put(`/users/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/users/${id}`).then(r => r.data),
};
