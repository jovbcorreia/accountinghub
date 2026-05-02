import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/useToast';
import { LogoIcon } from '@/components/ui/logo';

const schema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  taxId: z.string().min(9, 'Tax ID must be 9 digits').max(9, 'Tax ID must be 9 digits'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-brand-charcoal">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = 'flex h-10 w-full rounded-lg border border-brand-grey bg-white px-3 py-2 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const result = await authApi.register(data);
      setAuth(result.user, result.company);
      navigate('/dashboard');
      toast({ title: 'Welcome!', description: `${result.company.name} is ready.` });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-peach/20" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <LogoIcon size={64} />
          <h1 className="mt-4 text-2xl font-bold text-brand-charcoal tracking-tight">Create Company</h1>
          <p className="text-sm text-brand-charcoal/40 mt-1">Register your company on AccountingHub</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card-hover border border-brand-grey p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Company Name" error={errors.companyName?.message}>
              <input className={inputCls} placeholder="Acme Inc." {...register('companyName')} />
            </Field>
            <Field label="Tax ID" error={errors.taxId?.message}>
              <input className={inputCls} placeholder="500000000" {...register('taxId')} />
            </Field>
            <Field label="Your Name" error={errors.name?.message}>
              <input className={inputCls} placeholder="John Smith" {...register('name')} />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input type="email" className={inputCls} placeholder="john@company.com" {...register('email')} />
            </Field>
            <Field label="Password" error={errors.password?.message}>
              <input type="password" className={inputCls} placeholder="Min. 8 characters" {...register('password')} />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm mt-2"
            >
              {loading ? 'Creating…' : 'Create Company'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-charcoal/40 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-orange font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
