import { useState, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import { accountsApi } from '@/services/api';
import { Account, AccountType } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const TYPE_BADGE: Record<AccountType, { label: string; variant: 'info' | 'warning' | 'success' | 'destructive' | 'outline' }> = {
  ASSET:     { label: 'Asset',     variant: 'info' },
  LIABILITY: { label: 'Liability', variant: 'warning' },
  EQUITY:    { label: 'Equity',    variant: 'success' },
  REVENUE:   { label: 'Revenue',   variant: 'success' },
  EXPENSE:   { label: 'Expense',   variant: 'destructive' },
};

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(2, 'Name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { type: 'ASSET' },
  });

  async function load() {
    setLoading(true);
    try { const r = await accountsApi.list(); setAccounts(r); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSeedSNC() {
    setSeeding(true);
    try { const r = await accountsApi.seedSNC(); toast({ title: r.message || 'SNC accounts created' }); load(); }
    catch { toast({ title: 'Failed to import SNC', variant: 'destructive' }); }
    finally { setSeeding(false); }
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await accountsApi.create({ ...values, parentId: values.parentId || null });
      toast({ title: 'Account created' }); setModalOpen(false); load();
    } catch { toast({ title: 'Failed to create', variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  const filtered = search
    ? accounts.filter(a => a.code.includes(search) || a.name.toLowerCase().includes(search.toLowerCase()))
    : accounts;

  const rootAccounts = accounts.filter(a => !a.parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-charcoal">Chart of Accounts</h1>
          <p className="text-sm text-brand-charcoal/40 mt-0.5">SNC — Portuguese Accounting Standards</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeedSNC} disabled={seeding}>
            <Download className="h-3.5 w-3.5 mr-1.5" />{seeding ? 'Importing…' : 'Import SNC'}
          </Button>
          <Button size="sm" onClick={() => { reset({ code: '', name: '', type: 'ASSET' }); setModalOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Account
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <input
          placeholder="Search accounts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-brand-grey bg-white pl-3 pr-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-11 bg-white rounded-lg border border-brand-grey animate-pulse" />
        ))}</div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card p-16 text-center">
          <p className="text-sm text-brand-charcoal/40 mb-3">No accounts yet.</p>
          <Button onClick={handleSeedSNC} disabled={seeding}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Import SNC Chart of Accounts
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-grey bg-brand-cream text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40">
                <th className="text-left px-6 py-3">Code</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-6 py-3">Type</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const t = TYPE_BADGE[a.type];
                const depth = a.code.length <= 1 ? 0 : a.code.length <= 2 ? 1 : 2;
                return (
                  <tr key={a.id} className="border-t border-brand-grey hover:bg-orange-50 transition-colors">
                    <td className="px-6 py-2.5">
                      <span className="font-mono text-xs font-semibold bg-brand-cream text-brand-charcoal px-2 py-0.5 rounded">{a.code}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{ paddingLeft: `${16 + depth * 20}px` }}>
                      {depth > 0 && <span className="text-brand-charcoal/20 mr-1.5">└</span>}
                      <span className={depth === 0 ? 'font-bold text-brand-charcoal' : 'font-medium text-brand-charcoal/80'}>{a.name}</span>
                    </td>
                    <td className="px-6 py-2.5"><Badge variant={t.variant}>{t.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Account</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code *</Label><Input {...register('code')} placeholder="21" />
                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Controller name="type" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(TYPE_BADGE) as [AccountType, typeof TYPE_BADGE[AccountType]][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label><Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Parent Account</Label>
                <Controller name="parentId" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={v => field.onChange(v === 'ROOT' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="Root (no parent)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ROOT">Root</SelectItem>
                      {rootAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
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
