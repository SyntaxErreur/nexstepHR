import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Lock,
} from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { KPICard } from '@/components/shared/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { CAP, ResponseSubmission } from '@/types';

interface ReportData {
  cap: CAP;
  executiveSummary: string;
  dimensionScores: {
    dimension: string;
    avgScore: number;
    weight: number;
    materiality: string;
  }[];
  roleResponseSummary: { role: string; count: number; avgScore: number }[];
  recommendations: string[];
  submissionCount: number;
}

export default function CAPDashboardBasic() {
  const { capId } = useParams<{ capId: string }>();

  const report = useAsync<ReportData>(
    () => api.reports.getReportData(capId!) as Promise<ReportData>,
    [capId]
  );

  const submissions = useAsync<ResponseSubmission[]>(
    () => api.submissions.listByCAP(capId!),
    [capId]
  );

  const isLoading = report.loading || submissions.loading;
  const hasError = report.error || submissions.error;

  const cap = report.data?.cap;
  const isPaid = cap?.paymentStatus === 'paid' || cap?.paymentStatus === 'bypassed';

  // Compute KPI values
  const kpis = useMemo(() => {
    if (!report.data) return null;
    const dims = report.data.dimensionScores;
    const avgOverall =
      dims.length > 0
        ? Math.round(dims.reduce((s, d) => s + d.avgScore, 0) / dims.length)
        : 0;
    const highest = dims.length > 0
      ? dims.reduce((max, d) => (d.avgScore > max.avgScore ? d : max), dims[0])
      : null;
    const lowest = dims.length > 0
      ? dims.reduce((min, d) => (d.avgScore < min.avgScore ? d : min), dims[0])
      : null;
    return { avgOverall, highest, lowest };
  }, [report.data]);

  // Submission timeline
  const timeline = useMemo(() => {
    if (!submissions.data) return [];
    return [...submissions.data]
      .sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
      .slice(0, 10);
  }, [submissions.data]);

  // Role distribution for pie chart mock
  const roleDistribution = useMemo(() => {
    if (!report.data) return [];
    const total = report.data.roleResponseSummary.reduce(
      (s, r) => s + r.count,
      0
    );
    const colors = [
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-purple-500',
      'bg-rose-500',
      'bg-cyan-500',
    ];
    return report.data.roleResponseSummary.map((r, i) => ({
      ...r,
      percentage: total > 0 ? Math.round((r.count / total) * 100) : 0,
      color: colors[i % colors.length],
    }));
  }, [report.data]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Dashboard"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Dashboard' },
          ]}
        />
        <ErrorCard
          message={
            report.error || submissions.error || 'Failed to load dashboard.'
          }
          onRetry={() => {
            report.refetch();
            submissions.refetch();
          }}
        />
      </div>
    );
  }

  const dims = report.data?.dimensionScores ?? [];
  const maxScore = Math.max(...dims.map((d) => d.avgScore), 1);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={cap?.title || 'Assessment Dashboard'}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: cap?.title || 'CAP', href: `/app/caps/${capId}` },
          { label: 'Dashboard' },
        ]}
        actions={
          <Link to={`/app/caps/${capId}/dashboard/advanced`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Advanced Dashboard
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Submissions"
          value={report.data?.submissionCount ?? 0}
          subtitle={`of ${cap?.respondersInvitedCount ?? 0} invited`}
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Avg Overall Score"
          value={`${kpis?.avgOverall ?? 0}/100`}
          subtitle="Across all dimensions"
          icon={<BarChart3 className="h-5 w-5" />}
        />
        <KPICard
          title="Highest Dimension"
          value={kpis?.highest?.avgScore ?? 0}
          subtitle={kpis?.highest?.dimension ?? '--'}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          title="Lowest Dimension"
          value={kpis?.lowest?.avgScore ?? 0}
          subtitle={kpis?.lowest?.dimension ?? '--'}
          icon={<TrendingDown className="h-5 w-5" />}
        />
      </div>

      {/* Dimension Scores Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimension Scores</CardTitle>
          <CardDescription>
            Average scores across all submissions per dimension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dims.map((dim) => {
              const widthPercent = (dim.avgScore / 100) * 100;
              const barColor =
                dim.avgScore >= 75
                  ? 'bg-green-500'
                  : dim.avgScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500';
              return (
                <div key={dim.dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dim.dimension}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {dim.materiality}
                      </Badge>
                      <span className="text-muted-foreground font-semibold">
                        {dim.avgScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Distribution</CardTitle>
            <CardDescription>
              Submissions breakdown by responder role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roleDistribution.map((role) => (
                <div key={role.role} className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${role.color}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{role.role}</span>
                      <span className="text-sm text-muted-foreground">
                        {role.count} ({role.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${role.color}`}
                        style={{ width: `${role.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submission Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submission Timeline</CardTitle>
            <CardDescription>Most recent responses</CardDescription>
          </CardHeader>
          <CardContent>
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No submissions yet.
              </p>
            ) : (
              <div className="space-y-3">
                {timeline.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 pb-3 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex-shrink-0">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {sub.responderMeta.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sub.responderMeta.selectedRole} &middot;{' '}
                        {sub.responderMeta.tenureBand}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDate(sub.submittedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gated Cards - Blurred with Upgrade overlay */}
      {!isPaid && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Blurred Tenure Analysis Card */}
          <div className="relative">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Tenure Analysis</CardTitle>
              </CardHeader>
              <CardContent className="blur-sm pointer-events-none select-none">
                <div className="space-y-3">
                  {['0-1 years', '1-3 years', '3-5 years', '5-10 years'].map(
                    (band) => (
                      <div key={band} className="flex items-center gap-3">
                        <span className="text-sm w-24">{band}</span>
                        <div className="flex-1 h-3 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{
                              width: `${Math.random() * 60 + 20}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {Math.floor(Math.random() * 40 + 40)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <Lock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm">Upgrade to unlock</p>
              <Link to={`/app/caps/${capId}/payment`}>
                <Button size="sm" className="mt-2">
                  Unlock Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Blurred Gap Analysis Card */}
          <div className="relative">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">
                  Materiality vs Score Gap
                </CardTitle>
              </CardHeader>
              <CardContent className="blur-sm pointer-events-none select-none">
                <div className="space-y-3">
                  {dims.slice(0, 4).map((dim) => (
                    <div
                      key={dim.dimension}
                      className="flex items-center justify-between pb-2 border-b"
                    >
                      <span className="text-sm">{dim.dimension}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{dim.materiality}</Badge>
                        <span className="text-sm font-semibold">
                          {dim.avgScore}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <Lock className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm">Upgrade to unlock</p>
              <Link to={`/app/caps/${capId}/payment`}>
                <Button size="sm" className="mt-2">
                  Unlock Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
