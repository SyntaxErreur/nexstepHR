import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { apiCompanies, apiCAP } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { Company, CAP } from '@/types';

interface ReportRow {
  id: string;
  capId: string;
  capTitle: string;
  companyName: string;
  reportVersion: number;
  generatedAt: string;
  accessLevel: string;
}

export default function ConsultantReports() {
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

  const rows: ReportRow[] = useMemo(() => {
    if (!allCaps.data || !companies.data) return [];
    const assignedCompanyIds = new Set(
      companies.data.filter((c) => assignedIds.includes(c.id)).map((c) => c.id)
    );
    return allCaps.data
      .filter((cap) => assignedCompanyIds.has(cap.companyId) && cap.report !== null)
      .map((cap) => ({
        id: cap.report!.id,
        capId: cap.id,
        capTitle: cap.title,
        companyName: companyMap[cap.companyId] ?? 'Unknown',
        reportVersion: cap.report!.version,
        generatedAt: cap.report!.generatedAt,
        accessLevel: cap.report!.accessLevel,
      }));
  }, [allCaps.data, companies.data, assignedIds, companyMap]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Reports"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Reports' },
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
      key: 'capTitle',
      header: 'CAP Title',
      sortable: true,
      render: (row: ReportRow) => (
        <Link
          to={`/consultant/caps/${row.capId}`}
          className="font-medium text-primary hover:underline"
        >
          {row.capTitle}
        </Link>
      ),
    },
    {
      key: 'companyName',
      header: 'Company',
      sortable: true,
      render: (row: ReportRow) => (
        <span className="text-muted-foreground">{row.companyName}</span>
      ),
    },
    {
      key: 'reportVersion',
      header: 'Version',
      sortable: true,
      render: (row: ReportRow) => (
        <Badge variant="outline" className="font-mono">
          v{row.reportVersion}
        </Badge>
      ),
    },
    {
      key: 'accessLevel',
      header: 'Access',
      render: (row: ReportRow) => (
        <Badge
          variant={row.accessLevel === 'advanced' ? 'default' : 'secondary'}
        >
          {row.accessLevel.charAt(0).toUpperCase() + row.accessLevel.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'generatedAt',
      header: 'Generated',
      sortable: true,
      render: (row: ReportRow) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.generatedAt)}
        </span>
      ),
    },
  ];

  if (rows.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Reports"
          subtitle="Generated reports across your companies"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Reports' },
          ]}
        />
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title="No reports yet"
          description="Reports will appear here once CAPs have been completed and reports generated."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports"
        subtitle={`${rows.length} reports across your assigned companies`}
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'Reports' },
        ]}
      />

      <DataTable<ReportRow>
        data={rows}
        columns={columns}
        keyField="id"
        searchable
        searchFields={['capTitle', 'companyName']}
        emptyMessage="No reports match your search."
      />
    </div>
  );
}
