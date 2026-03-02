import { useMemo } from 'react';
import { Building2, FileBarChart, ClipboardCheck, DollarSign, Clock } from 'lucide-react';
import { apiCompanies, apiCAP, apiAudit } from '@/api/mock';
import { db } from '@/api/store';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { KPICard } from '@/components/shared/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/utils';
import type { Company, CAP, AuditLogEntry, Payment } from '@/types';

export default function SuperAdminDashboard() {
  const companies = useAsync<Company[]>(() => apiCompanies.list(), []);
  const caps = useAsync<CAP[]>(() => apiCAP.list(), []);
  const auditLog = useAsync<AuditLogEntry[]>(() => apiAudit.list(), []);

  const payments: Payment[] = useMemo(() => db.getPayments(), []);

  const isLoading = companies.loading || caps.loading || auditLog.loading;
  const hasError = companies.error || caps.error || auditLog.error;

  const handleRetry = () => {
    companies.refetch();
    caps.refetch();
    auditLog.refetch();
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[{ label: 'Super Admin' }, { label: 'Dashboard' }]}
        />
        <ErrorCard
          message={companies.error || caps.error || auditLog.error || 'Failed to load dashboard data.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const totalCompanies = companies.data?.length ?? 0;
  const activeCaps = caps.data?.filter(c => c.status !== 'draft' && c.status !== 'archived').length ?? 0;

  // Submissions today (mock: count submissions from seed data with today's date prefix)
  const today = new Date().toISOString().slice(0, 10);
  const submissionsToday = db.getSubmissions().filter(s => s.submittedAt.startsWith(today)).length;

  // Total revenue: sum of completed payments
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const recentAudit = (auditLog.data ?? []).slice(0, 5);

  // Monthly submissions mock data (last 6 months)
  const monthlyData = [
    { month: 'Oct', count: 12 },
    { month: 'Nov', count: 18 },
    { month: 'Dec', count: 8 },
    { month: 'Jan', count: 24 },
    { month: 'Feb', count: 31 },
    { month: 'Mar', count: submissionsToday + 15 },
  ];
  const maxCount = Math.max(...monthlyData.map(m => m.count));

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview and key metrics"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Dashboard' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Companies"
          value={totalCompanies}
          subtitle="Registered on platform"
          icon={<Building2 className="h-5 w-5" />}
          trend={{ value: 12, label: 'vs last quarter' }}
        />
        <KPICard
          title="Active CAPs"
          value={activeCaps}
          subtitle="Non-draft, non-archived"
          icon={<FileBarChart className="h-5 w-5" />}
          trend={{ value: 8, label: 'vs last month' }}
        />
        <KPICard
          title="Submissions Today"
          value={submissionsToday}
          subtitle="Responses received today"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Total Revenue"
          value={`INR ${totalRevenue.toLocaleString()}`}
          subtitle="From completed payments"
          icon={<DollarSign className="h-5 w-5" />}
          trend={{ value: 25, label: 'vs last quarter' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No recent activity recorded.
              </p>
            ) : (
              <div className="space-y-4">
                {recentAudit.map(entry => (
                  <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="flex-shrink-0 mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {entry.userName.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="text-foreground">{entry.userName}</span>
                        {' '}
                        <span className="text-muted-foreground font-normal">{entry.action.toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{entry.details}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(entry.timestamp)}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {entry.entityType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Submissions Chart (Bar chart placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-muted-foreground" />
              Monthly Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-3 h-48 pt-4">
              {monthlyData.map(item => {
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.count}</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '140px' }}>
                      <div
                        className="w-full max-w-[48px] bg-primary/80 rounded-t-md transition-all hover:bg-primary"
                        style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{item.month}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Last 6 months of submission activity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
