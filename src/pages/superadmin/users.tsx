import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { apiUsers, apiCompanies } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import type { User, UserRole, Company } from '@/types';
import { UserPlus, Shield, ShieldOff, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'CONSULTANT', label: 'Consultant' },
  { value: 'SUB_ADMIN', label: 'Sub Admin' },
  { value: 'SPONSOR', label: 'Sponsor' },
  { value: 'MEMBER', label: 'Member' },
  { value: 'RESPONDER', label: 'Responder' },
];

const INVITE_ROLE_OPTIONS = ROLE_OPTIONS.filter(r => r.value !== '');

export default function SuperAdminUsersPage() {
  const currentUser = useAuthStore(s => s.user);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('MEMBER');
  const [inviteCompany, setInviteCompany] = useState('');
  const [inviting, setInviting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useAsync(() => apiUsers.list(roleFilter ? { role: roleFilter as UserRole } : undefined), [roleFilter]);

  const {
    data: companies,
    loading: companiesLoading,
    error: companiesError,
  } = useAsync(() => apiCompanies.list(), []);

  const companyMap = useMemo(() => {
    const map: Record<string, Company> = {};
    (companies || []).forEach(c => { map[c.id] = c; });
    return map;
  }, [companies]);

  const companyOptions = useMemo(
    () => [
      { value: '', label: 'No Company' },
      ...(companies || []).map(c => ({ value: c.id, label: c.name })),
    ],
    [companies]
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email is required.');
      return;
    }
    setInviting(true);
    try {
      await apiUsers.create({
        email: inviteEmail.trim(),
        role: inviteRole as UserRole,
        tenantCompanyId: inviteCompany || null,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      setInviteCompany('');
      refetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to invite user.');
    } finally {
      setInviting(false);
    }
  };

  const handleSuspend = async (user: User) => {
    setActionLoading(user.id);
    try {
      await apiUsers.suspend(user.id);
      toast.success(`${user.name} has been suspended.`);
      refetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (user: User) => {
    setActionLoading(user.id);
    try {
      await apiUsers.activate(user.id);
      toast.success(`${user.name} has been activated.`);
      refetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate user.');
    } finally {
      setActionLoading(null);
    }
  };

  if (usersLoading && !users) return <PageSkeleton />;
  if (usersError) return <ErrorCard message={usersError} onRetry={refetchUsers} />;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u: User) => (
        <div>
          <p className="font-medium">{u.name}</p>
          <p className="text-xs text-muted-foreground">{u.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (u: User) => (
        <Badge variant="outline">{u.role.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      key: 'tenantCompanyId',
      header: 'Company',
      render: (u: User) =>
        u.tenantCompanyId && companyMap[u.tenantCompanyId]
          ? companyMap[u.tenantCompanyId].name
          : <span className="text-muted-foreground">--</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (u: User) => <StatusBadge status={u.status} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (u: User) => formatDate(u.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u: User) => {
        if (u.id === currentUser?.id) return null;
        const isLoading = actionLoading === u.id;
        return u.status === 'suspended' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleActivate(u); }}
            disabled={isLoading}
            loading={isLoading}
          >
            <Shield className="h-3.5 w-3.5 mr-1" />
            Activate
          </Button>
        ) : u.status === 'active' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleSuspend(u); }}
            disabled={isLoading}
            loading={isLoading}
          >
            <ShieldOff className="h-3.5 w-3.5 mr-1" />
            Suspend
          </Button>
        ) : null;
      },
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Users"
        subtitle="Manage all platform users across companies."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Users' },
        ]}
        actions={
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new user. They will receive an email to set up their account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    placeholder="user@company.com"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role *</label>
                  <Select
                    options={INVITE_ROLE_OPTIONS}
                    value={inviteRole}
                    onValueChange={setInviteRole}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company (optional)</label>
                  <Select
                    options={companyOptions}
                    value={inviteCompany}
                    onValueChange={setInviteCompany}
                    placeholder="Select company..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} loading={inviting}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onValueChange={setRoleFilter}
          className="w-48"
        />
      </div>

      {filteredUsers.length === 0 && !usersLoading ? (
        <EmptyState
          icon={<Users className="h-8 w-8 text-muted-foreground" />}
          title="No Users Found"
          description={search || roleFilter ? 'No users match your filters. Try adjusting your search or role filter.' : 'No users exist yet. Invite your first user to get started.'}
          action={!search && !roleFilter ? { label: 'Invite User', onClick: () => setInviteOpen(true) } : undefined}
        />
      ) : (
        <DataTable
          data={filteredUsers}
          columns={columns}
          keyField="id"
          emptyMessage="No users found."
        />
      )}
    </div>
  );
}
