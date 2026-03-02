import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: string;
  searchable?: boolean;
  searchFields?: string[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data, columns, keyField, searchable, searchFields, onRowClick, emptyMessage = 'No data found.', className
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  let filtered = data;
  if (searchable && search && searchFields) {
    const q = search.toLowerCase();
    filtered = data.filter(item =>
      searchFields.some(f => String(item[f] || '').toLowerCase().includes(q))
    );
  }

  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      )}
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 text-left font-medium text-muted-foreground', col.sortable && 'cursor-pointer hover:text-foreground', col.className)}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.header}
                  {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">{emptyMessage}</td>
              </tr>
            ) : (
              filtered.map(item => (
                <tr
                  key={item[keyField]}
                  className={cn('border-b last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-muted/50')}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {data.length} records</p>
    </div>
  );
}
