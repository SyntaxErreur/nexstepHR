import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Settings, Users, FileText, BarChart3, CreditCard, Shield,
  Rocket, Send, FileBarChart, Download, Lock, ExternalLink,
  ClipboardList, Calendar, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { KPICard } from '@/components/shared/kpi-card';
import { generatePDF } from '@/lib/pdf-generator';
import { apiReports } from '@/api/mock';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { CAP } from '@/types';

export default function CAPOverview() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: cap, loading, error, refetch } = useAsync<CAP>(
    () => api.cap.getById(capId!),
    [capId],
  );

  const [launching, setLaunching] = useState(false);
  const isSponsor = user?.role === 'SPONSOR';

  if (loading) return <PageSkeleton />;

  if (error || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="CAP Overview"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAP Overview' },
          ]}
        />
        <ErrorCard message={error || 'CAP not found.'} onRetry={refetch} />
      </div>
    );
  }

  const submissionsPercent =
    cap.inviteSettings.minSubmissionsTotal > 0
      ? Math.min(
          Math.round(
            (cap.submissionsCount / cap.inviteSettings.minSubmissionsTotal) * 100,
          ),
          100,
        )
      : 0;

  const handleLaunch = async () => {
    setLaunching(true);
    try {
      await api.cap.launch(cap.id);
      toast.success('CAP launched successfully! It is now active.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to launch CAP.');
    } finally {
      setLaunching(false);
    }
  };

  const quickLinks = [
    { label: 'Outputs', href: `/app/caps/${cap.id}/outputs`, icon: BarChart3 },
    { label: 'Responders', href: `/app/caps/${cap.id}/responders`, icon: Users },
    { label: 'Submissions', href: `/app/caps/${cap.id}/submissions`, icon: ClipboardList },
    { label: 'Dashboard', href: `/app/caps/${cap.id}/dashboard`, icon: FileBarChart },
    { label: 'Billing', href: `/app/caps/${cap.id}/billing`, icon: CreditCard },
    { label: 'Audit', href: `/app/caps/${cap.id}/audit`, icon: Shield },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={cap.title}
        subtitle={cap.description}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Top Row: Status, Submissions, Payment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge
                status={cap.status}
                className="text-sm px-3 py-1"
              />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: {formatDate(cap.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Updated: {formatDateTime(cap.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions Progress Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submissions Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{cap.submissionsCount}</span>
              <span className="text-muted-foreground text-sm">
                / {cap.inviteSettings.minSubmissionsTotal} required
              </span>
            </div>
            <Progress value={submissionsPercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {submissionsPercent}% complete
              {cap.respondersInvitedCount > 0 &&
                ` -- ${cap.respondersInvitedCount} invited`}
            </p>
          </CardContent>
        </Card>

        {/* Payment Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge
              status={cap.paymentStatus}
              className="text-sm px-3 py-1"
            />
            {cap.paymentStatus === 'unpaid' && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/app/caps/${cap.id}/billing`)}
                >
                  <Lock className="h-3.5 w-3.5 mr-2" />
                  Unlock
                </Button>
              </div>
            )}
            {cap.paymentStatus === 'paid' && (
              <p className="text-xs text-green-600">Full access unlocked</p>
            )}
            {cap.paymentStatus === 'bypassed' && (
              <p className="text-xs text-purple-600">
                Access granted via bypass code
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Context Selections Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Context Selections
          </CardTitle>
          <CardDescription>
            {cap.contextSelections.length === 0
              ? 'No context selections have been made yet.'
              : `${cap.contextSelections.length} of 8 categories configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cap.contextSelections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cap.contextSelections.map((sel) => (
                <div
                  key={sel.categoryId}
                  className="flex flex-col rounded-md border px-3 py-2"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {sel.categoryNameSnapshot}
                  </span>
                  <span className="text-sm font-semibold mt-0.5">
                    {sel.valueLabelSnapshot}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No context selections configured. Select contexts to proceed.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons based on status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-muted-foreground" />
            Actions
          </CardTitle>
          <CardDescription>
            Available actions for the current status of this CAP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            {/* Draft + no outputs: Select Contexts (Sponsor only) */}
            {isSponsor && cap.status === 'draft' && !cap.outputs && (
              <Button
                onClick={() => navigate(`/app/caps/${cap.id}/context`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Select Contexts
              </Button>
            )}

            {/* Draft + has outputs: Launch CAP (Sponsor only) */}
            {isSponsor && cap.status === 'draft' && cap.outputs && (
              <Button onClick={handleLaunch} disabled={launching}>
                {launching ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Launch CAP
                  </>
                )}
              </Button>
            )}

            {/* Active / Collecting: Invite Responders (Sponsor always, Member if allowed) */}
            {(cap.status === 'active' || cap.status === 'collecting') && isSponsor && (
              <Button
                onClick={() =>
                  navigate(`/app/caps/${cap.id}/responders/new`)
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Invite Responders
              </Button>
            )}

            {/* Ready: Generate Report (Sponsor only) */}
            {isSponsor && cap.status === 'ready' && (
              <Button
                onClick={() =>
                  navigate(`/app/caps/${cap.id}/report/generate`)
                }
              >
                <FileBarChart className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            )}

            {/* Report Generated: View Report + Download PDF */}
            {cap.status === 'report_generated' && (
              <>
                <Button
                  onClick={() => navigate(`/app/caps/${cap.id}/report`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Report
                </Button>
                {cap.paymentStatus === 'paid' ||
                cap.paymentStatus === 'bypassed' ? (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      toast.info('Generating PDF...');
                      try {
                        const reportData = await apiReports.getReportData(cap.id);
                        const company = await (await import('@/api/mock')).api.companies.getById(cap.companyId);
                        generatePDF({
                          companyName: company.name,
                          capTitle: cap.title,
                          generatedDate: cap.report?.generatedAt ? new Date(cap.report.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
                          status: cap.status,
                          executiveSummary: reportData.executiveSummary,
                          contextSelections: reportData.contextSelections,
                          materialityTable: reportData.materialityTable,
                          roleResponseSummary: reportData.roleResponseSummary,
                          dimensionScores: reportData.dimensionScores,
                          recommendations: reportData.recommendations,
                          submissionCount: reportData.submissionCount,
                        });
                        toast.success('PDF downloaded successfully!');
                      } catch (err: any) {
                        toast.error('Failed to generate PDF: ' + err.message);
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    title="Complete payment to unlock PDF download"
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Download PDF (Locked)
                  </Button>
                )}
              </>
            )}

            {/* If payment is unpaid, Sponsor can unlock */}
            {isSponsor && cap.paymentStatus === 'unpaid' && cap.status !== 'draft' && (
              <Button
                variant="secondary"
                onClick={() => navigate(`/app/caps/${cap.id}/billing`)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Unlock Full Access
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex flex-col items-center gap-2 rounded-lg border p-4 text-center hover:bg-muted/50 transition-colors"
              >
                <link.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">{link.label}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
