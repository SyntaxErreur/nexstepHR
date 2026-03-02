import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { apiPDFTemplates } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { PDFTemplate } from '@/types';
import { FileText, ChevronRight, Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function SuperAdminPDFTemplatesPage() {
  const navigate = useNavigate();

  const {
    data: templates,
    loading,
    error,
    refetch,
  } = useAsync(() => apiPDFTemplates.list(), []);

  if (loading && !templates) return <PageSkeleton />;
  if (error) return <ErrorCard message={error} onRetry={refetch} />;

  const templateList = templates || [];

  return (
    <div className="p-6">
      <PageHeader
        title="PDF Templates"
        subtitle="Manage report PDF templates and their section layouts."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'PDF Templates' },
        ]}
      />

      {templateList.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
          title="No Templates"
          description="No PDF templates have been configured yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templateList.map(tpl => (
            <Card
              key={tpl.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/sa/pdf-templates/${tpl.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{tpl.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {tpl.isDefault && (
                      <Badge className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Default
                      </Badge>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </div>
                <CardDescription>{tpl.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.sections.map(section => (
                      <Badge key={section} variant="secondary" className="text-xs">
                        {section.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                    <span>{tpl.sections.length} section{tpl.sections.length !== 1 ? 's' : ''}</span>
                    <span>Updated {formatDate(tpl.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
