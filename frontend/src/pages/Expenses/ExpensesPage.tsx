import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import { expensesApi, suppliersApi } from '@/services/api';
import { Expense, ExpenseStatus, Supplier } from '@/types';
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

const STATUS: Record<ExpenseStatus, { label: string; variant: 'warning' | 'success' | 'outline' }> = {
  PENDING:   { label: 'Pending',   variant: 'warning' },
  PAID:      { label: 'Paid',      variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

const schema = z.object({
  supplierId: z.string().optional(),
  number: z.string().optional(),
  date: z.string().min(1),
  dueDate: z.string().optional(),
  lines: z.array(z.object({
    description: z.string().min(1, 'Required'),
    quantity: z.coerce.number().min(0.01),
    unitPrice: z.coerce.number().min(0),
    taxRate: z.coerce.number().min(0),
  })).min(1),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ExpensesPage() {
  const [data, setData] = useState<{ items: Expense[]; total: number; page: number; pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const { register, handleSubmit, reset, control, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: today, lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 23 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await expensesApi.list({ search, page, pageSize: 20 }); setData(r); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => {
    load();
    suppliersApi.list({ pageSize: 200 }).then(r => setSuppliers(r.items));
  }, [load]);

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      await expensesApi.create({ ...values, supplierId: values.supplierId || null, dueDate: values.dueDate || null });
      toast({ title: 'Expense created' }); setModalOpen(false); load();
    } catch { toast({ title: 'Failed to create', variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  async function markPaid(id: string) {
    try { await expensesApi.markPaid(id); toast({ title: 'Marked as paid' }); load(); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  }

  const totals = lines.reduce((a, l) => {
    const sub = Number(l.quantity) * Number(l.unitPrice);
    return { sub: a.sub + sub, tax: a.tax + sub * (Number(l.taxRate) / 100) };
  }, { sub: 0, tax: 0 });

  const columns: Column<Expense>[] = [
    { key: 'number', header: 'Number',
      render: r => r.number ? <span className="font-mono text-xs font-semibold">{r.number}</span> : <span className="text-brand-charcoal/30">—</span> },
    { key: 'supplier', header: 'Supplier',
      render: r => <span className="font-semibold text-brand-charcoal">{(r.supplier as { name?: string })?.name || '—'}</span> },
    { key: 'date',  header: 'Date',  render: r => formatDate(r.date) },
    { key: 'total', header: 'Total',
      render: r => <span className="font-bold text-brand-charcoal">{formatCurrency(Number(r.total))}</span> },
    { key: 'status', header: 'Status',
      render: r => { const s = STATUS[r.status]; return <Badge variant={s.variant}>{s.label}</Badge>; } },
    { key: 'actions', header: '', className: 'w-12',
      render: r => r.status === 'PENDING' ? (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:bg-green-50 hover:text-green-600"
          onClick={() => markPaid(r.id)} title="Mark as paid">
          <CheckCircle className="h-4 w-4" />
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Expenses</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Manage expenses and purchases</p>
      </div>

      <DataTable columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1); }} loading={loading}
        searchPlaceholder="Search expenses…" emptyMessage="No expenses found."
        actions={
          <Button size="sm" onClick={() => {
            reset({ date: today, lines: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 23 }] });
            setModalOpen(true);
          }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />New Expense
          </Button>
        }
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Expense</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Controller name="supplierId" control={control} render={({ field }) => (
                  <Select value={field.value || ''} onValueChange={v => field.onChange(v === 'NONE' ? '' : v)}>
                    <SelectTrigger><SelectValue placeholder="No supplier" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">No supplier</SelectItem>
                      {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-1.5"><Label>Document No.</Label><Input {...register('number')} /></div>
              <div className="space-y-1.5"><Label>Date *</Label><Input type="date" {...register('date')} /></div>
              <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lines</Label>
                <Button type="button" variant="outline" size="sm"
                  onClick={() => append({ description: '', quantity: 1, unitPrice: 0, taxRate: 23 })}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add Line
                </Button>
              </div>
              <div className="grid grid-cols-[2fr_0.5fr_1fr_0.5fr_36px] gap-2 px-1">
                {['Description','Qty','Price','VAT%',''].map(h => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-brand-charcoal/40">{h}</span>
                ))}
              </div>
              {fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[2fr_0.5fr_1fr_0.5fr_36px] gap-2 items-start">
                  <Input {...register(`lines.${i}.description`)} placeholder="Description" />
                  <Input type="number" step="0.01" {...register(`lines.${i}.quantity`)} placeholder="1" />
                  <Input type="number" step="0.01" {...register(`lines.${i}.unitPrice`)} placeholder="0.00" />
                  <Input type="number" step="0.01" {...register(`lines.${i}.taxRate`)} placeholder="23" />
                  {fields.length > 1
                    ? <button type="button" onClick={() => remove(i)}
                        className="h-10 flex items-center justify-center text-brand-charcoal/30 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    : <div />}
                </div>
              ))}
              <div className="flex justify-end gap-4 text-sm pt-1">
                <span className="text-brand-charcoal/50">Subtotal: <strong className="text-brand-charcoal">{formatCurrency(totals.sub)}</strong></span>
                <span className="text-brand-charcoal/50">VAT: <strong className="text-brand-charcoal">{formatCurrency(totals.tax)}</strong></span>
                <span className="font-bold text-brand-charcoal">Total: <span className="text-brand-orange">{formatCurrency(totals.sub + totals.tax)}</span></span>
              </div>
            </div>

            <div className="space-y-1.5"><Label>Notes</Label><Input {...register('notes')} /></div>
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
