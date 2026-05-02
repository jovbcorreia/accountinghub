import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { invoicesApi, customersApi, productsApi } from '@/services/api';
import { Customer, Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils';

const lineSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).max(100).default(0),
  taxRate: z.coerce.number().min(0),
});

const schema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  type: z.enum(['INVOICE', 'QUOTE', 'PROFORMA', 'CREDIT_NOTE']).default('INVOICE'),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  lines: z.array(lineSchema).min(1, 'At least one line is required'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function calcLine(qty: number, price: number, disc: number, tax: number) {
  const sub = qty * price * (1 - disc / 100);
  return { subtotal: sub, taxAmount: sub * (tax / 100), total: sub + sub * (tax / 100) };
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const due   = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'INVOICE', issueDate: today, dueDate: due,
      lines: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 23 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines');

  useEffect(() => {
    customersApi.list({ pageSize: 200 }).then(r => setCustomers(r.items));
    productsApi.list({ pageSize: 200 }).then(r => setProducts(r.items));
  }, []);

  function onProductSelect(idx: number, productId: string) {
    const p = products.find(p => p.id === productId);
    if (!p) return;
    setValue(`lines.${idx}.description`, p.name);
    setValue(`lines.${idx}.unitPrice`, Number(p.price));
    setValue(`lines.${idx}.taxRate`, Number(p.taxRate?.rate || 23));
  }

  const totals = lines.reduce((acc, l) => {
    const c = calcLine(Number(l.quantity), Number(l.unitPrice), Number(l.discount || 0), Number(l.taxRate));
    return { subtotal: acc.subtotal + c.subtotal, tax: acc.tax + c.taxAmount, total: acc.total + c.total };
  }, { subtotal: 0, tax: 0, total: 0 });

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      const inv = await invoicesApi.create(values);
      toast({ title: 'Invoice created' });
      navigate(`/invoices/${inv.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create invoice';
      toast({ title: msg, variant: 'destructive' });
    } finally { setSaving(false); }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-brand-charcoal">New Invoice</h1>
          <p className="text-sm text-brand-charcoal/40">Fill in the details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* General */}
        <div className="bg-white rounded-xl border border-brand-grey shadow-card p-6">
          <h2 className="text-sm font-bold text-brand-charcoal mb-4">General</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVOICE">Invoice</SelectItem>
                    <SelectItem value="QUOTE">Quote</SelectItem>
                    <SelectItem value="PROFORMA">Pro-Forma</SelectItem>
                    <SelectItem value="CREDIT_NOTE">Credit Note</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Controller name="customerId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
              {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
            </div>
            <div className="space-y-1.5"><Label>Issue Date *</Label><Input type="date" {...register('issueDate')} /></div>
            <div className="space-y-1.5"><Label>Due Date *</Label><Input type="date" {...register('dueDate')} /></div>
          </div>
        </div>

        {/* Lines */}
        <div className="bg-white rounded-xl border border-brand-grey shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-brand-charcoal">Line Items</h2>
            <Button type="button" variant="outline" size="sm"
              onClick={() => append({ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRate: 23 })}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />Add Line
            </Button>
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr_0.5fr_0.5fr_0.8fr_36px] gap-2 px-1 mb-2">
            {['Description','Product','Qty','Price','Disc%','VAT%',''].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wide text-brand-charcoal/40">{h}</span>
            ))}
          </div>

          <div className="space-y-2">
            {fields.map((field, idx) => {
              const l = lines[idx] || {};
              const c = calcLine(Number(l.quantity), Number(l.unitPrice), Number(l.discount || 0), Number(l.taxRate));
              return (
                <div key={field.id} className="grid grid-cols-[2fr_1fr_1fr_0.5fr_0.5fr_0.8fr_36px] gap-2 items-start">
                  <div>
                    <Input {...register(`lines.${idx}.description`)} placeholder="Description" />
                    {errors.lines?.[idx]?.description && <p className="text-xs text-red-500 mt-0.5">{errors.lines[idx]?.description?.message}</p>}
                  </div>
                  <Select onValueChange={v => onProductSelect(idx, v)}>
                    <SelectTrigger className="text-xs"><SelectValue placeholder="Product" /></SelectTrigger>
                    <SelectContent>
                      {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.01" {...register(`lines.${idx}.quantity`)} placeholder="1" />
                  <Input type="number" step="0.01" {...register(`lines.${idx}.unitPrice`)} placeholder="0.00" />
                  <Input type="number" step="0.01" {...register(`lines.${idx}.discount`)} placeholder="0" />
                  <Input type="number" step="0.01" {...register(`lines.${idx}.taxRate`)} placeholder="23" />
                  <div className="flex items-center justify-end">
                    {fields.length > 1 ? (
                      <button type="button" onClick={() => remove(idx)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg text-brand-charcoal/30 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : <div className="h-9 w-9 flex items-center justify-center text-xs font-semibold text-brand-charcoal/30">{formatCurrency(c.total)}</div>}
                  </div>
                </div>
              );
            })}
          </div>
          {errors.lines && typeof errors.lines.message === 'string' && (
            <p className="text-xs text-red-500 mt-2">{errors.lines.message}</p>
          )}
        </div>

        {/* Footer: notes + totals */}
        <div className="flex gap-5">
          <div className="flex-1 bg-white rounded-xl border border-brand-grey shadow-card p-5">
            <Label className="mb-1.5 block">Notes</Label>
            <Input {...register('notes')} placeholder="Payment terms, references…" />
          </div>
          <div className="w-64 bg-white rounded-xl border border-brand-grey shadow-card p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-brand-charcoal/40">Subtotal</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-brand-charcoal/40">VAT</span>
              <span className="font-medium">{formatCurrency(totals.tax)}</span>
            </div>
            <div className="h-px bg-brand-grey" />
            <div className="flex justify-between">
              <span className="font-bold text-brand-charcoal">Total</span>
              <span className="font-bold text-brand-orange text-lg">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <Button type="button" variant="outline" onClick={() => navigate('/invoices')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}
