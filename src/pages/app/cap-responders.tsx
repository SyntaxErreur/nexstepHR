import { useParams, useNavigate } from 'react-router-dom';
import {
  Users, Send, RefreshCw, Copy, XCircle, RotateCcw, Calendar, Mail,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { KPICard } from '@/components/shared/kpi-card';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { CAP, ResponderInvite } from '@/types';

export default function CAPResponders() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isSponsor = user?.role === 'SPONSOR';

  const { data: cap, loading: capLoading, error: capError } = useAsync<CAP>(
    () => api.cap.getById(capId!),
    [capId],
  );

  const {
    data: invites,
    loading: invitesLoading,
    error: invitesError,
    refetch,
  } = useAsync<ResponderInvite[]>(
    () => api.invites.listByCAP(capId!),
    [capId],
  );

  const isLoading = capLoading || invitesLoading;
  const hasError = capError || invitesError;

  const handleResend = async (invite: ResponderInvite) => {
    try {
      await api.invites.resend(invite.id);
      toast.success(`Invite resent to ${invite.emailOrPhone}`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend invite.');
    }
  };

  const handleRevoke = async (invite: ResponderInvite) => {
    try {
      await api.invites.revoke(invite.id);
      toast.success(`Invite to ${invite.emailOrPhone} has been revoked.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invite.');
    }
  };

  const handleCopyLink = (invite: ResponderInvite) => {
    const link = `${window.location.origin}/responder/${invite.token}`;
    navigator.clipboard.writeText(link).then(
      () => toast.success('Invite link copied to clipboard.'),
      () => toast.error('Failed to copy link.'),
    );
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="Responders"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAP', href: `/app/caps/${capId}` },
            { label: 'Responders' },
          ]}
        />
        <ErrorCard
          message={capError || invitesError || 'Failed to load data.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  const inviteList = invites || [];

  // Status counts
  const sentCount = inviteList.filter((i) => i.status === 'sent').length;
  const openedCount = inviteList.filter((i) => i.status === 'opened').length;
  const submittedCount = inviteList.filter((i) => i.status === 'submitted').length;
  const expiredCount = inviteList.filter((i) => i.status === 'expired').length;

  const columns = [
    {
      key: 'emailOrPhone',
      header: 'Email / Phone',
      sortable: true,
      render: (item: ResponderInvite) => (
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{item.emailOrPhone}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item: ResponderInvite) => <StatusBadge status={item.status} />,
    },
    {
      key: 'roleHint',
      header: 'Role Hint',
      render: (item: ResponderInvite) => (
        <span className="text-sm text-muted-foreground">
          {item.roleHint || '--'}
        </span>
      ),
    },
    {
      key: 'sentAt',
      header: 'Sent',
      sortable: true,
      render: (item: ResponderInvite) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(item.sentAt)}
        </span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      sortable: true,
      render: (item: ResponderInvite) => {
        const isExpired = new Date(item.expiresAt) < new Date();
        return (
          <span
            className={`text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
          >
            {formatDate(item.expiresAt)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ResponderInvite) => (
        <div className="flex items-center gap-1">
          {(item.status === 'sent' || item.status === 'opened') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleResend(item);
              }}
              title="Resend invite"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          {item.status !== 'submitted' && item.status !== 'expired' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRevoke(item);
              }}
              title="Revoke invite"
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink(item);
            }}
            title="Copy invite link"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Responders"
        subtitle={`Manage invites and responders for "${cap.title}"`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title, href: `/app/caps/${cap.id}` },
          { label: 'Responders' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {isSponsor && (
              <Button
                size="sm"
                onClick={() => navigate(`/app/caps/${cap.id}/responders/new`)}
              >
                <Send className="h-4 w-4 mr-2" />
                Invite Responders
              </Button>
            )}
          </div>
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Sent"
          value={sentCount}
          subtitle="Awaiting response"
          icon={<Send className="h-5 w-5" />}
        />
        <KPICard
          title="Opened"
          value={openedCount}
          subtitle="Link accessed"
          icon={<Mail className="h-5 w-5" />}
        />
        <KPICard
          title="Submitted"
          value={submittedCount}
          subtitle="Responses received"
          icon={<Users className="h-5 w-5" />}
        />
        <KPICard
          title="Expired"
          value={expiredCount}
          subtitle="No longer valid"
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Invites Table */}
      {inviteList.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={<Users className="h-8 w-8 text-muted-foreground" />}
              title="No Responders Invited"
              description={isSponsor ? "Start by inviting responders to participate in this assessment." : "No responders have been invited yet."}
              action={isSponsor ? {
                label: 'Invite Responders',
                onClick: () =>
                  navigate(`/app/caps/${cap.id}/responders/new`),
              } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Invite List
            </CardTitle>
            <CardDescription>
              {inviteList.length} total invite{inviteList.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={inviteList}
              columns={columns}
              keyField="id"
              searchable
              searchFields={['emailOrPhone', 'roleHint', 'status']}
              emptyMessage="No invites match your search."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
