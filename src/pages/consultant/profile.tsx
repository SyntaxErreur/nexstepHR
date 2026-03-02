import { useState, useMemo } from 'react';
import { UserCircle, Building2, Save, Mail, Phone } from 'lucide-react';
import { apiCompanies } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Company } from '@/types';

export default function ConsultantProfile() {
  const user = useAuthStore((s) => s.user);
  const assignedIds = user?.assignedCompanyIds ?? [];

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);

  const { data: allCompanies, loading, error, refetch } = useAsync<Company[]>(
    () => apiCompanies.list(),
    []
  );

  const assignedCompanies = useMemo(() => {
    if (!allCompanies) return [];
    return allCompanies.filter((c) => assignedIds.includes(c.id));
  }, [allCompanies, assignedIds]);

  const handleSave = async () => {
    setSaving(true);
    // Mock save -- in a real app, this would call apiUsers.update
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    toast.success('Profile updated successfully.');
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="My Profile"
          breadcrumbs={[
            { label: 'Consultant', href: '/consultant' },
            { label: 'Profile' },
          ]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="My Profile"
        subtitle="View and update your account information"
        breadcrumbs={[
          { label: 'Consultant', href: '/consultant' },
          { label: 'Profile' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-muted-foreground" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your name and phone number below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  Email
                </label>
                <Input value={user?.email ?? ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact your Super Admin for
                  assistance.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  Phone
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <Badge variant="outline" className="mt-1">
                  {user?.role.replace(/_/g, ' ') ?? 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant={user?.status === 'active' ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {user?.status ?? 'Unknown'}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm mt-1">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Login</p>
                <p className="text-sm mt-1">
                  {user?.lastLoginAt
                    ? new Date(user.lastLoginAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                Assigned Companies
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedCompanies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No companies assigned.
                </p>
              ) : (
                <div className="space-y-2">
                  {assignedCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {company.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.countryOfOperations.join(', ') || 'No location'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
