import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { useAuthStore } from '@/store/auth';
import { apiAudit } from '@/api/mock';
import type { AuditLogEntry } from '@/types';
import { Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';

export default function ActivityPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenantCompanyId) {
      apiAudit.list(user.tenantCompanyId).then(e => { setEntries(e); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader title="Activity Feed" subtitle="Recent activity across your organization" breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Activity' }]} />
      {entries.length === 0 ? (
        <EmptyState icon={<Activity className="h-8 w-8 text-muted-foreground" />} title="No Activity Yet" description="Activity will appear here as your team uses the platform." />
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {entry.userName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm"><span className="font-medium">{entry.userName}</span> <span className="text-muted-foreground">{entry.action.toLowerCase()}</span></p>
                  <p className="text-xs text-muted-foreground">{entry.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(entry.timestamp)}</p>
                </div>
                <StatusBadge status={entry.entityType} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
