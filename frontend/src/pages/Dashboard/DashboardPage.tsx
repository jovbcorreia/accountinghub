import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { reportsApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { DashboardData, InvoiceStatus } from '@/types';

const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' | 'outline' }> = {
  DRAFT:          { label: 'Draft',      variant: 'secondary' },
  ISSUED:         { label: 'Issued',     variant: 'info' },
  PAID:           { label: 'Paid',       variant: 'success' },
  PARTIALLY_PAID: { label: 'Partial',    variant: 'warning' },
  OVERDUE:        { label: 'Overdue',    variant: 'destructive' },
  CANCELLED:      { label: 'Cancelled',  variant: 'outline' },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-charcoal text-white rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
      ))}
    </div>
  );
};

function KPICard({
  title, value, sub, icon: Icon, color,
}: {
  title: string; value: string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-grey shadow-card p-5 flex items-start gap-4 relative overflow-hidden">
      {/* orange left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange rounded-l-xl" />
      <div className="flex-1 pl-2">
        <p className="text-xs font-semibold text-brand-charcoal/40 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-brand-charcoal mt-1">{value}</p>
        {sub && <p className="text-xs text-brand-charcoal/40 mt-1">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.dashboard().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-brand-grey h-28 animate-pulse" />
        ))}
      </div>
    </div>
  );

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Dashboard</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Financial summary · {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Overdue alert */}
      {(kpis?.overdueInvoices ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-brand-cream border-l-4 border-brand-orange rounded-r-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-brand-orange flex-shrink-0" />
          <p className="text-sm text-brand-charcoal">
            You have <span className="font-bold text-brand-orange">{kpis?.overdueInvoices}</span> overdue invoice{(kpis?.overdueInvoices ?? 0) > 1 ? 's' : ''}.
            <Link to="/invoices?status=OVERDUE" className="ml-2 text-brand-orange underline underline-offset-2">View</Link>
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Monthly Revenue"
          value={formatCurrency(kpis?.monthlyRevenue || 0)}
          sub={`YTD ${formatCurrency(kpis?.ytdRevenue || 0)}`}
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
        />
        <KPICard
          title="Monthly Expenses"
          value={formatCurrency(kpis?.monthlyExpenses || 0)}
          sub={`YTD ${formatCurrency(kpis?.ytdExpenses || 0)}`}
          icon={TrendingDown}
          color="bg-red-50 text-red-500"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(kpis?.monthlyProfit || 0)}
          icon={DollarSign}
          color={(kpis?.monthlyProfit ?? 0) >= 0 ? 'bg-orange-50 text-brand-orange' : 'bg-red-50 text-red-500'}
        />
        <KPICard
          title="Accounts Receivable"
          value={formatCurrency(kpis?.accountsReceivable || 0)}
          sub={(kpis?.overdueInvoices ?? 0) > 0 ? `${kpis?.overdueInvoices} overdue` : 'All current'}
          icon={(kpis?.overdueInvoices ?? 0) > 0 ? AlertTriangle : Clock}
          color={(kpis?.overdueInvoices ?? 0) > 0 ? 'bg-orange-50 text-brand-orange' : 'bg-blue-50 text-blue-500'}
        />
      </div>

      {/* Chart + Recent Invoices */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-brand-grey shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-brand-charcoal">Revenue vs Expenses</h2>
              <p className="text-xs text-brand-charcoal/40 mt-0.5">Last 12 months</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-brand-charcoal/50">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-orange inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-peach inline-block" />Expenses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.chartData || []} barCategoryGap="30%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2de" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(249,115,22,0.06)' }} />
              <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#fdba74" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-brand-grey shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-brand-charcoal">Recent Invoices</h2>
              <p className="text-xs text-brand-charcoal/40 mt-0.5">Latest documents</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-brand-orange text-xs">
              <Link to="/invoices">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>

          {!data?.recentInvoices?.length ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-brand-charcoal/20" />
              </div>
              <p className="text-xs text-brand-charcoal/40">No invoices yet</p>
              <Button asChild size="sm" className="mt-1">
                <Link to="/invoices/new">Create invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {data?.recentInvoices?.map(inv => {
                const st = STATUS_BADGE[inv.status];
                return (
                  <Link
                    key={inv.id}
                    to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-semibold text-brand-charcoal group-hover:text-brand-orange transition-colors">{inv.number}</p>
                      <p className="text-xs text-brand-charcoal/40">{(inv.customer as { name?: string })?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={st.variant}>{st.label}</Badge>
                      <p className="text-sm font-bold text-brand-charcoal">{formatCurrency(Number(inv.total))}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'YTD Revenue',  value: formatCurrency(kpis?.ytdRevenue || 0),   color: 'text-green-600' },
          { label: 'YTD Expenses', value: formatCurrency(kpis?.ytdExpenses || 0),  color: 'text-red-500' },
          { label: 'YTD Profit',   value: formatCurrency((kpis?.ytdRevenue || 0) - (kpis?.ytdExpenses || 0)), color: 'text-brand-orange' },
          { label: 'Overdue',      value: `${kpis?.overdueInvoices || 0} invoice${(kpis?.overdueInvoices || 0) !== 1 ? 's' : ''}`, color: (kpis?.overdueInvoices ?? 0) > 0 ? 'text-red-500' : 'text-brand-charcoal/40' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-brand-grey shadow-card px-4 py-3">
            <p className="text-xs text-brand-charcoal/40 font-medium">{s.label}</p>
            <p className={`text-base font-bold mt-0.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
