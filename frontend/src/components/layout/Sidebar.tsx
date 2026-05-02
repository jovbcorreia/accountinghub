import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package, FileText, Receipt,
  CreditCard, BookOpen, Scale, BarChart3, Landmark, Settings, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { toast } from '@/hooks/useToast';
import { LogoIcon } from '@/components/ui/logo';

const NAV_MAIN = [
  { to: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { to: '/customers',  label: 'Customers',         icon: Users },
  { to: '/suppliers',  label: 'Suppliers',          icon: Truck },
  { to: '/products',   label: 'Products',           icon: Package },
  { to: '/invoices',   label: 'Invoices',           icon: FileText },
  { to: '/expenses',   label: 'Expenses',           icon: Receipt },
  { to: '/payments',   label: 'Payments',           icon: CreditCard },
];

const NAV_ACCOUNTING = [
  { to: '/accounts',   label: 'Chart of Accounts', icon: BookOpen },
  { to: '/journal',    label: 'Journal',            icon: Scale },
  { to: '/reports',    label: 'Reports',            icon: BarChart3 },
  { to: '/bank',       label: 'Bank',               icon: Landmark },
];

function NavItem({ to, label, icon: Icon }: { to: string; label: string; icon: React.ElementType }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
        isActive
          ? 'bg-brand-orange text-white shadow-sm'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { company, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await authApi.logout();
    clearAuth();
    navigate('/login');
    toast({ title: 'Signed out' });
  }

  return (
    <aside className="flex flex-col w-64 bg-brand-charcoal h-screen sticky top-0 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <LogoIcon size={34} />
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-none truncate">AccountingHub</p>
          <p className="text-white/40 text-xs mt-0.5 truncate">{company?.name || 'Accounting'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_MAIN.map(item => <NavItem key={item.to} {...item} />)}

        <div className="pt-4 pb-1 px-3">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">Accounting</p>
        </div>

        {NAV_ACCOUNTING.map(item => <NavItem key={item.to} {...item} />)}

        <div className="pt-4 pb-1 px-3">
          <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">System</p>
        </div>

        <NavItem to="/settings" label="Settings" icon={Settings} />
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
