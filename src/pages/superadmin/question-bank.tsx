import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { EmptyState } from '@/components/shared/empty-state';
import { apiQuestionBank } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { ClipboardList, ChevronRight } from 'lucide-react';

export default function SuperAdminQuestionBankPage() {
  const navigate = useNavigate();

  const {
    data: questionBank,
    loading,
    error,
    refetch,
  } = useAsync(() => apiQuestionBank.get(), []);

  if (loading && !questionBank) return <PageSkeleton />;
  if (error) return <ErrorCard message={error} onRetry={refetch} />;
  if (!questionBank) return <ErrorCard message="Failed to load question bank." />;

  const roles = questionBank.roles;

  return (
    <div className="p-6">
      <PageHeader
        title="Question Bank"
        subtitle="Manage assessment questions organized by responder role."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Question Bank' },
        ]}
      />

      {roles.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
          title="No Roles Defined"
          description="No roles have been configured in the question bank yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const questions = questionBank.questionsByRole[role] || [];
            const dimensions = [...new Set(questions.map(q => q.dimensionKey))];
            return (
              <Card
                key={role}
                className="cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => navigate(`/sa/question-bank/${encodeURIComponent(role)}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{role}</CardTitle>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <CardDescription>
                    {questions.length} question{questions.length !== 1 ? 's' : ''} across {dimensions.length} dimension{dimensions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {dimensions.map(dim => (
                      <Badge key={dim} variant="secondary" className="text-xs">
                        {dim.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Likert: {questions.filter(q => q.responseType === 'likert').length}
                    </span>
                    <span>
                      Yes/No: {questions.filter(q => q.responseType === 'yesno').length}
                    </span>
                    <span>
                      Text: {questions.filter(q => q.responseType === 'text').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
