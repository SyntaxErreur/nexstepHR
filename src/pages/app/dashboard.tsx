import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileBarChart,
  ClipboardCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
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

export default function AppDashboard() {
  const user = useAuthStore((s) => s.user);
  const companyId = user?.tenantCompanyId;

  const company = useAsync<Company>(
    () => apiCompanies.getById(companyId!),
    [companyId],
    !!companyId,
  );

  const caps = useAsync<CAP[]>(
    () => apiCAP.list(companyId!),
    [companyId],
    !!companyId,
  );

  const isLoading = company.loading || caps.loading;
  const hasError = company.error || caps.error;

  const handleRetry = () => {
    company.refetch();
    caps.refetch();
  };

  // Derived KPI values
  const kpis = useMemo(() => {
    const all = caps.data ?? [];
    const totalCAPs = all.length;
    const activeCAPs = all.filter(
      (c) => c.status !== 'draft' && c.status !== 'archived',
    ).length;
    const totalSubmissions = all.reduce((sum, c) => sum + c.submissionsCount, 0);
    const reportsReady = all.filter(
      (c) => c.status === 'report_generated' || c.report !== null,
    ).length;
    return { totalCAPs, activeCAPs, totalSubmissions, reportsReady };
  }, [caps.data]);

  // Recent CAPs sorted by updatedAt descending
  const recentCAPs = useMemo(() => {
    const all = caps.data ?? [];
    return [...all]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 6);
  }, [caps.data]);

  // Simple submission trend data based on CAP submissions
  const trendData = useMemo(() => {
    const all = caps.data ?? [];
    // Group CAPs by creation month to simulate a trend
    const monthMap: Record<string, number> = {};
    all.forEach((cap) => {
      const date = new Date(cap.createdAt);
      const key = date.toLocaleString('en-US', {
        month: 'short',
        year: '2-digit',
      });
      monthMap[key] = (monthMap[key] || 0) + cap.submissionsCount;
    });

    // If we have data, use it; otherwise generate placeholder months
    const entries = Object.entries(monthMap);
    if (entries.length === 0) {
      return [
        { label: 'Jan', value: 0 },
        { label: 'Feb', value: 0 },
        { label: 'Mar', value: 0 },
      ];
    }

    return entries.slice(-6).map(([label, value]) => ({ label, value }));
  }, [caps.data]);

  const maxTrend = Math.max(...trendData.map((d) => d.value), 1);

  if (!companyId) {
    return (
      <div className="p-6">
        <PageHeader title="Dashboard" />
        <ErrorCard message="No company associated with your account. Please contact support." />
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[{ label: 'App' }, { label: 'Dashboard' }]}
        />
        <ErrorCard
          message={
            company.error ||
            caps.error ||
            'Failed to load dashboard data.'
          }
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
        subtitle={company.data?.name ?? 'Company Dashboard'}
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'Dashboard' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total CAPs"
          value={kpis.totalCAPs}
          subtitle="Assessments created"
          icon={<FileBarChart className="h-5 w-5" />}
        />
        <KPICard
          title="Active CAPs"
          value={kpis.activeCAPs}
          subtitle="Currently in progress"
          icon={<BarChart3 className="h-5 w-5" />}
          trend={
            kpis.totalCAPs > 0
              ? {
                  value: Math.round(
                    (kpis.activeCAPs / kpis.totalCAPs) * 100,
                  ),
                  label: '% of total',
                }
              : undefined
          }
        />
        <KPICard
          title="Total Submissions"
          value={kpis.totalSubmissions}
          subtitle="Across all assessments"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Reports Ready"
          value={kpis.reportsReady}
          subtitle="Available for review"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent CAPs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-muted-foreground" />
              Recent Assessments
            </CardTitle>
            <Link to="/app/caps">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentCAPs.length === 0 ? (
              <EmptyState
                title="No Assessments Yet"
                description="Create your first CAP assessment to get started."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {recentCAPs.map((cap) => (
                  <Link
                    key={cap.id}
                    to={`/app/caps/${cap.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {cap.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cap.submissionsCount} submissions &middot; Updated{' '}
                        {formatDate(cap.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={cap.status} className="ml-3 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Submission Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpis.totalSubmissions === 0 ? (
              <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
                No submission data to display yet.
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-3 h-48 pt-4">
                  {trendData.map((item) => {
                    const heightPercent =
                      maxTrend > 0 ? (item.value / maxTrend) * 100 : 0;
                    return (
                      <div
                        key={item.label}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <span className="text-xs font-semibold text-foreground">
                          {item.value}
                        </span>
                        <div
                          className="w-full flex items-end justify-center"
                          style={{ height: '140px' }}
                        >
                          <div
                            className="w-full max-w-[48px] bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                            style={{
                              height: `${heightPercent}%`,
                              minHeight: '4px',
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Submissions per assessment period
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
