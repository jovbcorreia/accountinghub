import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { productsApi, api } from '@/services/api';
import { Product, TaxRate } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency } from '@/lib/utils';

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Invalid price'),
  unit: z.string().default('un'),
  taxRateId: z.string().min(1, 'Tax rate is required'),
  category: z.string().optional(),
  stock: z.coerce.number().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function ProductsPage() {
  const [data, setData] = useState<{ items: Product[]; total: number; page: number; pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await productsApi.list({ search, page, pageSize: 20 }); setData(r); } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => {
    load();
    api.get('/tax-rates').then(r => setTaxRates(r.data)).catch(() => {});
  }, [load]);

  useEffect(() => {
    if (data.items.length > 0) {
      const rates = data.items.filter(p => p.taxRate).map(p => p.taxRate!);
      const unique = Array.from(new Map(rates.map(r => [r.id, r])).values());
      if (unique.length > 0) setTaxRates(prev => {
        const ids = new Set(prev.map(r => r.id));
        return [...prev, ...unique.filter(r => !ids.has(r.id))];
      });
    }
  }, [data.items]);

  function openCreate() { setEditing(null); reset({ code: '', name: '', description: '', price: 0, unit: 'un', taxRateId: taxRates[0]?.id || '', category: '', stock: undefined }); setModalOpen(true); }
  function openEdit(p: Product) { setEditing(p); reset({ code: p.code, name: p.name, description: p.description || '', price: Number(p.price), unit: p.unit, taxRateId: p.taxRateId, category: p.category || '', stock: p.stock ?? undefined }); setModalOpen(true); }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (editing) { await productsApi.update(editing.id, values); toast({ title: 'Product updated' }); }
      else { await productsApi.create(values); toast({ title: 'Product created' }); }
      setModalOpen(false); load();
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); } finally { setSaving(false); }
  }
  async function confirmDelete() {
    if (!deleting) return;
    try { await productsApi.delete(deleting.id); toast({ title: 'Product deleted' }); setDeleteOpen(false); load(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  }

  const columns: Column<Product>[] = [
    { key: 'code', header: 'Code', sortable: true, render: r => <span className="font-mono text-xs font-semibold bg-brand-cream px-2 py-0.5 rounded">{r.code}</span> },
    { key: 'name', header: 'Name', sortable: true, render: r => <span className="font-semibold text-brand-charcoal">{r.name}</span> },
    { key: 'price', header: 'Price', render: r => <span className="font-bold text-brand-charcoal">{formatCurrency(Number(r.price))}</span> },
    { key: 'unit', header: 'Unit' },
    { key: 'taxRate', header: 'VAT', render: r => r.taxRate ? <span className="text-brand-orange font-semibold">{r.taxRate.rate}%</span> : '—' },
    { key: 'stock', header: 'Stock', render: r => r.stock != null ? String(r.stock) : '—' },
    { key: 'actions', header: '', className: 'w-20',
      render: r => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-charcoal/30 hover:text-brand-orange" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-charcoal/30 hover:text-red-500" onClick={() => { setDeleting(r); setDeleteOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Products / Services</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Product and service catalogue</p>
      </div>
      <DataTable columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1); }} loading={loading}
        searchPlaceholder="Search products…" emptyMessage="No products found."
        actions={<Button onClick={openCreate} size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Product</Button>}
      />
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'New Product'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Code *</Label><Input {...register('code')} />{errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}</div>
              <div className="space-y-1.5"><Label>Unit</Label><Input {...register('unit')} defaultValue="un" /></div>
              <div className="col-span-2 space-y-1.5"><Label>Name *</Label><Input {...register('name')} />{errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}</div>
              <div className="col-span-2 space-y-1.5"><Label>Description</Label><Input {...register('description')} /></div>
              <div className="space-y-1.5"><Label>Price *</Label><Input type="number" step="0.01" {...register('price')} />{errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}</div>
              <div className="space-y-1.5">
                <Label>VAT Rate *</Label>
                <Controller name="taxRateId" control={control} render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select VAT" /></SelectTrigger>
                    <SelectContent>{taxRates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} ({t.rate}%)</SelectItem>)}</SelectContent>
                  </Select>
                )} />
                {errors.taxRateId && <p className="text-xs text-red-500">{errors.taxRateId.message}</p>}
              </div>
              <div className="space-y-1.5"><Label>Category</Label><Input {...register('category')} /></div>
              <div className="space-y-1.5"><Label>Stock</Label><Input type="number" {...register('stock')} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Product</DialogTitle><DialogDescription>Delete <strong>{deleting?.name}</strong>?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
