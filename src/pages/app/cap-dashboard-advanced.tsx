import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart3,
  Users,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Lock,
  Download,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { KPICard } from '@/components/shared/kpi-card';
import { MaterialityBadge } from '@/components/shared/status-badge';
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

export default function CAPDashboardAdvanced() {
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
  const isPaid =
    cap?.paymentStatus === 'paid' || cap?.paymentStatus === 'bypassed';
  const isBypassed = cap?.paymentStatus === 'bypassed';

  // KPI values
  const kpis = useMemo(() => {
    if (!report.data) return null;
    const dims = report.data.dimensionScores;
    const avgOverall =
      dims.length > 0
        ? Math.round(dims.reduce((s, d) => s + d.avgScore, 0) / dims.length)
        : 0;
    const highest =
      dims.length > 0
        ? dims.reduce((max, d) => (d.avgScore > max.avgScore ? d : max), dims[0])
        : null;
    const lowest =
      dims.length > 0
        ? dims.reduce((min, d) => (d.avgScore < min.avgScore ? d : min), dims[0])
        : null;
    return { avgOverall, highest, lowest };
  }, [report.data]);

  // Dimension drilldown: score by role for each dimension
  const dimensionByRole = useMemo(() => {
    if (!submissions.data || !report.data) return [];

    const dims = report.data.dimensionScores.map((d) => d.dimension);
    const roles = Array.from(
      new Set(submissions.data.map((s) => s.responderMeta.selectedRole))
    );

    return report.data.dimensionScores.map((dim) => {
      const dimKey = dim.dimension
        .replace(/\s+/g, '_')
        .replace(/\//g, '_')
        .toLowerCase();

      const roleScores = roles.map((role) => {
        const roleSubs = submissions.data!.filter(
          (s) => s.responderMeta.selectedRole === role
        );
        const scores = roleSubs
          .map((s) => {
            const match = s.computedScores.find(
              (cs) =>
                cs.dimensionKey.replace(/_/g, ' ').toLowerCase() ===
                  dim.dimension.toLowerCase() ||
                cs.dimensionKey === dimKey
            );
            return match?.score ?? null;
          })
          .filter((sc): sc is number => sc !== null);

        const avg =
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        return { role, avgScore: avg, count: scores.length };
      });

      return {
        dimension: dim.dimension,
        materiality: dim.materiality,
        overallScore: dim.avgScore,
        roleScores,
      };
    });
  }, [submissions.data, report.data]);

  // Tenure analysis
  const tenureAnalysis = useMemo(() => {
    if (!submissions.data) return [];

    const tenureMap: Record<string, { scores: number[]; count: number }> = {};
    submissions.data.forEach((sub) => {
      const band = sub.responderMeta.tenureBand;
      if (!tenureMap[band]) tenureMap[band] = { scores: [], count: 0 };
      tenureMap[band].count += 1;
      const avgScore =
        sub.computedScores.length > 0
          ? sub.computedScores.reduce((s, c) => s + c.score, 0) /
            sub.computedScores.length
          : 0;
      tenureMap[band].scores.push(avgScore);
    });

    return Object.entries(tenureMap).map(([band, data]) => ({
      band,
      count: data.count,
      avgScore: Math.round(
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ),
    }));
  }, [submissions.data]);

  // Gap analysis: High materiality + low score
  const gapAnalysis = useMemo(() => {
    if (!report.data) return [];
    return report.data.dimensionScores
      .filter((d) => d.materiality === 'High' && d.avgScore < 70)
      .sort((a, b) => a.avgScore - b.avgScore);
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

  // Role distribution
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
          title="Advanced Dashboard"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Advanced Dashboard' },
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

  // Paywall for unpaid
  if (!isPaid) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Advanced Dashboard"
          subtitle={cap?.title || 'Assessment Dashboard'}
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: cap?.title || 'CAP', href: `/app/caps/${capId}` },
            { label: 'Advanced Dashboard' },
          ]}
        />
        <div className="relative">
          {/* Blurred content behind paywall */}
          <div className="blur-md pointer-events-none select-none space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground">Metric {i}</p>
                    <p className="text-3xl font-bold mt-1">{i * 23}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6 h-48" />
            </Card>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6 h-64" />
              </Card>
              <Card>
                <CardContent className="p-6 h-64" />
              </Card>
            </div>
          </div>

          {/* Paywall overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-lg">
            <div className="text-center max-w-md">
              <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Unlock Advanced Analytics
              </h2>
              <p className="text-muted-foreground mb-6">
                Get deeper insights with dimension drilldowns, tenure analysis,
                materiality gap analysis, and data export. Upgrade to access the
                full advanced dashboard.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link to={`/app/caps/${capId}/payment`}>
                  <Button size="lg">
                    <Lock className="h-4 w-4 mr-2" />
                    Unlock Now
                  </Button>
                </Link>
                <Link to={`/app/caps/${capId}/dashboard`}>
                  <Button variant="outline" size="lg">
                    View Basic Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dims = report.data?.dimensionScores ?? [];

  const handleExport = () => {
    toast.success('Export started. Your data file will be ready shortly.');
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Advanced Dashboard"
        subtitle={cap?.title || 'Assessment Dashboard'}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: cap?.title || 'CAP', href: `/app/caps/${capId}` },
          { label: 'Advanced Dashboard' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isBypassed && (
              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Bypass Applied
              </Badge>
            )}
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
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
                      <MaterialityBadge level={dim.materiality} />
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

      {/* Dimension Drilldown: Score by Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Dimension Drilldown by Role
          </CardTitle>
          <CardDescription>
            Average scores broken down by responder role for each dimension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {dimensionByRole.map((dim) => (
              <div key={dim.dimension} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{dim.dimension}</h4>
                  <MaterialityBadge level={dim.materiality} />
                  <span className="text-xs text-muted-foreground ml-auto">
                    Overall: {dim.overallScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {dim.roleScores
                    .filter((rs) => rs.count > 0)
                    .map((rs) => {
                      const barColor =
                        rs.avgScore >= 75
                          ? 'bg-green-500'
                          : rs.avgScore >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-500';
                      return (
                        <div
                          key={rs.role}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {rs.role}
                            </p>
                            <div className="h-1.5 w-full rounded-full bg-secondary mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${rs.avgScore}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">
                            {rs.avgScore}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tenure Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tenure Analysis</CardTitle>
          <CardDescription>
            Average scores grouped by responder tenure band
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenureAnalysis.map((tenure) => {
              const barColor =
                tenure.avgScore >= 75
                  ? 'bg-blue-500'
                  : tenure.avgScore >= 50
                  ? 'bg-blue-400'
                  : 'bg-blue-300';
              return (
                <div key={tenure.band} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{tenure.band}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {tenure.count} response{tenure.count !== 1 ? 's' : ''}
                      </span>
                      <span className="font-semibold text-muted-foreground">
                        {tenure.avgScore}/100
                      </span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${tenure.avgScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Materiality vs Score Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Materiality vs Score Gap Analysis
          </CardTitle>
          <CardDescription>
            Dimensions where materiality is High but the assessment score is
            below 70 -- these represent critical gaps requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gapAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">No critical gaps detected</p>
              <p className="text-xs text-muted-foreground">
                All high-materiality dimensions are scoring at or above 70/100.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gapAnalysis.map((dim) => {
                const gap = 70 - dim.avgScore;
                return (
                  <div
                    key={dim.dimension}
                    className="rounded-lg border border-red-200 bg-red-50/50 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {dim.dimension}
                        </span>
                        <MaterialityBadge level={dim.materiality} />
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-red-600">
                          {dim.avgScore}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /100
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-red-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-red-500"
                        style={{ width: `${dim.avgScore}%` }}
                      />
                    </div>
                    <p className="text-xs text-red-600 mt-2">
                      Score gap of {gap} points below threshold. Weight:{' '}
                      {dim.weight}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
