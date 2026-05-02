import { useState, useEffect } from 'react';
import { companyApi, usersApi } from '@/services/api';
import { Company, User } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/useToast';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { Plus, Trash2, Building2, Users, ReceiptText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogoIcon } from '@/components/ui/logo';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState<'company' | 'users' | 'taxes'>('company');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<Partial<Company>>();
  const { register: regUser, handleSubmit: handleUser, reset: resetUser } = useForm<{ name: string; email: string; password: string; role: string }>();

  useEffect(() => {
    companyApi.get().then(c => { setCompany(c); reset(c); });
    usersApi.list().then(setUsers);
  }, [reset]);

  async function onCompanySave(data: Partial<Company>) {
    setSaving(true);
    try { await companyApi.update(data); toast({ title: 'Company updated' }); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  }
  async function onUserCreate(data: { name: string; email: string; password: string; role: string }) {
    try { await usersApi.create(data); toast({ title: 'User created' }); setUserModalOpen(false); usersApi.list().then(setUsers); }
    catch { toast({ title: 'Failed to create', variant: 'destructive' }); }
  }
  async function deleteUser(id: string) {
    if (!confirm('Delete this user?')) return;
    try { await usersApi.delete(id); toast({ title: 'User deleted' }); usersApi.list().then(setUsers); }
    catch { toast({ title: 'Error', variant: 'destructive' }); }
  }

  const ROLE_BADGE: Record<string, { label: string; variant: 'destructive' | 'info' | 'warning' }> = {
    ADMIN:      { label: 'Admin',       variant: 'destructive' },
    ACCOUNTANT: { label: 'Accountant',  variant: 'info' },
    VIEWER:     { label: 'Viewer',      variant: 'warning' },
  };

  const TABS = [
    { id: 'company', label: 'Company',  icon: Building2 },
    { id: 'users',   label: 'Users',    icon: Users },
    { id: 'taxes',   label: 'VAT Rates',icon: ReceiptText },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-brand-charcoal">Settings</h1>
        <p className="text-sm text-brand-charcoal/40 mt-0.5">Company profile and system configuration</p>
      </div>

      <div className="flex bg-white border border-brand-grey rounded-lg p-1 gap-1 w-fit">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id as typeof tab)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${tab === t.id ? 'bg-brand-orange text-white shadow-sm' : 'text-brand-charcoal/50 hover:text-brand-charcoal'}`}>
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* Company */}
      {tab === 'company' && company && (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream flex items-center gap-3">
            <LogoIcon size={32} />
            <div>
              <h2 className="text-sm font-bold text-brand-charcoal">Company Details</h2>
              <p className="text-xs text-brand-charcoal/40">{company.taxId}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit(onCompanySave)} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5"><Label>Company Name</Label><Input {...register('name')} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...register('email')} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input {...register('phone')} /></div>
              <div className="col-span-2 space-y-1.5"><Label>Address</Label><Input {...register('address')} /></div>
              <div className="space-y-1.5"><Label>City</Label><Input {...register('city')} /></div>
              <div className="space-y-1.5"><Label>Zip Code</Label><Input {...register('zipCode')} /></div>
              <div className="space-y-1.5"><Label>Country</Label><Input {...register('country')} /></div>
              <div className="space-y-1.5"><Label>Currency</Label><Input {...register('currency')} /></div>
              <div className="col-span-2 space-y-1.5"><Label>IBAN</Label><Input {...register('iban')} /></div>
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </form>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-brand-charcoal">Users</h2>
              <p className="text-xs text-brand-charcoal/40">{users.length} member{users.length !== 1 ? 's' : ''}</p>
            </div>
            {user?.role === 'ADMIN' && (
              <Button size="sm" onClick={() => { resetUser({ role: 'VIEWER' }); setUserModalOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Invite User
              </Button>
            )}
          </div>
          <div className="divide-y divide-brand-grey">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-orange/10 flex items-center justify-center">
                    <span className="text-brand-orange text-xs font-bold">{u.name.slice(0,2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-charcoal">{u.name}</p>
                    <p className="text-xs text-brand-charcoal/40">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={ROLE_BADGE[u.role]?.variant || 'outline'}>{ROLE_BADGE[u.role]?.label || u.role}</Badge>
                  {user?.role === 'ADMIN' && u.id !== user.id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-charcoal/30 hover:text-red-500" onClick={() => deleteUser(u.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VAT Rates */}
      {tab === 'taxes' && (
        <div className="bg-white rounded-xl border border-brand-grey shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-brand-grey bg-brand-cream">
            <h2 className="text-sm font-bold text-brand-charcoal">VAT Rates</h2>
            <p className="text-xs text-brand-charcoal/40 mt-0.5">Configured automatically at company creation</p>
          </div>
          <div className="divide-y divide-brand-grey">
            {[
              { name: 'Standard VAT',      rate: 23 },
              { name: 'Intermediate VAT',  rate: 13 },
              { name: 'Reduced VAT',       rate: 6  },
              { name: 'Exempt',            rate: 0  },
            ].map(t => (
              <div key={t.rate} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm font-medium text-brand-charcoal">{t.name}</span>
                <span className="text-sm font-bold text-brand-orange">{t.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <form onSubmit={handleUser(onUserCreate)} className="space-y-4 pt-1">
            <div className="space-y-1.5"><Label>Name</Label><Input {...regUser('name')} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" {...regUser('email')} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" {...regUser('password')} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select className="flex h-10 w-full rounded-lg border border-brand-grey bg-white px-3 text-sm text-brand-charcoal focus:outline-none focus:border-brand-orange" {...regUser('role')}>
                <option value="VIEWER">Viewer</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUserModalOpen(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
