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
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const result = await authApi.login(data);
      setAuth(result.user, result.company);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Invalid email or password';
      toast({ title: 'Sign in failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-orange/5" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-peach/20" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <LogoIcon size={64} />
          <h1 className="mt-4 text-2xl font-bold text-brand-charcoal tracking-tight">AccountingHub</h1>
          <p className="text-sm text-brand-charcoal/40 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-hover border border-brand-grey p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-charcoal">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                className="flex h-10 w-full rounded-lg border border-brand-grey bg-white px-3 py-2 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-brand-charcoal">Password</label>
                <a href="#" className="text-xs text-brand-orange hover:underline">Forgot password?</a>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="flex h-10 w-full rounded-lg border border-brand-grey bg-white px-3 py-2 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-charcoal/40 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-orange font-semibold hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
}
