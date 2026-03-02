import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FileBarChart, ClipboardCheck, FileText, ArrowRight } from 'lucide-react';
import { apiCompanies, apiCAP } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { KPICard } from '@/components/shared/kpi-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import type { Company, CAP } from '@/types';

export default function ConsultantDashboard() {
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

  const assignedCompanies = useMemo(() => {
    if (!companies.data) return [];
    return companies.data.filter((c) => assignedIds.includes(c.id));
  }, [companies.data, assignedIds]);

  const assignedCaps = useMemo(() => {
    if (!allCaps.data) return [];
    const companyIds = new Set(assignedCompanies.map((c) => c.id));
    return allCaps.data.filter((cap) => companyIds.has(cap.companyId));
  }, [allCaps.data, assignedCompanies]);

  const activeCaps = assignedCaps.filter(
    (c) => c.status !== 'draft' && c.status !== 'archived'
  );

  const totalSubmissions = assignedCaps.reduce(
    (sum, c) => sum + c.submissionsCount,
    0
  );

  const reportsGenerated = assignedCaps.filter((c) => c.report !== null).length;

  const recentCaps = [...assignedCaps]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    assignedCompanies.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [assignedCompanies]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[
            { label: 'Consultant' },
            { label: 'Dashboard' },
          ]}
        />
        <ErrorCard
          message={companies.error || allCaps.error || 'Failed to load data.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.name ?? 'Consultant'}`}
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'Dashboard' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Assigned Companies"
          value={assignedCompanies.length}
          subtitle="Companies you manage"
          icon={<Building2 className="h-5 w-5" />}
        />
        <KPICard
          title="Active CAPs"
          value={activeCaps.length}
          subtitle="Across all companies"
          icon={<FileBarChart className="h-5 w-5" />}
        />
        <KPICard
          title="Total Submissions"
          value={totalSubmissions}
          subtitle="Across all CAPs"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Reports Generated"
          value={reportsGenerated}
          subtitle="Completed assessments"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Recent CAPs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-muted-foreground" />
            Recent CAPs
          </CardTitle>
          <Link to="/consultant/caps">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentCaps.length === 0 ? (
            <EmptyState
              title="No CAPs yet"
              description="CAPs from your assigned companies will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentCaps.map((cap) => (
                <Link
                  key={cap.id}
                  to={`/consultant/caps/${cap.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{cap.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {companyMap[cap.companyId] ?? 'Unknown Company'} --{' '}
                      {cap.submissionsCount} submissions
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(cap.updatedAt)}
                    </span>
                    <StatusBadge status={cap.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
