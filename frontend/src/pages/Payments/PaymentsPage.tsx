import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { Payment, PaymentMethod } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

const METHOD_BADGE: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  CARD:          'Card',
  CASH:          'Cash',
  MBWAY:         'MBWay',
  CHECK:         'Check',
};

type PaymentWithInvoice = Payment & {
  invoice?: { number: string; customer?: { name: string } };
};

export default function PaymentsPage() {
  const [data, setData] = useState<{ items: PaymentWithInvoice[]; total: number; page: number; pageSize: number }>({
    items: [], total: 0, page: 1, pageSize: 20,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/payments', { params: { page, pageSize: 20 } }); setData(r.data); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns: Column<PaymentWithInvoice>[] = [
    { key: 'date', header: 'Date', render: r => formatDate(r.date) },
    { key: 'invoice', header: 'Invoice',
      render: r => <span className="font-mono text-xs font-semibold">{r.invoice?.number || '—'}</span> },
    { key: 'customer', header: 'Customer',
      render: r => <span className="font-medium text-brand-charcoal">{r.invoice?.customer?.name || '—'}</span> },
    { key: 'method', header: 'Method',
      render: r => <Badge variant="secondary">{METHOD_BADGE[r.method] || r.method}</Badge> },
    { key: 'reference', header: 'Reference',
      render: r => r.reference || <span className="text-brand-charcoal/30">—</span> },
    { key: 'amount', header: 'Amount',
      render: r => <span className="font-bold text-green-600">{formatCurrency(Number(r.amount))}</span> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Payments</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Payment history received from customers</p>
      </div>
      <DataTable
        columns={columns} data={data.items} total={data.total} page={page} pageSize={20}
        onPageChange={setPage} loading={loading}
        emptyMessage="No payments recorded yet."
      />
    </div>
  );
}
