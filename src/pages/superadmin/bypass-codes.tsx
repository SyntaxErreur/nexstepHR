import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { apiBypassCodes, apiUsers } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { BypassCode, User } from '@/types';
import { Plus, KeyRound, Check, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function SuperAdminBypassCodesPage() {
  const navigate = useNavigate();

  const {
    data: codes,
    loading: codesLoading,
    error: codesError,
    refetch: refetchCodes,
  } = useAsync(() => apiBypassCodes.list(), []);

  const {
    data: users,
    loading: usersLoading,
  } = useAsync(() => apiUsers.list(), []);

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    (users || []).forEach(u => { map[u.id] = u; });
    return map;
  }, [users]);

  const loading = codesLoading || usersLoading;

  if (loading && !codes) return <PageSkeleton />;
  if (codesError) return <ErrorCard message={codesError} onRetry={refetchCodes} />;

  const codeList = codes || [];

  const columns = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (bc: BypassCode) => (
        <span className="font-mono font-semibold text-sm">{bc.code}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (bc: BypassCode) => (
        <span className="text-sm">{formatDateTime(bc.createdAt)}</span>
      ),
    },
    {
      key: 'createdByUserId',
      header: 'Created By',
      render: (bc: BypassCode) => {
        const creator = userMap[bc.createdByUserId];
        return (
          <span className="text-sm">
            {creator ? creator.name : bc.createdByUserId}
          </span>
        );
      },
    },
    {
      key: 'usedAt',
      header: 'Status',
      sortable: true,
      render: (bc: BypassCode) =>
        bc.usedAt ? (
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Used</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-yellow-600" />
            <span className="text-sm text-yellow-700 font-medium">Available</span>
          </div>
        ),
    },
    {
      key: 'usedForCapId',
      header: 'Used For CAP',
      render: (bc: BypassCode) =>
        bc.usedForCapId ? (
          <Badge variant="outline" className="text-xs font-mono">
            {bc.usedForCapId}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">--</span>
        ),
    },
    {
      key: 'usedAtDate',
      header: 'Used Date',
      render: (bc: BypassCode) =>
        bc.usedAt ? (
          <span className="text-sm">{formatDateTime(bc.usedAt)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">--</span>
        ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Bypass Codes"
        subtitle="Manage payment bypass codes for assessments."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Bypass Codes' },
        ]}
        actions={
          <Button onClick={() => navigate('/sa/bypass-codes/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate New Code
          </Button>
        }
      />

      {codeList.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-8 w-8 text-muted-foreground" />}
          title="No Bypass Codes"
          description="No bypass codes have been generated yet. Create one to allow sponsors to bypass payment."
          action={{ label: 'Generate Code', onClick: () => navigate('/sa/bypass-codes/new') }}
        />
      ) : (
        <DataTable
          data={codeList}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['code']}
          emptyMessage="No bypass codes found."
        />
      )}
    </div>
  );
}
