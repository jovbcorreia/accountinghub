import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { customersApi } from '@/services/api';
import { Customer } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  taxId: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default('PT'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function CustomersPage() {
  const [data, setData] = useState<{ items: Customer[]; total: number; page: number; pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await customersApi.list({ search, page, pageSize: 20 }); setData(r); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    reset({ name: '', taxId: '', email: '', phone: '', address: '', city: '', zipCode: '', country: 'PT', notes: '' });
    setModalOpen(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    reset({ ...c, email: c.email || '', taxId: c.taxId || '', phone: c.phone || '', address: c.address || '', city: c.city || '', zipCode: c.zipCode || '', notes: c.notes || '' });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (editing) { await customersApi.update(editing.id, values); toast({ title: 'Customer updated' }); }
      else { await customersApi.create(values); toast({ title: 'Customer created' }); }
      setModalOpen(false); load();
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try { await customersApi.delete(deleting.id); toast({ title: 'Customer deleted' }); setDeleteOpen(false); load(); }
    catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  }

  const columns: Column<Customer>[] = [
    { key: 'name', header: 'Name', sortable: true,
      render: r => <span className="font-semibold text-brand-charcoal">{r.name}</span> },
    { key: 'taxId',  header: 'Tax ID',  render: r => r.taxId  || '—' },
    { key: 'email',  header: 'Email',   render: r => r.email  || '—' },
    { key: 'phone',  header: 'Phone',   render: r => r.phone  || '—' },
    { key: 'city',   header: 'City',    render: r => r.city   || '—' },
    { key: 'createdAt', header: 'Created',
      render: r => <span className="text-xs text-brand-charcoal/40">{formatDate(r.createdAt)}</span> },
    { key: 'actions', header: '', className: 'w-20',
      render: r => (
        <div className="flex items-center gap-1 justify-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-charcoal/30 hover:text-brand-orange" onClick={() => openEdit(r)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-charcoal/30 hover:text-red-500" onClick={() => { setDeleting(r); setDeleteOpen(true); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Customers</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Manage your customers</p>
      </div>

      <DataTable
        columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1); }}
        loading={loading} searchPlaceholder="Search customers…"
        emptyMessage="No customers found. Create your first customer."
        actions={<Button onClick={openCreate} size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" />New Customer</Button>}
      />

      {/* Create / Edit */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand-charcoal">{editing ? 'Edit Customer' : 'New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label><Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5"><Label>Tax ID</Label><Input {...register('taxId')} placeholder="500000000" /></div>
              <div className="space-y-1.5">
                <Label>Email</Label><Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5"><Label>Phone</Label><Input {...register('phone')} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input {...register('country')} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input {...register('address')} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input {...register('city')} /></div>
              <div className="space-y-1.5"><Label>Zip Code</Label><Input {...register('zipCode')} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Notes</Label><Input {...register('notes')} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleting?.name}</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
