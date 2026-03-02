import { cn, getStatusColor, getMaterialityColor } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', getStatusColor(status), className)}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  );
}

export function MaterialityBadge({ level }: { level: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', getMaterialityColor(level))}>
      {level}
    </span>
  );
}
