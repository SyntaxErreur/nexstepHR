import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiUsers, apiCompanies } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAsyncAction } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';
import type { User, Company } from '@/types';

export default function UsersListPage() {
  const currentUser = useAuthStore((s) => s.user);
  const companyId = currentUser?.tenantCompanyId;

  const users = useAsync<User[]>(
    () => apiUsers.list({ companyId: companyId! }),
    [companyId],
    !!companyId,
  );

  const company = useAsync<Company>(
    () => apiCompanies.getById(companyId!),
    [companyId],
    !!companyId,
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const { execute: createUser, loading: inviting } = useAsyncAction(
    async (data: { email: string; role: 'MEMBER' | 'RESPONDER'; tenantCompanyId: string }) => {
      return apiUsers.create({
        email: data.email,
        role: data.role,
        tenantCompanyId: data.tenantCompanyId,
      });
    },
  );

  // Determine if current user can invite
  const canInvite = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === 'SPONSOR') return true;
    if (
      currentUser.role === 'MEMBER' &&
      company.data?.settings.memberCanInvite
    ) {
      return true;
    }
    return false;
  }, [currentUser, company.data]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }
    if (!companyId) return;

    try {
      await createUser({
        email: inviteEmail.trim(),
        role: inviteRole as 'MEMBER' | 'RESPONDER',
        tenantCompanyId: companyId,
      });
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      setInviteRole('MEMBER');
      setDialogOpen(false);
      users.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invite.');
    }
  };

  const isLoading = users.loading || company.loading;
  const hasError = users.error || company.error;

  const handleRetry = () => {
    users.refetch();
    company.refetch();
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <PageHeader title="Team Members" />
        <ErrorCard message="No company associated with your account." />
      </div>
    );
  }

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Team Members"
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'Users' },
          ]}
        />
        <ErrorCard
          message={users.error || company.error || 'Failed to load users.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const userList = users.data ?? [];

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item: User) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {item.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            {item.status === 'invited' && (
              <span className="text-xs text-amber-600">Invite Pending</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (item: User) => (
        <span className="text-sm text-muted-foreground">{item.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (item: User) => (
        <Badge variant="outline" className="text-xs font-medium">
          <Shield className="h-3 w-3 mr-1" />
          {item.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item: User) => <StatusBadge status={item.status} />,
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      sortable: true,
      render: (item: User) => (
        <span className="text-sm text-muted-foreground">
          {item.lastLoginAt ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(item.lastLoginAt)}
            </span>
          ) : (
            <span className="text-xs italic">Never</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Team Members"
        subtitle={`Manage users for ${company.data?.name ?? 'your company'}`}
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'Users' },
        ]}
        actions={
          canInvite && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join {company.data?.name}. They will
                    receive an email with a link to set up their account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      disabled={inviting}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                      Role
                    </label>
                    <Select
                      options={[
                        { value: 'MEMBER', label: 'Member' },
                      ]}
                      value={inviteRole}
                      onValueChange={setInviteRole}
                      disabled={inviting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Members can view and participate in assessments.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={inviting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} disabled={inviting}>
                    {inviting ? 'Sending...' : 'Send Invite'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {userList.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          title="No Team Members"
          description="No users found for your company. Invite team members to get started."
          action={
            canInvite
              ? {
                  label: 'Invite User',
                  onClick: () => setDialogOpen(true),
                }
              : undefined
          }
        />
      ) : (
        <DataTable
          data={userList}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['name', 'email', 'role']}
          emptyMessage="No users match your search."
        />
      )}
    </div>
  );
}
