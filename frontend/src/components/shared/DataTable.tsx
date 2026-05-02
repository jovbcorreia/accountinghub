import { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch?: (value: string) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  loading?: boolean;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
  emptyMessage?: string;
}

export function DataTable<T extends { id?: string }>({
  columns, data, total, page, pageSize, onPageChange, onSearch, onSort,
  loading, searchPlaceholder = 'Search…', actions, emptyMessage = 'No results found',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const totalPages = Math.ceil(total / pageSize);

  function handleSort(key: string) {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  }

  function getValue(row: T, key: string): React.ReactNode {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = row;
    for (const k of key.split('.')) val = val?.[k];
    return val ?? '—';
  }

  return (
    <div className="space-y-3">
      {(onSearch || actions) && (
        <div className="flex items-center justify-between gap-4">
          {onSearch && (
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-charcoal/30" />
              <input
                className="h-9 w-full rounded-lg border border-brand-grey bg-white pl-9 pr-3 text-sm text-brand-charcoal placeholder:text-brand-charcoal/30 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                placeholder={searchPlaceholder}
                onChange={e => onSearch(e.target.value)}
              />
            </div>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      <div className="rounded-xl border border-brand-grey overflow-hidden bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-grey bg-brand-cream">
              {columns.map(col => (
                <th
                  key={String(col.key)}
                  className={cn(
                    'text-left px-4 py-3 text-xs font-semibold text-brand-charcoal/50 uppercase tracking-wide',
                    col.sortable && 'cursor-pointer hover:text-brand-charcoal select-none',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === String(col.key) && (
                      sortOrder === 'asc'
                        ? <ChevronUp className="h-3 w-3 text-brand-orange" />
                        : <ChevronDown className="h-3 w-3 text-brand-orange" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t border-brand-grey">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-brand-grey/60 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center">
                      <Search className="h-5 w-5 text-brand-charcoal/20" />
                    </div>
                    <p className="text-sm text-brand-charcoal/40">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : data.map((row, i) => (
              <tr
                key={row.id || i}
                className={cn(
                  'border-t border-brand-grey transition-colors',
                  i % 2 === 0 ? 'bg-white' : 'bg-[#faf9f7]',
                  'hover:bg-orange-50'
                )}
              >
                {columns.map(col => (
                  <td key={String(col.key)} className={cn('px-4 py-3 text-brand-charcoal', col.className)}>
                    {col.render ? col.render(row) : String(getValue(row, String(col.key)))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-brand-charcoal/40">
          <span>{total} result{total !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}
              className="h-7 w-7 p-0">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…'
                  ? <span key={`ellipsis-${i}`} className="px-1">…</span>
                  : (
                    <button
                      key={p}
                      onClick={() => onPageChange(p as number)}
                      className={cn(
                        'h-7 w-7 rounded-md text-xs font-medium transition-colors',
                        p === page
                          ? 'bg-brand-orange text-white'
                          : 'text-brand-charcoal/50 hover:bg-brand-cream'
                      )}
                    >
                      {p}
                    </button>
                  )
              )}
            <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
              className="h-7 w-7 p-0">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
