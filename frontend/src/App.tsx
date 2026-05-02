import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authApi } from './services/api';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { Toaster } from './components/shared/Toaster';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import CustomersPage from './pages/Customers/CustomersPage';
import SuppliersPage from './pages/Suppliers/SuppliersPage';
import ProductsPage from './pages/Products/ProductsPage';
import InvoicesPage from './pages/Invoices/InvoicesPage';
import InvoiceDetailPage from './pages/Invoices/InvoiceDetailPage';
import InvoiceCreatePage from './pages/Invoices/InvoiceCreatePage';
import ExpensesPage from './pages/Expenses/ExpensesPage';
import PaymentsPage from './pages/Payments/PaymentsPage';
import AccountsPage from './pages/Accounts/AccountsPage';
import JournalPage from './pages/Journal/JournalPage';
import ReportsPage from './pages/Reports/ReportsPage';
import BankPage from './pages/Bank/BankPage';
import SettingsPage from './pages/Settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { setAuth, clearAuth, setLoading } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    authApi.me()
      .then(data => setAuth(data.user, data.company))
      .catch(() => { clearAuth(); })
      .finally(() => setLoading(false));
  }, [setAuth, clearAuth, setLoading]);

  return (
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/new" element={<InvoiceCreatePage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="journal" element={<JournalPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="bank" element={<BankPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
