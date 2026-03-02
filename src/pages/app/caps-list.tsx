import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileBarChart, ClipboardList, CreditCard, Calendar } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { KPICard } from '@/components/shared/kpi-card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import type { CAP, CAPStatus } from '@/types';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'collecting', label: 'Collecting' },
  { value: 'ready', label: 'Ready' },
  { value: 'report_generated', label: 'Report Generated' },
];

export default function CAPsListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const companyId = user?.tenantCompanyId ?? undefined;

  const [activeTab, setActiveTab] = useState('all');

  const {
    data: caps,
    loading,
    error,
    refetch,
  } = useAsync<CAP[]>(() => api.cap.list(companyId), [companyId]);

  const filteredCaps = useMemo(() => {
    if (!caps) return [];
    if (activeTab === 'all') return caps;
    return caps.filter((c) => c.status === activeTab);
  }, [caps, activeTab]);

  const kpis = useMemo(() => {
    if (!caps) return { total: 0, active: 0, ready: 0, reported: 0 };
    return {
      total: caps.length,
      active: caps.filter((c) => c.status === 'active' || c.status === 'collecting').length,
      ready: caps.filter((c) => c.status === 'ready').length,
      reported: caps.filter((c) => c.status === 'report_generated').length,
    };
  }, [caps]);

  const columns = [
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (cap: CAP) => (
        <span className="font-medium text-foreground">{cap.title}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cap: CAP) => <StatusBadge status={cap.status} />,
    },
    {
      key: 'submissions',
      header: 'Submissions',
      render: (cap: CAP) => (
        <span className="text-sm">
          {cap.submissionsCount}{' '}
          <span className="text-muted-foreground">
            / {cap.inviteSettings.minSubmissionsTotal} min
          </span>
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      sortable: true,
      render: (cap: CAP) => <StatusBadge status={cap.paymentStatus} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (cap: CAP) => (
        <span className="text-sm text-muted-foreground">{formatDate(cap.createdAt)}</span>
      ),
    },
  ];

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="CAP Management"
          breadcrumbs={[{ label: 'App', href: '/app' }, { label: 'CAPs' }]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="CAP Management"
        subtitle="Create, manage, and track your Context-Aware Assessments"
        breadcrumbs={[{ label: 'App', href: '/app' }, { label: 'CAPs' }]}
        actions={
          user?.role === 'SPONSOR' ? (
            <Button onClick={() => navigate('/app/caps/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create New CAP
            </Button>
          ) : undefined
        }
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total CAPs"
          value={kpis.total}
          subtitle="All assessments"
          icon={<FileBarChart className="h-5 w-5" />}
        />
        <KPICard
          title="Active / Collecting"
          value={kpis.active}
          subtitle="Currently in progress"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <KPICard
          title="Ready for Report"
          value={kpis.ready}
          subtitle="Minimum submissions met"
          icon={<Calendar className="h-5 w-5" />}
        />
        <KPICard
          title="Reports Generated"
          value={kpis.reported}
          subtitle="Completed assessments"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Status Filter Tabs + Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
              {caps && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  (
                  {tab.value === 'all'
                    ? caps.length
                    : caps.filter((c) => c.status === tab.value).length}
                  )
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {filteredCaps.length === 0 ? (
            <EmptyState
              icon={<FileBarChart className="h-8 w-8 text-muted-foreground" />}
              title="No CAPs found"
              description={
                activeTab === 'all'
                  ? 'You have not created any assessments yet. Click the button below to get started.'
                  : `No assessments with status "${activeTab.replace(/_/g, ' ')}" found.`
              }
              action={
                activeTab === 'all' && user?.role === 'SPONSOR'
                  ? { label: 'Create New CAP', onClick: () => navigate('/app/caps/new') }
                  : undefined
              }
            />
          ) : (
            <DataTable<CAP>
              data={filteredCaps}
              columns={columns}
              keyField="id"
              searchable
              searchFields={['title']}
              onRowClick={(cap) => navigate(`/app/caps/${cap.id}`)}
              emptyMessage="No assessments match your search."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
