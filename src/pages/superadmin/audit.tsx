import { FileText } from 'lucide-react';
import { apiAudit } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { AuditLogEntry } from '@/types';

export default function AuditPage() {
  const { data: auditEntries, loading, error, refetch } = useAsync<AuditLogEntry[]>(
    () => apiAudit.list(),
    []
  );

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Audit Log"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Audit Log' },
          ]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (entry: AuditLogEntry) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDateTime(entry.timestamp)}
        </span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (entry: AuditLogEntry) => (
        <div>
          <p className="font-medium text-sm">{entry.userName}</p>
          <p className="text-xs text-muted-foreground">{entry.userId.slice(0, 8)}...</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (entry: AuditLogEntry) => (
        <Badge variant="outline" className="text-xs">
          {entry.action}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity Type',
      sortable: true,
      render: (entry: AuditLogEntry) => (
        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground capitalize">
          {entry.entityType}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (entry: AuditLogEntry) => (
        <p className="text-sm text-muted-foreground max-w-[300px] truncate">
          {entry.details}
        </p>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Audit Log"
        subtitle="Complete platform activity trail"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Audit Log' },
        ]}
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            {auditEntries?.length ?? 0} entries
          </div>
        }
      />

      <DataTable<AuditLogEntry>
        data={auditEntries ?? []}
        columns={columns}
        keyField="id"
        searchable
        searchFields={['action', 'userName', 'details', 'entityType']}
        emptyMessage="No audit log entries found."
      />
    </div>
  );
}
