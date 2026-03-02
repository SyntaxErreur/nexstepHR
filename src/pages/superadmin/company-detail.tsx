import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, Users as UsersIcon, FileBarChart, CreditCard,
  ScrollText, Globe, Mail, Phone, Calendar, UserCircle,
} from 'lucide-react';
import { apiCompanies, apiUsers, apiCAP, apiAudit } from '@/api/mock';
import { db } from '@/api/store';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { Company, User, CAP, AuditLogEntry, Payment } from '@/types';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const company = useAsync<Company>(
    () => apiCompanies.getById(id!),
    [id]
  );
  const users = useAsync<User[]>(
    () => apiUsers.list({ companyId: id }),
    [id]
  );
  const caps = useAsync<CAP[]>(
    () => apiCAP.list(id),
    [id]
  );
  const auditLog = useAsync<AuditLogEntry[]>(
    () => apiAudit.list(id),
    [id]
  );

  // Fetch the owner user for the company
  const ownerUser = useAsync<User | null>(
    async () => {
      if (!company.data?.ownerUserId) return null;
      try {
        return await apiUsers.getById(company.data.ownerUserId);
      } catch {
        return null;
      }
    },
    [company.data?.ownerUserId],
    !!company.data?.ownerUserId
  );

  // Get payments for CAPs belonging to this company
  const companyPayments = useMemo<Payment[]>(() => {
    if (!caps.data) return [];
    const capIds = new Set(caps.data.map(c => c.id));
    return db.getPayments().filter(p => capIds.has(p.capId));
  }, [caps.data]);

  const isLoading = company.loading || users.loading || caps.loading || auditLog.loading;
  const hasError = company.error || users.error || caps.error || auditLog.error;

  const handleRetry = () => {
    company.refetch();
    users.refetch();
    caps.refetch();
    auditLog.refetch();
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Company Details"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Companies', href: '/sa/companies' },
            { label: 'Error' },
          ]}
        />
        <ErrorCard
          message={company.error || users.error || caps.error || auditLog.error || 'Failed to load company details.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!company.data) {
    return (
      <div className="p-6">
        <PageHeader
          title="Company Not Found"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Companies', href: '/sa/companies' },
            { label: 'Not Found' },
          ]}
        />
        <ErrorCard message="The requested company could not be found." />
      </div>
    );
  }

  const c = company.data;

  // --- Column definitions ---
  const userColumns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item: User) => (
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
            {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: User) => (
        <span className="text-sm text-muted-foreground">{item.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item: User) => (
        <Badge variant="secondary" className="text-xs">
          {item.role.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: User) => <StatusBadge status={item.status} />,
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      sortable: true,
      render: (item: User) => (
        <span className="text-sm text-muted-foreground">
          {item.lastLoginAt ? formatDate(item.lastLoginAt) : 'Never'}
        </span>
      ),
    },
  ];

  const capColumns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (item: CAP) => (
        <span className="font-medium">{item.title}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: CAP) => <StatusBadge status={item.status} />,
    },
    {
      key: 'submissionsCount',
      header: 'Submissions',
      sortable: true,
      render: (item: CAP) => (
        <span className="text-sm">
          {item.submissionsCount}/{item.inviteSettings.minSubmissionsTotal}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      render: (item: CAP) => <StatusBadge status={item.paymentStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (item: CAP) => (
        <span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
      ),
    },
  ];

  const paymentColumns = [
    {
      key: 'id',
      header: 'Payment ID',
      render: (item: Payment) => (
        <span className="text-sm font-mono">{item.id.slice(0, 12)}...</span>
      ),
    },
    {
      key: 'capId',
      header: 'CAP',
      render: (item: Payment) => {
        const cap = (caps.data ?? []).find(c => c.id === item.capId);
        return <span className="text-sm">{cap?.title ?? item.capId}</span>;
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (item: Payment) => (
        <span className="text-sm font-medium">
          {item.currency} {item.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Payment) => <StatusBadge status={item.status} />,
    },
    {
      key: 'initiatedAt',
      header: 'Date',
      sortable: true,
      render: (item: Payment) => (
        <span className="text-sm text-muted-foreground">{formatDate(item.initiatedAt)}</span>
      ),
    },
  ];

  const auditColumns = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      render: (item: AuditLogEntry) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(item.timestamp)}</span>
      ),
    },
    {
      key: 'userName',
      header: 'User',
      render: (item: AuditLogEntry) => (
        <span className="text-sm font-medium">{item.userName}</span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (item: AuditLogEntry) => (
        <Badge variant="outline" className="text-xs">{item.action}</Badge>
      ),
    },
    {
      key: 'entityType',
      header: 'Entity',
      render: (item: AuditLogEntry) => (
        <span className="text-sm text-muted-foreground capitalize">{item.entityType}</span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: (item: AuditLogEntry) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{item.details}</span>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={c.name}
        subtitle={c.officialEmailDomain ? `@${c.officialEmailDomain}` : undefined}
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Companies', href: '/sa/companies' },
          { label: c.name },
        ]}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">
            Users ({users.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="caps">
            CAPs ({caps.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="billing">
            Billing ({companyPayments.length})
          </TabsTrigger>
          <TabsTrigger value="audit">
            Audit ({auditLog.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Globe className="h-4 w-4" />}
                  label="Countries"
                  value={c.countryOfOperations.length > 0 ? c.countryOfOperations.join(', ') : 'Not specified'}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Domain"
                  value={c.officialEmailDomain || 'Not set'}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Support Contact"
                  value={c.supportContact || 'Not set'}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={c.phone || 'Not set'}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Created"
                  value={formatDate(c.createdAt)}
                />
                <InfoRow
                  icon={<UserCircle className="h-4 w-4" />}
                  label="Owner"
                  value={ownerUser.data?.name ?? 'Unknown'}
                />
                {c.howHeardAboutUs && (
                  <InfoRow
                    icon={<ScrollText className="h-4 w-4" />}
                    label="How Heard"
                    value={c.howHeardAboutUs}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SettingRow
                  label="Members Can Invite"
                  enabled={c.settings.memberCanInvite}
                />
                <SettingRow
                  label="Members Can Edit CAP Context"
                  enabled={c.settings.memberCanEditCapContext}
                />
                <SettingRow
                  label="Allow Resubmission"
                  enabled={c.settings.allowResubmission}
                />
                <SettingRow
                  label="Require Per-Role Minimums"
                  enabled={c.settings.requirePerRoleMinimums}
                />
                {c.settings.requirePerRoleMinimums && c.settings.perRoleMinimums && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Per-Role Minimums</p>
                    <div className="space-y-1">
                      {Object.entries(c.settings.perRoleMinimums).map(([role, min]) => (
                        <div key={role} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{role}</span>
                          <span className="font-medium">{min}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick stats */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatBlock label="Total Users" value={users.data?.length ?? 0} />
                  <StatBlock label="Total CAPs" value={caps.data?.length ?? 0} />
                  <StatBlock
                    label="Active CAPs"
                    value={(caps.data ?? []).filter(c => c.status !== 'draft' && c.status !== 'archived').length}
                  />
                  <StatBlock
                    label="Total Revenue"
                    value={`INR ${companyPayments
                      .filter(p => p.status === 'completed')
                      .reduce((sum, p) => sum + p.amount, 0)
                      .toLocaleString()}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="mt-4">
            {(users.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<UsersIcon className="h-8 w-8 text-muted-foreground" />}
                title="No users"
                description="No users are associated with this company yet."
              />
            ) : (
              <DataTable<User>
                data={users.data ?? []}
                columns={userColumns}
                keyField="id"
                searchable
                searchFields={['name', 'email']}
                emptyMessage="No users match your search."
              />
            )}
          </div>
        </TabsContent>

        {/* CAPs Tab */}
        <TabsContent value="caps">
          <div className="mt-4">
            {(caps.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<FileBarChart className="h-8 w-8 text-muted-foreground" />}
                title="No CAPs"
                description="No Culture-fit Assessment Plans have been created for this company."
              />
            ) : (
              <DataTable<CAP>
                data={caps.data ?? []}
                columns={capColumns}
                keyField="id"
                searchable
                searchFields={['title']}
                emptyMessage="No CAPs match your search."
              />
            )}
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="mt-4">
            {companyPayments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
                title="No payments"
                description="No payment records found for this company."
              />
            ) : (
              <>
                <div className="mb-4 p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Completed Revenue</p>
                    <p className="text-2xl font-bold">
                      INR{' '}
                      {companyPayments
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold">{companyPayments.length}</p>
                  </div>
                </div>
                <DataTable<Payment>
                  data={companyPayments}
                  columns={paymentColumns}
                  keyField="id"
                  emptyMessage="No payment records found."
                />
              </>
            )}
          </div>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit">
          <div className="mt-4">
            {(auditLog.data?.length ?? 0) === 0 ? (
              <EmptyState
                icon={<ScrollText className="h-8 w-8 text-muted-foreground" />}
                title="No audit logs"
                description="No audit log entries have been recorded for this company."
              />
            ) : (
              <DataTable<AuditLogEntry>
                data={auditLog.data ?? []}
                columns={auditColumns}
                keyField="id"
                searchable
                searchFields={['userName', 'action', 'details']}
                emptyMessage="No audit entries match your search."
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Helper sub-components ---

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <span className="text-muted-foreground w-32 flex-shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SettingRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm py-1">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant={enabled ? 'default' : 'secondary'} className="text-xs">
        {enabled ? 'Enabled' : 'Disabled'}
      </Badge>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center p-3 rounded-md bg-muted/30">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
