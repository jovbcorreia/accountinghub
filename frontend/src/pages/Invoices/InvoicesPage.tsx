import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye } from 'lucide-react';
import { invoicesApi } from '@/services/api';
import { Invoice, InvoiceStatus } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';

const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' | 'outline' }> = {
  DRAFT:          { label: 'Draft',     variant: 'secondary' },
  ISSUED:         { label: 'Issued',    variant: 'info' },
  PAID:           { label: 'Paid',      variant: 'success' },
  PARTIALLY_PAID: { label: 'Partial',   variant: 'warning' },
  OVERDUE:        { label: 'Overdue',   variant: 'destructive' },
  CANCELLED:      { label: 'Cancelled', variant: 'outline' },
};

export default function InvoicesPage() {
  const [data, setData] = useState<{ items: Invoice[]; total: number; page: number; pageSize: number }>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await invoicesApi.list({ search, page, pageSize: 20, ...(status ? { status } : {}) });
      setData(r);
    } finally { setLoading(false); }
  }, [search, page, status]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Number', sortable: true,
      render: r => <span className="font-mono font-semibold text-brand-charcoal">{r.number}</span> },
    { key: 'customer', header: 'Customer',
      render: r => <span className="font-medium">{(r.customer as { name?: string })?.name || '—'}</span> },
    { key: 'issueDate', header: 'Issued', render: r => formatDate(r.issueDate) },
    { key: 'dueDate',   header: 'Due',    render: r => formatDate(r.dueDate) },
    { key: 'total',     header: 'Total',
      render: r => <span className="font-bold text-brand-charcoal">{formatCurrency(Number(r.total))}</span> },
    { key: 'paidAmount', header: 'Paid',
      render: r => <span className="text-green-600 font-medium">{formatCurrency(Number(r.paidAmount))}</span> },
    { key: 'status', header: 'Status',
      render: r => { const s = STATUS_BADGE[r.status]; return <Badge variant={s.variant}>{s.label}</Badge>; } },
    { key: 'actions', header: '', className: 'w-12',
      render: r => (
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-brand-charcoal/40 hover:text-brand-orange">
          <Link to={`/invoices/${r.id}`}><Eye className="h-3.5 w-3.5" /></Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-brand-charcoal">Invoices</h1>
          <p className="text-sm text-brand-charcoal/40 mt-0.5">Manage invoices and documents</p>
        </div>
      </div>
      <DataTable
        columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} onSearch={v => { setSearch(v); setPage(1); }}
        loading={loading} searchPlaceholder="Search invoices…"
        emptyMessage="No invoices yet. Create your first invoice."
        actions={
          <div className="flex items-center gap-2">
            <Select value={status} onValueChange={v => { setStatus(v === 'ALL' ? '' : v); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 text-xs border-brand-grey">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                {(Object.keys(STATUS_BADGE) as InvoiceStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{STATUS_BADGE[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild size="sm">
              <Link to="/invoices/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Invoice</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
