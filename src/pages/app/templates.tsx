import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { FileText } from 'lucide-react';

export default function CompanyTemplatesPage() {
  return (
    <div>
      <PageHeader title="Templates" subtitle="Manage your company assessment templates" breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Templates' }]} />
      <EmptyState
        icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        title="No Templates Yet"
        description="Templates will be available once you create custom assessment configurations."
      />
    </div>
  );
}
