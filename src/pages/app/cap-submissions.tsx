import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, Users } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { KPICard } from '@/components/shared/kpi-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { ResponseSubmission, CAP } from '@/types';

export default function CAPSubmissions() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();

  const cap = useAsync<CAP>(() => api.cap.getById(capId!), [capId]);
  const submissions = useAsync<ResponseSubmission[]>(
    () => api.submissions.listByCAP(capId!),
    [capId]
  );

  const isLoading = cap.loading || submissions.loading;
  const hasError = cap.error || submissions.error;

  const roleBreakdown = useMemo(() => {
    if (!submissions.data) return [];
    const counts: Record<string, number> = {};
    submissions.data.forEach((sub) => {
      const role = sub.responderMeta.selectedRole;
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }, [submissions.data]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Submissions"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Submissions' },
          ]}
        />
        <ErrorCard
          message={cap.error || submissions.error || 'Failed to load submissions.'}
          onRetry={() => {
            cap.refetch();
            submissions.refetch();
          }}
        />
      </div>
    );
  }

  const data = submissions.data ?? [];

  const columns = [
    {
      key: 'responderName',
      header: 'Responder',
      render: (item: ResponseSubmission) => (
        <span className="font-medium">
          {item.responderMeta.name || 'Anonymous'}
        </span>
      ),
    },
    {
      key: 'selectedRole',
      header: 'Role',
      render: (item: ResponseSubmission) => (
        <Badge variant="secondary">{item.responderMeta.selectedRole}</Badge>
      ),
    },
    {
      key: 'tenureBand',
      header: 'Tenure',
      render: (item: ResponseSubmission) => (
        <span className="text-muted-foreground">
          {item.responderMeta.tenureBand}
        </span>
      ),
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (item: ResponseSubmission) => (
        <span className="text-muted-foreground">
          {formatDate(item.submittedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-24',
      render: (item: ResponseSubmission) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/app/caps/${capId}/submissions/${item.id}`);
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Submissions"
        subtitle={cap.data ? `Responses for "${cap.data.title}"` : 'Responses'}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.data?.title || 'CAP', href: `/app/caps/${capId}` },
          { label: 'Submissions' },
        ]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Submissions"
          value={data.length}
          subtitle={`of ${cap.data?.respondersInvitedCount ?? 0} invited`}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        {roleBreakdown.slice(0, 3).map((rb) => (
          <KPICard
            key={rb.role}
            title={rb.role}
            value={rb.count}
            subtitle="responses"
            icon={<Users className="h-5 w-5" />}
          />
        ))}
      </div>

      {/* Role Breakdown */}
      {roleBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Breakdown by Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {roleBreakdown.map((rb) => (
                <div
                  key={rb.role}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2"
                >
                  <Badge variant="secondary">{rb.role}</Badge>
                  <span className="text-sm font-semibold">{rb.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submissions Table */}
      {data.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
          title="No Submissions Yet"
          description="No responses have been submitted for this assessment yet. Share invite links with responders to start collecting data."
        />
      ) : (
        <DataTable
          data={data}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['responderMeta']}
          onRowClick={(item) =>
            navigate(`/app/caps/${capId}/submissions/${item.id}`)
          }
          emptyMessage="No submissions match your search."
        />
      )}
    </div>
  );
}
