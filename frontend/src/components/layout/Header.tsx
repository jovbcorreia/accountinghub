import { Bell, ChevronDown, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const { user } = useAuthStore();

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <header className="h-16 bg-white border-b border-brand-grey flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Left: page context */}
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-charcoal/30" />
          <input
            placeholder="Search…"
            className="h-9 w-52 rounded-lg bg-brand-cream border border-brand-grey pl-9 pr-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
          />
        </div>
      </div>

      {/* Right: user area */}
      <div className="flex items-center gap-2">
        <button className="relative h-9 w-9 rounded-lg flex items-center justify-center text-brand-charcoal/40 hover:bg-brand-cream hover:text-brand-charcoal transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <div className="h-5 w-px bg-brand-grey mx-1" />

        <button className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-lg hover:bg-brand-cream transition-colors">
          <div className="w-7 h-7 rounded-full bg-brand-orange flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-brand-charcoal leading-none">{user?.name}</p>
            <p className="text-[10px] text-brand-charcoal/40 mt-0.5">{user?.role}</p>
          </div>
          <ChevronDown className="h-3 w-3 text-brand-charcoal/30 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
