import { useParams } from 'react-router-dom';
import { History } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { AuditLogEntry, CAP } from '@/types';

export default function CAPAudit() {
  const { capId } = useParams<{ capId: string }>();

  const cap = useAsync<CAP>(() => api.cap.getById(capId!), [capId]);
  const auditLog = useAsync<AuditLogEntry[]>(
    () =>
      api.audit.list().then((entries) =>
        entries.filter((entry) => entry.entityId === capId)
      ),
    [capId]
  );

  const isLoading = cap.loading || auditLog.loading;
  const hasError = cap.error || auditLog.error;

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Audit Log"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Audit Log' },
          ]}
        />
        <ErrorCard
          message={cap.error || auditLog.error || 'Failed to load audit log.'}
          onRetry={() => {
            cap.refetch();
            auditLog.refetch();
          }}
        />
      </div>
    );
  }

  const entries = auditLog.data ?? [];

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (item: AuditLogEntry) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDateTime(item.timestamp)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      render: (item: AuditLogEntry) => (
        <span className="font-medium">{item.userName}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item: AuditLogEntry) => (
        <Badge variant="secondary">{item.action}</Badge>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (item: AuditLogEntry) => (
        <span className="text-sm text-muted-foreground">{item.details}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle={
          cap.data
            ? `Activity history for "${cap.data.title}"`
            : 'Activity history'
        }
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.data?.title || 'CAP', href: `/app/caps/${capId}` },
          { label: 'Audit Log' },
        ]}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8 text-muted-foreground" />}
          title="No Audit Entries"
          description="No activity has been recorded for this assessment yet. Actions like creating, launching, and generating reports will appear here."
        />
      ) : (
        <DataTable
          data={entries}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['userName', 'action', 'details']}
          emptyMessage="No audit entries match your search."
        />
      )}
    </div>
  );
}
