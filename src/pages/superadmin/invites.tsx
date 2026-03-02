import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { apiInvites, apiCAP } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { ResponderInvite, CAP } from '@/types';
import { Mail, Search } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

interface InviteRow extends ResponderInvite {
  capTitle: string;
}

export default function SuperAdminInvitesPage() {
  const [search, setSearch] = useState('');

  // Load all CAPs first, then load invites for each
  const {
    data: caps,
    loading: capsLoading,
    error: capsError,
    refetch: refetchCaps,
  } = useAsync(() => apiCAP.list(), []);

  const {
    data: allInvites,
    loading: invitesLoading,
    error: invitesError,
    refetch: refetchInvites,
  } = useAsync(async () => {
    if (!caps || caps.length === 0) return [];
    const results: InviteRow[] = [];
    for (const cap of caps) {
      try {
        const invites = await apiInvites.listByCAP(cap.id);
        invites.forEach(inv => {
          results.push({ ...inv, capTitle: cap.title });
        });
      } catch {
        // Skip failed CAP invite loads
      }
    }
    // Sort by sentAt descending
    results.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    return results;
  }, [caps]);

  const filteredInvites = useMemo(() => {
    if (!allInvites) return [];
    if (!search) return allInvites;
    const q = search.toLowerCase();
    return allInvites.filter(
      inv =>
        inv.emailOrPhone.toLowerCase().includes(q) ||
        inv.capTitle.toLowerCase().includes(q)
    );
  }, [allInvites, search]);

  const loading = capsLoading || invitesLoading;
  const error = capsError || invitesError;

  if (loading && !allInvites) return <PageSkeleton />;
  if (error) return <ErrorCard message={error} onRetry={() => { refetchCaps(); refetchInvites(); }} />;

  const columns = [
    {
      key: 'emailOrPhone',
      header: 'Email / Phone',
      sortable: true,
      render: (inv: InviteRow) => (
        <span className="font-medium">{inv.emailOrPhone}</span>
      ),
    },
    {
      key: 'capTitle',
      header: 'CAP',
      sortable: true,
      render: (inv: InviteRow) => (
        <span className="text-sm">{inv.capTitle}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (inv: InviteRow) => <StatusBadge status={inv.status} />,
    },
    {
      key: 'roleHint',
      header: 'Role Hint',
      render: (inv: InviteRow) =>
        inv.roleHint ? (
          <span className="text-sm">{inv.roleHint}</span>
        ) : (
          <span className="text-muted-foreground text-sm">--</span>
        ),
    },
    {
      key: 'sentAt',
      header: 'Sent',
      sortable: true,
      render: (inv: InviteRow) => (
        <span className="text-sm">{formatDateTime(inv.sentAt)}</span>
      ),
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      sortable: true,
      render: (inv: InviteRow) => {
        const expired = new Date(inv.expiresAt) < new Date();
        return (
          <span className={`text-sm ${expired ? 'text-destructive' : ''}`}>
            {formatDate(inv.expiresAt)}
            {expired && ' (expired)'}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Invite Logs"
        subtitle="All responder invitations across assessments."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Invite Logs' },
        ]}
      />

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or CAP name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredInvites.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-8 w-8 text-muted-foreground" />}
          title="No Invites Found"
          description={
            search
              ? 'No invites match your search. Try a different query.'
              : 'No responder invites have been sent yet.'
          }
        />
      ) : (
        <DataTable
          data={filteredInvites}
          columns={columns}
          keyField="id"
          emptyMessage="No invites found."
        />
      )}
    </div>
  );
}
