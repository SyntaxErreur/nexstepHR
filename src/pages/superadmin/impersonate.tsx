import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Search, Shield, ArrowRight } from 'lucide-react';
import { apiUsers } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { User } from '@/types';

const roleDashboardMap: Record<string, string> = {
  SUPER_ADMIN: '/sa',
  CONSULTANT: '/consultant',
  SUB_ADMIN: '/app',
  SPONSOR: '/app',
  MEMBER: '/app',
};

export default function ImpersonatePage() {
  const navigate = useNavigate();
  const impersonate = useAuthStore((s) => s.impersonate);
  const currentUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');

  const { data: users, loading, error, refetch } = useAsync<User[]>(
    () => apiUsers.list(),
    []
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.id !== currentUser?.id &&
        (u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q))
    );
  }, [users, search, currentUser?.id]);

  const handleImpersonate = (user: User) => {
    impersonate(user);
    const dashboard = roleDashboardMap[user.role] || '/app';
    toast.success(`Now impersonating ${user.name} (${user.role})`);
    navigate(dashboard);
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Impersonate User"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Impersonate' },
          ]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Impersonate User"
        subtitle="Sign in as another user to troubleshoot or verify their experience"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Impersonate' },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Select User
          </CardTitle>
          <CardDescription>
            Search by name, email, or role. You will be redirected to their
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<UserCheck className="h-8 w-8 text-muted-foreground" />}
              title="No users found"
              description="Try adjusting your search criteria."
            />
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filtered.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {user.role.replace(/_/g, ' ')}
                    </Badge>
                    <StatusBadge status={user.status} />
                    <Button
                      size="sm"
                      onClick={() => handleImpersonate(user)}
                      disabled={user.status !== 'active'}
                    >
                      Impersonate
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Showing {filtered.length} of {users?.length ?? 0} users
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
