import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Table,
  BarChart3,
  Lightbulb,
  BookOpen,
  ClipboardList,
  Download,
} from 'lucide-react';
import { api } from '@/api/mock';
import { generatePDF } from '@/lib/pdf-generator';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { MaterialityBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CAP, CAPParameter, ContextSelection } from '@/types';

interface ReportData {
  cap: CAP;
  executiveSummary: string;
  contextSelections: ContextSelection[];
  materialityTable: CAPParameter[];
  roleResponseSummary: { role: string; count: number; avgScore: number }[];
  dimensionScores: {
    dimension: string;
    avgScore: number;
    weight: number;
    materiality: string;
  }[];
  recommendations: string[];
  submissionCount: number;
}

export default function CAPReport() {
  const { capId } = useParams<{ capId: string }>();

  const report = useAsync<ReportData>(
    () => api.reports.getReportData(capId!) as Promise<ReportData>,
    [capId]
  );

  if (report.loading) return <PageSkeleton />;

  if (report.error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Report"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Report' },
          ]}
        />
        <ErrorCard
          message={report.error || 'Failed to load report data.'}
          onRetry={report.refetch}
        />
      </div>
    );
  }

  const data = report.data!;
  const cap = data.cap;
  const isPaid =
    cap.paymentStatus === 'paid' || cap.paymentStatus === 'bypassed';

  return (
    <div className="p-6 space-y-6 relative">
      {/* Watermark for unpaid */}
      {!isPaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="transform rotate-[-30deg] select-none">
            <p className="text-6xl font-bold text-red-500/15 whitespace-nowrap">
              PREVIEW - Unlock for full report
            </p>
          </div>
        </div>
      )}

      <PageHeader
        title="Assessment Report"
        subtitle={cap.title}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title, href: `/app/caps/${capId}` },
          { label: 'Report' },
        ]}
        actions={
          <div className="flex gap-2">
            {isPaid && (
              <Button onClick={async () => {
                const company = await api.companies.getById(cap.companyId);
                generatePDF({
                  companyName: company.name,
                  capTitle: cap.title,
                  generatedDate: cap.report?.generatedAt ? new Date(cap.report.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
                  status: cap.status,
                  executiveSummary: data.executiveSummary,
                  contextSelections: data.contextSelections,
                  materialityTable: data.materialityTable,
                  roleResponseSummary: data.roleResponseSummary,
                  dimensionScores: data.dimensionScores,
                  recommendations: data.recommendations,
                  submissionCount: data.submissionCount,
                });
              }}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
            <Link to={`/app/caps/${capId}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to CAP
              </Button>
            </Link>
          </div>
        }
      />

      {!isPaid && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Preview Mode
                  </p>
                  <p className="text-xs text-amber-600">
                    This report is a preview. Unlock to access the full report
                    without watermarks.
                  </p>
                </div>
              </div>
              <Link to={`/app/caps/${capId}/payment`}>
                <Button size="sm">Unlock Report</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {data.executiveSummary}
          </p>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
            <div>
              <span className="text-muted-foreground">Total Responses:</span>{' '}
              <span className="font-semibold">{data.submissionCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Report Version:</span>{' '}
              <span className="font-semibold">
                {cap.report?.version ?? 1}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <Badge
                variant={isPaid ? 'default' : 'secondary'}
              >
                {isPaid ? 'Full Access' : 'Preview'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Context Selections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            Context Selections
          </CardTitle>
          <CardDescription>
            The organizational context parameters used for this assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Selected Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.contextSelections.map((sel, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-0 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">
                      {sel.categoryNameSnapshot}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {sel.valueLabelSnapshot}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Materiality Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Materiality Table
          </CardTitle>
          <CardDescription>
            Dimension weights and materiality levels derived from context
            selections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Dimension
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Weight (%)
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Materiality
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.materialityTable.map((param) => (
                  <tr
                    key={param.key}
                    className="border-b last:border-0 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{param.label}</td>
                    <td className="px-4 py-3">{param.weightPct}%</td>
                    <td className="px-4 py-3">
                      <MaterialityBadge level={param.materialityLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Dimension Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dimension Scores
          </CardTitle>
          <CardDescription>
            Average assessment scores per dimension across all submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.dimensionScores.map((dim) => {
              const barColor =
                dim.avgScore >= 75
                  ? 'bg-green-500'
                  : dim.avgScore >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500';
              return (
                <div key={dim.dimension} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{dim.dimension}</span>
                      <MaterialityBadge level={dim.materiality} />
                    </div>
                    <span className="text-muted-foreground font-semibold">
                      {dim.avgScore}/100
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${dim.avgScore}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Role Response Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Table className="h-5 w-5 text-primary" />
            Role Response Summary
          </CardTitle>
          <CardDescription>
            Response counts and average scores by role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Responses
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Avg Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.roleResponseSummary.map((role) => (
                  <tr
                    key={role.role}
                    className="border-b last:border-0 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{role.role}</td>
                    <td className="px-4 py-3">{role.count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{role.avgScore}</span>
                        <div className="flex-1 max-w-[120px] h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              role.avgScore >= 75
                                ? 'bg-green-500'
                                : role.avgScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${role.avgScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recommendations
          </CardTitle>
          <CardDescription>
            Action items based on materiality and score analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recommendations.map((rec, idx) => {
              const isCritical = rec.startsWith('Critical:');
              const isPriority = rec.startsWith('Priority:');
              const isAttention = rec.startsWith('Attention:');

              const borderColor = isCritical
                ? 'border-l-red-500'
                : isPriority
                ? 'border-l-amber-500'
                : isAttention
                ? 'border-l-blue-500'
                : 'border-l-green-500';

              const bgColor = isCritical
                ? 'bg-red-50/50'
                : isPriority
                ? 'bg-amber-50/50'
                : isAttention
                ? 'bg-blue-50/50'
                : 'bg-green-50/50';

              return (
                <div
                  key={idx}
                  className={`rounded-lg border-l-4 ${borderColor} ${bgColor} p-4`}
                >
                  <p className="text-sm leading-relaxed">{rec}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
