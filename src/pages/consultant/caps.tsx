import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileBarChart } from 'lucide-react';
import { apiCompanies, apiCAP } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDate } from '@/lib/utils';
import type { Company, CAP } from '@/types';

interface CAPRow {
  id: string;
  title: string;
  companyName: string;
  status: string;
  submissionsCount: number;
  minSubmissions: number;
  createdAt: string;
}

export default function ConsultantCaps() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const assignedIds = user?.assignedCompanyIds ?? [];

  const companies = useAsync<Company[]>(() => apiCompanies.list(), []);
  const allCaps = useAsync<CAP[]>(() => apiCAP.list(), []);

  const isLoading = companies.loading || allCaps.loading;
  const hasError = companies.error || allCaps.error;

  const handleRetry = () => {
    companies.refetch();
    allCaps.refetch();
  };

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    (companies.data ?? []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [companies.data]);

  const rows: CAPRow[] = useMemo(() => {
    if (!allCaps.data || !companies.data) return [];
    const assignedCompanyIds = new Set(
      companies.data.filter((c) => assignedIds.includes(c.id)).map((c) => c.id)
    );
    return allCaps.data
      .filter((cap) => assignedCompanyIds.has(cap.companyId))
      .map((cap) => ({
        id: cap.id,
        title: cap.title,
        companyName: companyMap[cap.companyId] ?? 'Unknown',
        status: cap.status,
        submissionsCount: cap.submissionsCount,
        minSubmissions: cap.inviteSettings.minSubmissionsTotal,
        createdAt: cap.createdAt,
      }));
  }, [allCaps.data, companies.data, assignedIds, companyMap]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="All CAPs"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'CAPs' },
          ]}
        />
        <ErrorCard
          message={companies.error || allCaps.error || 'Failed to load.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (row: CAPRow) => (
        <span className="font-medium">{row.title}</span>
      ),
    },
    {
      key: 'companyName',
      header: 'Company',
      sortable: true,
      render: (row: CAPRow) => (
        <span className="text-muted-foreground">{row.companyName}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row: CAPRow) => <StatusBadge status={row.status} />,
    },
    {
      key: 'submissionsCount',
      header: 'Submissions',
      sortable: true,
      render: (row: CAPRow) => (
        <span className="font-mono text-sm">
          {row.submissionsCount}/{row.minSubmissions}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row: CAPRow) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  if (rows.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="All CAPs"
          subtitle="Assessments across your assigned companies"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'CAPs' },
          ]}
        />
        <EmptyState
          icon={<FileBarChart className="h-8 w-8 text-muted-foreground" />}
          title="No CAPs found"
          description="There are no CAPs for your assigned companies yet."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="All CAPs"
        subtitle={`${rows.length} assessments across your assigned companies`}
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'CAPs' },
        ]}
      />

      <DataTable<CAPRow>
        data={rows}
        columns={columns}
        keyField="id"
        searchable
        searchFields={['title', 'companyName', 'status']}
        onRowClick={(row) => navigate(`/consultant/caps/${row.id}`)}
        emptyMessage="No CAPs match your search."
      />
    </div>
  );
}
