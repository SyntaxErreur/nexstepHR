import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { apiCompanies, apiCAP } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import type { Company, CAP } from '@/types';

interface CompanyRow {
  id: string;
  name: string;
  country: string;
  capsCount: number;
  activeCaps: number;
  status: string;
}

export default function ConsultantCompanies() {
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

  const rows: CompanyRow[] = useMemo(() => {
    if (!companies.data || !allCaps.data) return [];
    const assigned = companies.data.filter((c) => assignedIds.includes(c.id));
    return assigned.map((company) => {
      const companyCaps = allCaps.data!.filter(
        (cap) => cap.companyId === company.id
      );
      const active = companyCaps.filter(
        (c) => c.status !== 'draft' && c.status !== 'archived'
      );
      return {
        id: company.id,
        name: company.name,
        country: company.countryOfOperations.join(', ') || 'N/A',
        capsCount: companyCaps.length,
        activeCaps: active.length,
        status: active.length > 0 ? 'active' : 'inactive',
      };
    });
  }, [companies.data, allCaps.data, assignedIds]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="My Companies"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Companies' },
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
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (row: CompanyRow) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
    },
    {
      key: 'capsCount',
      header: 'Total CAPs',
      sortable: true,
      render: (row: CompanyRow) => (
        <span className="font-mono text-sm">{row.capsCount}</span>
      ),
    },
    {
      key: 'activeCaps',
      header: 'Active CAPs',
      sortable: true,
      render: (row: CompanyRow) => (
        <Badge variant={row.activeCaps > 0 ? 'default' : 'secondary'}>
          {row.activeCaps}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: CompanyRow) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {row.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (rows.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="My Companies"
          subtitle="Companies assigned to you"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Companies' },
          ]}
        />
        <EmptyState
          icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
          title="No companies assigned"
          description="You have not been assigned to any companies yet. Contact your Super Admin for access."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Companies"
        subtitle={`${rows.length} companies assigned to you`}
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'Companies' },
        ]}
      />

      <DataTable<CompanyRow>
        data={rows}
        columns={columns}
        keyField="id"
        searchable
        searchFields={['name', 'country']}
        onRowClick={(row) => navigate(`/consultant/companies/${row.id}`)}
        emptyMessage="No companies match your search."
      />
    </div>
  );
}
