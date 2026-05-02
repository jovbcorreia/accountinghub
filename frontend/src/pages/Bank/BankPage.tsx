import { useState, useEffect, useCallback } from 'react';
import { Plus, Landmark } from 'lucide-react';
import { bankApi } from '@/services/api';
import { BankAccount, BankTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';

const accountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  iban: z.string().optional(),
  currency: z.string().default('EUR'),
  balance: z.coerce.number().default(0),
});
type AccountForm = z.infer<typeof accountSchema>;

export default function BankPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selected, setSelected] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountForm>({ resolver: zodResolver(accountSchema) });

  async function loadAccounts() {
    setLoading(true);
    try { const r = await bankApi.listAccounts(); setAccounts(r); } finally { setLoading(false); }
  }

  const loadTransactions = useCallback(async (id: string) => {
    const r = await bankApi.listTransactions(id);
    setTransactions(r.items);
  }, []);

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { if (selected) loadTransactions(selected.id); }, [selected, loadTransactions]);

  async function onSubmit(values: AccountForm) {
    setSaving(true);
    try {
      await bankApi.createAccount(values);
      toast({ title: 'Account created' }); setModalOpen(false); loadAccounts();
    } catch { toast({ title: 'Failed to create', variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-charcoal">Bank</h1>
          <p className="text-sm text-brand-charcoal/40 mt-0.5">Bank accounts and transactions</p>
        </div>
        <Button size="sm" onClick={() => { reset({ name: '', iban: '', currency: 'EUR', balance: 0 }); setModalOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />New Account
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-brand-grey animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card p-16 text-center">
          <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-3">
            <Landmark className="h-6 w-6 text-brand-charcoal/20" />
          </div>
          <p className="text-sm text-brand-charcoal/40">No bank accounts. Add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map(a => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className={`text-left bg-white rounded-xl border shadow-card p-5 transition-all hover:shadow-card-hover
                ${selected?.id === a.id ? 'border-brand-orange ring-2 ring-brand-orange/20' : 'border-brand-grey'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                  <Landmark className="h-4 w-4 text-brand-orange" />
                </div>
                <Badge variant="outline">{a.currency}</Badge>
              </div>
              <p className="font-bold text-brand-charcoal">{a.name}</p>
              {a.iban && <p className="text-xs text-brand-charcoal/40 font-mono mt-0.5">{a.iban}</p>}
              <p className="text-2xl font-bold text-brand-charcoal mt-3">{formatCurrency(Number(a.balance))}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
            <h2 className="text-sm font-bold text-brand-charcoal">Transactions — {selected.name}</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="text-center py-12 text-sm text-brand-charcoal/40">No transactions for this account.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-grey text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40">
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-4 py-3">Balance</th>
                  <th className="text-center px-6 py-3">Reconciled</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-t border-brand-grey hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-3 text-brand-charcoal/60">{formatDate(t.date)}</td>
                    <td className="px-4 py-3 font-medium text-brand-charcoal">{t.description}</td>
                    <td className={`text-right px-4 py-3 font-bold ${Number(t.amount) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(Number(t.amount))}
                    </td>
                    <td className="text-right px-4 py-3 text-brand-charcoal">{formatCurrency(Number(t.balance))}</td>
                    <td className="text-center px-6 py-3">
                      <Badge variant={t.reconciled ? 'success' : 'outline'}>{t.reconciled ? 'Yes' : 'No'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Bank Account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Name *</Label><Input {...register('name')} placeholder="Current Account" />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>IBAN</Label><Input {...register('iban')} placeholder="PT50 …" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Currency</Label><Input {...register('currency')} defaultValue="EUR" /></div>
              <div className="space-y-1.5"><Label>Opening Balance</Label><Input type="number" step="0.01" {...register('balance')} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
