import { useState, useEffect } from 'react';
import { reportsApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const YEARS = [2024, 2025, 2026];

export default function ReportsPage() {
  const [tab, setTab] = useState<'pl' | 'trial' | 'vat'>('pl');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState('');
  const [plData, setPlData] = useState<{
    revenue: { total: number; subtotal: number; tax: number };
    expenses: { total: number; subtotal: number };
    profit: number;
  } | null>(null);
  const [trialData, setTrialData] = useState<{
    rows: { code: string; name: string; type: string; debit: number; credit: number; balance: number }[];
    totalDebit: number; totalCredit: number;
  } | null>(null);
  const [vatData, setVatData] = useState<{
    outputVAT: { rate: number; base: number; tax: number }[];
    inputVAT:  { rate: number; base: number; tax: number }[];
    totalOutput: number; totalInput: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadReport() {
    setLoading(true);
    try {
      if (tab === 'pl')    setPlData(await reportsApi.profitLoss({ year }));
      else if (tab === 'trial') setTrialData(await reportsApi.trialBalance());
      else setVatData(await reportsApi.vat({ year, ...(quarter ? { quarter: quarter.replace('Q', '') } : {}) }));
    } finally { setLoading(false); }
  }
  useEffect(() => { loadReport(); }, [tab, year, quarter]);

  const TABS = [{ id: 'pl', label: 'P&L' }, { id: 'trial', label: 'Trial Balance' }, { id: 'vat', label: 'VAT Report' }];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Reports</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Financial statements and tax reports</p>
      </div>

      {/* Tab bar + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-white border border-brand-grey rounded-lg p-1 gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all
                ${tab === t.id ? 'bg-brand-orange text-white shadow-sm' : 'text-brand-charcoal/50 hover:text-brand-charcoal'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-9 w-24 text-xs border-brand-grey"><SelectValue /></SelectTrigger>
            <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
          {tab === 'vat' && (
            <Select value={quarter || 'ALL'} onValueChange={v => setQuarter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="h-9 w-28 text-xs border-brand-grey"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Annual</SelectItem>
                {['Q1','Q2','Q3','Q4'].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card p-16 text-center text-brand-charcoal/40 text-sm">
          Loading report…
        </div>
      ) : (
        <>
          {/* P&L */}
          {tab === 'pl' && plData && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
              <div className="lg:col-span-2 bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
                  <h2 className="text-sm font-bold text-brand-charcoal">Profit & Loss — {year}</h2>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Revenue</p>
                    <div className="flex justify-between text-sm text-brand-charcoal/60"><span>Sales (excl. VAT)</span><span className="font-medium text-brand-charcoal">{formatCurrency(plData.revenue.subtotal)}</span></div>
                    <div className="flex justify-between text-sm text-brand-charcoal/60"><span>Output VAT</span><span className="font-medium text-brand-charcoal">{formatCurrency(plData.revenue.tax)}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t border-brand-grey"><span>Total Revenue</span><span className="text-green-600">{formatCurrency(plData.revenue.total)}</span></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Expenses</p>
                    <div className="flex justify-between text-sm text-brand-charcoal/60"><span>Expenses (excl. VAT)</span><span className="font-medium text-brand-charcoal">{formatCurrency(plData.expenses.subtotal)}</span></div>
                    <div className="flex justify-between font-bold pt-2 border-t border-brand-grey"><span>Total Expenses</span><span className="text-red-500">{formatCurrency(plData.expenses.total)}</span></div>
                  </div>
                  <div className="border-t-2 border-brand-charcoal/20 pt-4 flex justify-between text-lg font-bold">
                    <span className="text-brand-charcoal">Net Profit</span>
                    <span className={plData.profit >= 0 ? 'text-brand-orange' : 'text-red-500'}>{formatCurrency(plData.profit)}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3 bg-white rounded-xl border border-brand-grey shadow-card p-6">
                <h2 className="text-sm font-bold text-brand-charcoal mb-1">Breakdown</h2>
                <p className="text-xs text-brand-charcoal/40 mb-4">Revenue vs Expenses</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Revenue',  value: plData.revenue.total },
                      { name: 'Expenses', value: plData.expenses.total },
                    ]} dataKey="value" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      <Cell fill="#f97316" /><Cell fill="#fdba74" />
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={{ background: '#2d2b29', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Trial Balance */}
          {tab === 'trial' && trialData && (
            <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream flex items-center justify-between">
                <h2 className="text-sm font-bold text-brand-charcoal">Trial Balance</h2>
                <Badge variant={Math.abs(trialData.totalDebit - trialData.totalCredit) < 0.01 ? 'success' : 'destructive'}>
                  {Math.abs(trialData.totalDebit - trialData.totalCredit) < 0.01 ? 'Balanced ✓' : 'Unbalanced'}
                </Badge>
              </div>
              {trialData.rows.length === 0 ? (
                <p className="text-center p-12 text-sm text-brand-charcoal/40">No data. Create journal entries first.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-grey text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40">
                      <th className="text-left px-6 py-3">Code</th>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-right px-4 py-3">Debit</th>
                      <th className="text-right px-4 py-3">Credit</th>
                      <th className="text-right px-6 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trialData.rows.map(r => (
                      <tr key={r.code} className="border-t border-brand-grey hover:bg-orange-50 transition-colors">
                        <td className="px-6 py-2.5 font-mono text-xs text-brand-charcoal/60">{r.code}</td>
                        <td className="px-4 py-2.5 font-medium text-brand-charcoal">{r.name}</td>
                        <td className="text-right px-4 py-2.5 text-brand-charcoal/60">{formatCurrency(r.debit)}</td>
                        <td className="text-right px-4 py-2.5 text-brand-charcoal/60">{formatCurrency(r.credit)}</td>
                        <td className={`text-right px-6 py-2.5 font-bold ${r.balance >= 0 ? 'text-brand-charcoal' : 'text-red-500'}`}>
                          {formatCurrency(r.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-brand-charcoal/20 bg-brand-cream font-bold text-sm">
                      <td colSpan={2} className="px-6 py-3 text-brand-charcoal">Total</td>
                      <td className="text-right px-4 py-3 text-brand-charcoal">{formatCurrency(trialData.totalDebit)}</td>
                      <td className="text-right px-4 py-3 text-brand-charcoal">{formatCurrency(trialData.totalCredit)}</td>
                      <td className="px-6 py-3" />
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* VAT */}
          {tab === 'vat' && vatData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { title: 'Output VAT (Sales)',     data: vatData.outputVAT, total: vatData.totalOutput, color: 'text-brand-orange' },
                  { title: 'Input VAT (Purchases)', data: vatData.inputVAT,  total: vatData.totalInput,  color: 'text-blue-600' },
                ].map(section => (
                  <div key={section.title} className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
                      <h2 className="text-sm font-bold text-brand-charcoal">{section.title}</h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-brand-grey text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40">
                          <th className="text-left px-6 py-3">Rate</th>
                          <th className="text-right px-4 py-3">Base</th>
                          <th className="text-right px-6 py-3">VAT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.map(r => (
                          <tr key={r.rate} className="border-t border-brand-grey hover:bg-orange-50">
                            <td className="px-6 py-3 font-bold text-brand-orange">{r.rate}%</td>
                            <td className="text-right px-4 py-3 text-brand-charcoal/60">{formatCurrency(r.base)}</td>
                            <td className="text-right px-6 py-3 font-bold text-brand-charcoal">{formatCurrency(r.tax)}</td>
                          </tr>
                        ))}
                        <tr className="border-t-2 border-brand-charcoal/20 bg-brand-cream font-bold">
                          <td className="px-6 py-3 text-brand-charcoal">Total</td>
                          <td />
                          <td className={`text-right px-6 py-3 text-lg ${section.color}`}>{formatCurrency(section.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl border border-brand-grey shadow-card px-6 py-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-brand-charcoal/40 font-semibold uppercase tracking-wide">VAT Payable to Tax Authority</p>
                  <p className="text-xs text-brand-charcoal/40 mt-0.5">Output VAT − Input VAT</p>
                </div>
                <span className={`text-2xl font-bold ${vatData.totalOutput - vatData.totalInput >= 0 ? 'text-brand-orange' : 'text-green-600'}`}>
                  {formatCurrency(vatData.totalOutput - vatData.totalInput)}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
