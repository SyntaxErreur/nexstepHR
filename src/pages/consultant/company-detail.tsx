import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Globe, Mail, Phone, Calendar } from 'lucide-react';
import { apiCompanies, apiCAP, apiUsers } from '@/api/mock';
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
import { formatDate } from '@/lib/utils';
import type { Company, CAP, User } from '@/types';

export default function ConsultantCompanyDetail() {
  const { id } = useParams<{ id: string }>();

  const company = useAsync<Company>(
    () => apiCompanies.getById(id!),
    [id]
  );
  const caps = useAsync<CAP[]>(
    () => apiCAP.list(id),
    [id]
  );
  const users = useAsync<User[]>(
    () => apiUsers.list({ companyId: id }),
    [id]
  );

  const isLoading = company.loading || caps.loading || users.loading;
  const hasError = company.error || caps.error || users.error;

  const handleRetry = () => {
    company.refetch();
    caps.refetch();
    users.refetch();
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Company Details"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Companies', href: '/consultant/companies' },
            { label: 'Detail' },
          ]}
        />
        <ErrorCard
          message={company.error || caps.error || users.error || 'Failed to load.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  const comp = company.data!;

  const capColumns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (cap: CAP) => (
        <Link
          to={`/consultant/caps/${cap.id}`}
          className="font-medium text-primary hover:underline"
        >
          {cap.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cap: CAP) => <StatusBadge status={cap.status} />,
    },
    {
      key: 'submissionsCount',
      header: 'Submissions',
      sortable: true,
      render: (cap: CAP) => (
        <span className="font-mono text-sm">
          {cap.submissionsCount}/{cap.inviteSettings.minSubmissionsTotal}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (cap: CAP) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(cap.createdAt)}
        </span>
      ),
    },
  ];

  const userColumns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (u: User) => <span className="font-medium">{u.name}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => (
        <span className="text-muted-foreground">{u.email}</span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => (
        <Badge variant="outline" className="text-xs">
          {u.role.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => <StatusBadge status={u.status} />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={comp.name}
        subtitle="Read-only company workspace"
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'Companies', href: '/consultant/companies' },
          { label: comp.name },
        ]}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="caps">
            CAPs ({caps.data?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            Users ({users.data?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Company Name
                    </p>
                    <p className="text-sm font-semibold">{comp.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Globe className="h-3 w-3" /> Country of Operations
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {comp.countryOfOperations.length > 0 ? (
                        comp.countryOfOperations.map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not specified
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Official Email Domain
                    </p>
                    <p className="text-sm">
                      {comp.officialEmailDomain || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Phone
                    </p>
                    <p className="text-sm">{comp.phone || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Registered On
                    </p>
                    <p className="text-sm">{formatDate(comp.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Support Contact
                    </p>
                    <p className="text-sm">
                      {comp.supportContact || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Company Settings (read-only) */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-semibold mb-3">Company Settings</p>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={
                      comp.settings.memberCanInvite ? 'default' : 'secondary'
                    }
                  >
                    Members Can Invite:{' '}
                    {comp.settings.memberCanInvite ? 'Yes' : 'No'}
                  </Badge>
                  <Badge
                    variant={
                      comp.settings.allowResubmission ? 'default' : 'secondary'
                    }
                  >
                    Allow Resubmission:{' '}
                    {comp.settings.allowResubmission ? 'Yes' : 'No'}
                  </Badge>
                  <Badge
                    variant={
                      comp.settings.memberCanEditCapContext
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    Members Edit Context:{' '}
                    {comp.settings.memberCanEditCapContext ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CAPs Tab */}
        <TabsContent value="caps">
          {caps.data && caps.data.length > 0 ? (
            <DataTable<CAP>
              data={caps.data}
              columns={capColumns}
              keyField="id"
              searchable
              searchFields={['title', 'status']}
              emptyMessage="No CAPs match your search."
            />
          ) : (
            <EmptyState
              title="No CAPs"
              description="This company has no CAPs yet."
            />
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {users.data && users.data.length > 0 ? (
            <DataTable<User>
              data={users.data}
              columns={userColumns}
              keyField="id"
              searchable
              searchFields={['name', 'email', 'role']}
              emptyMessage="No users match your search."
            />
          ) : (
            <EmptyState
              title="No Users"
              description="This company has no users yet."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
