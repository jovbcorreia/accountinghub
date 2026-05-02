import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Ban, DollarSign } from 'lucide-react';
import { invoicesApi } from '@/services/api';
import { Invoice, InvoiceStatus, PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/useToast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const STATUS_BADGE: Record<InvoiceStatus, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' | 'info' | 'outline' }> = {
  DRAFT:          { label: 'Draft',     variant: 'secondary' },
  ISSUED:         { label: 'Issued',    variant: 'info' },
  PAID:           { label: 'Paid',      variant: 'success' },
  PARTIALLY_PAID: { label: 'Partial',   variant: 'warning' },
  OVERDUE:        { label: 'Overdue',   variant: 'destructive' },
  CANCELLED:      { label: 'Cancelled', variant: 'outline' },
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Bank Transfer', CARD: 'Card', CASH: 'Cash', MBWAY: 'MBWay', CHECK: 'Check',
};

const paymentSchema = z.object({
  amount:    z.coerce.number().min(0.01),
  method:    z.enum(['BANK_TRANSFER', 'CARD', 'CASH', 'MBWAY', 'CHECK']),
  date:      z.string().min(1),
  reference: z.string().optional(),
  notes:     z.string().optional(),
});
type PaymentForm = z.infer<typeof paymentSchema>;

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { date: new Date().toISOString().split('T')[0], method: 'BANK_TRANSFER' },
  });

  async function load() {
    if (!id) return;
    setLoading(true);
    try { const r = await invoicesApi.get(id); setInvoice(r); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [id]);

  async function handleIssue() {
    if (!invoice) return;
    try { await invoicesApi.issue(invoice.id); toast({ title: 'Invoice issued' }); load(); }
    catch { toast({ title: 'Failed to issue', variant: 'destructive' }); }
  }
  async function handleCancel() {
    if (!invoice) return;
    try { await invoicesApi.cancel(invoice.id); toast({ title: 'Invoice cancelled' }); load(); }
    catch { toast({ title: 'Failed to cancel', variant: 'destructive' }); }
  }
  async function onPaymentSubmit(data: PaymentForm) {
    if (!invoice) return;
    setSaving(true);
    try {
      await invoicesApi.registerPayment(invoice.id, data);
      toast({ title: 'Payment recorded' }); setPaymentOpen(false); load();
    } catch { toast({ title: 'Failed to record payment', variant: 'destructive' }); }
    finally { setSaving(false); }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-16">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-orange border-t-transparent" />
    </div>
  );
  if (!invoice) return <div className="text-center p-12 text-brand-charcoal/40">Invoice not found</div>;

  const st = STATUS_BADGE[invoice.status];
  const remaining = Number(invoice.total) - Number(invoice.paidAmount);
  const taxByRate = (invoice.lines || []).reduce((acc: Record<string, { base: number; tax: number }>, l) => {
    const k = String(l.taxRate);
    if (!acc[k]) acc[k] = { base: 0, tax: 0 };
    acc[k].base += Number(l.subtotal);
    acc[k].tax  += Number(l.taxAmount);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-brand-charcoal">{invoice.number}</h1>
              <Badge variant={st.variant}>{st.label}</Badge>
            </div>
            <p className="text-sm text-brand-charcoal/40">{(invoice.customer as { name?: string })?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <Button size="sm" onClick={handleIssue}><Send className="h-3.5 w-3.5 mr-1.5" />Issue</Button>
          )}
          {['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status) && (
            <Button size="sm" variant="outline" onClick={() => {
              reset({ date: new Date().toISOString().split('T')[0], method: 'BANK_TRANSFER', amount: remaining });
              setPaymentOpen(true);
            }}>
              <DollarSign className="h-3.5 w-3.5 mr-1.5" />Record Payment
            </Button>
          )}
          {!['CANCELLED', 'PAID'].includes(invoice.status) && (
            <Button size="sm" variant="destructive" onClick={handleCancel}><Ban className="h-3.5 w-3.5 mr-1.5" />Cancel</Button>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Issue Date',   value: formatDate(invoice.issueDate) },
          { label: 'Due Date',     value: formatDate(invoice.dueDate) },
          { label: 'Outstanding',  value: formatCurrency(remaining), highlight: remaining > 0 },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-brand-grey shadow-card px-5 py-4">
            <p className="text-xs font-semibold text-brand-charcoal/40 uppercase tracking-wide">{s.label}</p>
            <p className={`text-lg font-bold mt-1 ${s.highlight ? 'text-brand-orange' : 'text-brand-charcoal'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Lines */}
      <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
          <h2 className="text-sm font-bold text-brand-charcoal">Line Items</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-grey text-xs font-semibold uppercase tracking-wide text-brand-charcoal/40">
              <th className="text-left px-6 py-3">Description</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-right px-4 py-3">Price</th>
              <th className="text-right px-4 py-3">Disc%</th>
              <th className="text-right px-4 py-3">VAT%</th>
              <th className="text-right px-6 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((l, i) => (
              <tr key={l.id || i} className="border-b border-brand-grey last:border-0 hover:bg-orange-50 transition-colors">
                <td className="px-6 py-3 font-medium text-brand-charcoal">{l.description}</td>
                <td className="text-right px-4 py-3 text-brand-charcoal/60">{Number(l.quantity)}</td>
                <td className="text-right px-4 py-3 text-brand-charcoal/60">{formatCurrency(Number(l.unitPrice))}</td>
                <td className="text-right px-4 py-3 text-brand-charcoal/60">{Number(l.discount)}%</td>
                <td className="text-right px-4 py-3 text-brand-charcoal/60">{Number(l.taxRate)}%</td>
                <td className="text-right px-6 py-3 font-bold text-brand-charcoal">{formatCurrency(Number(l.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end px-6 py-4 border-t border-brand-grey bg-brand-cream/50">
          <div className="w-60 space-y-2 text-sm">
            <div className="flex justify-between text-brand-charcoal/50">
              <span>Subtotal</span><span>{formatCurrency(Number(invoice.subtotal))}</span>
            </div>
            {Object.entries(taxByRate).map(([rate, v]) => (
              <div key={rate} className="flex justify-between text-brand-charcoal/50">
                <span>VAT {rate}%</span><span>{formatCurrency(v.tax)}</span>
              </div>
            ))}
            <div className="h-px bg-brand-grey" />
            <div className="flex justify-between font-bold text-brand-charcoal text-base">
              <span>Total</span><span className="text-brand-orange">{formatCurrency(Number(invoice.total))}</span>
            </div>
            {Number(invoice.paidAmount) > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Paid</span><span>{formatCurrency(Number(invoice.paidAmount))}</span>
              </div>
            )}
            {remaining > 0 && (
              <div className="flex justify-between font-bold text-brand-charcoal">
                <span>Outstanding</span><span>{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments */}
      {(invoice.payments || []).length > 0 && (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
            <h2 className="text-sm font-bold text-brand-charcoal">Payments</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-grey text-xs font-semibold uppercase tracking-wide text-brand-charcoal/40">
                <th className="text-left px-6 py-3">Date</th>
                <th className="text-left px-4 py-3">Method</th>
                <th className="text-left px-4 py-3">Reference</th>
                <th className="text-right px-6 py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.payments || []).map(p => (
                <tr key={p.id} className="border-b border-brand-grey last:border-0">
                  <td className="px-6 py-3">{formatDate(p.date)}</td>
                  <td className="px-4 py-3">{METHOD_LABELS[p.method]}</td>
                  <td className="px-4 py-3 text-brand-charcoal/40">{p.reference || '—'}</td>
                  <td className="text-right px-6 py-3 font-bold text-green-600">{formatCurrency(Number(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label>Amount *</Label>
              <Input type="number" step="0.01" {...register('amount')} />
              {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Method *</Label>
              <Controller name="method" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(METHOD_LABELS) as [PaymentMethod, string][]).map(([k, v]) =>
                      <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5"><Label>Date *</Label><Input type="date" {...register('date')} /></div>
            <div className="space-y-1.5"><Label>Reference</Label><Input {...register('reference')} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Record'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
