import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { journalApi, accountsApi } from '@/services/api';
import { JournalEntry, Account } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency, formatDate } from '@/lib/utils';

const schema = z.object({
  date: z.string().min(1),
  description: z.string().min(1, 'Description is required'),
  reference: z.string().optional(),
  lines: z.array(z.object({
    accountId: z.string().min(1, 'Account is required'),
    debit:  z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
    description: z.string().optional(),
  })).min(2),
});
type FormValues = z.infer<typeof schema>;

export default function JournalPage() {
  const [data, setData] = useState<{ items: JournalEntry[]; total: number; page: number; pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const { register, handleSubmit, reset, control, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, lines: [
      { accountId: '', debit: 0, credit: 0 },
      { accountId: '', debit: 0, credit: 0 },
    ]},
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');

  const totalDebit  = lines.reduce((s, l) => s + Number(l.debit  || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await journalApi.list({ page, pageSize: 20 }); setData(r); } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); accountsApi.list().then(setAccounts); }, [load]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await journalApi.create(values);
      toast({ title: 'Entry created' }); setModalOpen(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create';
      toast({ title: msg, variant: 'destructive' });
    } finally { setSaving(false); }
  }

  const columns: Column<JournalEntry>[] = [
    { key: 'date', header: 'Date', render: r => formatDate(r.date) },
    { key: 'description', header: 'Description',
      render: r => <span className="font-medium text-brand-charcoal">{r.description}</span> },
    { key: 'reference', header: 'Reference', render: r => r.reference || '—' },
    { key: 'lines', header: 'Debit',
      render: r => <span className="font-bold text-brand-charcoal">{formatCurrency((r.lines || []).reduce((s: number, l: { debit: number }) => s + Number(l.debit), 0))}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Journal</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Double-entry accounting journal</p>
      </div>
      <DataTable columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} loading={loading} emptyMessage="No journal entries."
        actions={
          <Button size="sm" onClick={() => {
            reset({ date: today, lines: [{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }] });
            setModalOpen(true);
          }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Entry
          </Button>
        }
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" {...register('date')} /></div>
              <div className="space-y-1.5"><Label>Reference</Label><Input {...register('reference')} /></div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description *</Label><Input {...register('description')} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => append({ accountId: '', debit: 0, credit: 0 })}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_36px] gap-2 px-1">
                {['Account','Debit','Credit','Notes',''].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal/40">{h}</span>
                ))}
              </div>
              {fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_36px] gap-2 items-center">
                  <Controller name={`lines.${i}.accountId`} control={control} render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="text-xs"><SelectValue placeholder="Account" /></SelectTrigger>
                      <SelectContent>
                        {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                  <Input type="number" step="0.01" {...register(`lines.${i}.debit`)}  placeholder="0.00" />
                  <Input type="number" step="0.01" {...register(`lines.${i}.credit`)} placeholder="0.00" />
                  <Input {...register(`lines.${i}.description`)} placeholder="Notes" />
                  {fields.length > 2
                    ? <button type="button" onClick={() => remove(i)}
                        className="h-10 flex items-center justify-center text-brand-charcoal/30 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    : <div />}
                </div>
              ))}

              <div className="flex items-center justify-end gap-4 pt-2">
                <span className="text-sm text-brand-charcoal/50">
                  Debit: <strong className="text-brand-charcoal">{formatCurrency(totalDebit)}</strong>
                </span>
                <span className="text-sm text-brand-charcoal/50">
                  Credit: <strong className="text-brand-charcoal">{formatCurrency(totalCredit)}</strong>
                </span>
                <Badge variant={isBalanced ? 'success' : 'destructive'}>
                  {isBalanced ? 'Balanced ✓' : 'Unbalanced'}
                </Badge>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !isBalanced}>{saving ? 'Creating…' : 'Create Entry'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
