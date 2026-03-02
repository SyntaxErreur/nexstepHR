import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiCompanies, apiCAP, apiUsers } from '@/api/mock';
import { useAsync, useAsyncAction } from '@/hooks/use-async';
import { useCurrentUser } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import type { Company, CAP, User } from '@/types';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDomain, setFormDomain] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formSupportContact, setFormSupportContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formHowHeard, setFormHowHeard] = useState('');

  const companies = useAsync<Company[]>(() => apiCompanies.list(), []);
  const caps = useAsync<CAP[]>(() => apiCAP.list(), []);
  const users = useAsync<User[]>(() => apiUsers.list(), []);

  const createAction = useAsyncAction(
    useCallback(async (data: Parameters<typeof apiCompanies.create>[0]) => {
      return apiCompanies.create(data);
    }, [])
  );

  const isLoading = companies.loading || caps.loading || users.loading;
  const hasError = companies.error || caps.error || users.error;

  const handleRetry = () => {
    companies.refetch();
    caps.refetch();
    users.refetch();
  };

  // Build lookup maps
  const capCountByCompany = useMemo(() => {
    const map: Record<string, number> = {};
    (caps.data ?? []).forEach(cap => {
      map[cap.companyId] = (map[cap.companyId] || 0) + 1;
    });
    return map;
  }, [caps.data]);

  const usersById = useMemo(() => {
    const map: Record<string, User> = {};
    (users.data ?? []).forEach(u => { map[u.id] = u; });
    return map;
  }, [users.data]);

  // Compute status for each company based on its CAPs
  const companyStatuses = useMemo(() => {
    const map: Record<string, string> = {};
    (companies.data ?? []).forEach(company => {
      const companyCaps = (caps.data ?? []).filter(c => c.companyId === company.id);
      const hasActive = companyCaps.some(c => c.status !== 'draft' && c.status !== 'archived');
      map[company.id] = hasActive ? 'active' : companyCaps.length > 0 ? 'draft' : 'new';
    });
    return map;
  }, [companies.data, caps.data]);

  const columns = [
    {
      key: 'name',
      header: 'Company Name',
      sortable: true,
      render: (item: Company) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: 'countryOfOperations',
      header: 'Country',
      render: (item: Company) => (
        <span className="text-sm">{item.countryOfOperations.join(', ') || '-'}</span>
      ),
    },
    {
      key: 'ownerUserId',
      header: 'Owner',
      render: (item: Company) => {
        const owner = usersById[item.ownerUserId];
        return (
          <span className="text-sm">{owner?.name ?? 'Unknown'}</span>
        );
      },
    },
    {
      key: 'capsCount',
      header: 'CAPs',
      sortable: true,
      render: (item: Company) => (
        <span className="text-sm font-medium">{capCountByCompany[item.id] ?? 0}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (item: Company) => (
        <span className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Company) => (
        <StatusBadge status={companyStatuses[item.id] || 'new'} />
      ),
    },
  ];

  const resetForm = () => {
    setFormName('');
    setFormDomain('');
    setFormCountry('');
    setFormSupportContact('');
    setFormPhone('');
    setFormHowHeard('');
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Company name is required.');
      return;
    }
    if (!currentUser) {
      toast.error('You must be logged in.');
      return;
    }

    try {
      const countries = formCountry
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);

      await createAction.execute({
        name: formName.trim(),
        ownerUserId: currentUser.id,
        countryOfOperations: countries,
        officialEmailDomain: formDomain.trim() || undefined,
        supportContact: formSupportContact.trim() || undefined,
        phone: formPhone.trim() || undefined,
        howHeardAboutUs: formHowHeard.trim() || undefined,
      });

      toast.success(`Company "${formName.trim()}" created successfully.`);
      resetForm();
      setDialogOpen(false);
      companies.refetch();
      caps.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create company.');
    }
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Companies"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Companies' },
          ]}
        />
        <ErrorCard
          message={companies.error || caps.error || users.error || 'Failed to load companies.'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Companies"
        subtitle={`${companies.data?.length ?? 0} companies registered`}
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Companies' },
        ]}
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        }
      />

      <DataTable<Company>
        data={companies.data ?? []}
        columns={columns}
        keyField="id"
        searchable
        searchFields={['name']}
        onRowClick={(item) => navigate(`/sa/companies/${item.id}`)}
        emptyMessage="No companies found. Click 'Add Company' to get started."
      />

      {/* Add Company Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
            <DialogDescription>
              Register a new company on the NexStep HR platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompany} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Company Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Acme Corp"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Countries of Operation
              </label>
              <Input
                placeholder="e.g. India, USA (comma-separated)"
                value={formCountry}
                onChange={e => setFormCountry(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email Domain</label>
                <Input
                  placeholder="e.g. acmecorp.com"
                  value={formDomain}
                  onChange={e => setFormDomain(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input
                  placeholder="+91-1234567890"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Support Contact Email</label>
              <Input
                placeholder="hr@company.com"
                value={formSupportContact}
                onChange={e => setFormSupportContact(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">How did they hear about us?</label>
              <Input
                placeholder="e.g. LinkedIn, Referral"
                value={formHowHeard}
                onChange={e => setFormHowHeard(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>
                Cancel
              </Button>
              <Button type="submit" loading={createAction.loading}>
                Create Company
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
