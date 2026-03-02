import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileBarChart,
  Calendar,
  Users,
  ClipboardCheck,
  Layers,
  BarChart3,
} from 'lucide-react';
import { apiCAP, apiCompanies } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { KPICard } from '@/components/shared/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { CAP, Company } from '@/types';

export default function ConsultantCAPDetail() {
  const { capId } = useParams<{ capId: string }>();

  const { data: cap, loading, error, refetch } = useAsync<CAP>(
    () => apiCAP.getById(capId!),
    [capId]
  );

  const companyId = cap?.companyId;
  const { data: company } = useAsync<Company>(
    () => (companyId ? apiCompanies.getById(companyId) : Promise.reject('No company')),
    [companyId],
    !!companyId
  );

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="CAP Detail"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'CAPs', href: '/consultant/caps' },
            { label: 'Detail' },
          ]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  if (!cap) return null;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={cap.title}
        subtitle={`Read-only view -- ${company?.name ?? 'Loading company...'}`}
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'CAPs', href: '/consultant/caps' },
          { label: cap.title },
        ]}
        actions={<StatusBadge status={cap.status} />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Status"
          value={cap.status.replace(/_/g, ' ').toUpperCase()}
          icon={<FileBarChart className="h-5 w-5" />}
        />
        <KPICard
          title="Submissions"
          value={`${cap.submissionsCount}/${cap.inviteSettings.minSubmissionsTotal}`}
          subtitle="Responses collected"
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <KPICard
          title="Invites Sent"
          value={cap.respondersInvitedCount}
          subtitle="Responders invited"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Payment"
          value={cap.paymentStatus.charAt(0).toUpperCase() + cap.paymentStatus.slice(1)}
          icon={<BarChart3 className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CAP Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-muted-foreground" />
              Assessment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-sm mt-1">
                {cap.description || 'No description provided.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Created
                </p>
                <p className="text-sm mt-1">{formatDate(cap.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Last Updated
                </p>
                <p className="text-sm mt-1">{formatDateTime(cap.updatedAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Invite Settings
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline">
                  Expiry: {cap.inviteSettings.inviteExpiryDays} days
                </Badge>
                <Badge variant="outline">
                  Min Submissions: {cap.inviteSettings.minSubmissionsTotal}
                </Badge>
                <Badge variant={cap.inviteSettings.allowResubmission ? 'default' : 'secondary'}>
                  Resubmission: {cap.inviteSettings.allowResubmission ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Context Selections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Context Selections
            </CardTitle>
            <CardDescription>
              {cap.contextSelections.length} of 8 selections made
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cap.contextSelections.length === 0 ? (
              <EmptyState
                title="No selections"
                description="Context selections have not been made for this CAP yet."
                className="py-8"
              />
            ) : (
              <div className="space-y-3">
                {cap.contextSelections.map((sel, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {sel.categoryNameSnapshot}
                      </p>
                      <p className="text-sm font-medium">
                        {sel.valueLabelSnapshot}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {idx + 1}/8
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outputs */}
      {cap.outputs && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Generated Outputs
            </CardTitle>
            <CardDescription>
              Computed on {formatDateTime(cap.outputs.computedAt)} -- Materiality: {cap.outputs.materialitySummary.high} High, {cap.outputs.materialitySummary.medium} Medium, {cap.outputs.materialitySummary.low} Low
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Parameter
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Weight %
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Materiality
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cap.outputs.parameters.map((param) => (
                    <tr key={param.key} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{param.label}</td>
                      <td className="px-4 py-3 font-mono">
                        {param.weightPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            param.materialityLevel === 'High'
                              ? 'destructive'
                              : param.materialityLevel === 'Medium'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {param.materialityLevel}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Info */}
      {cap.report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="default">Version {cap.report.version}</Badge>
              <span className="text-sm text-muted-foreground">
                Generated: {formatDateTime(cap.report.generatedAt)}
              </span>
              <Badge variant="outline">
                Access: {cap.report.accessLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
