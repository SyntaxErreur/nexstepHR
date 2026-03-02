import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, User, Briefcase, Clock } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { ResponseSubmission, QuestionBank } from '@/types';

export default function CAPSubmissionDetail() {
  const { capId, submissionId } = useParams<{
    capId: string;
    submissionId: string;
  }>();

  const submission = useAsync<ResponseSubmission>(
    () => api.submissions.getById(submissionId!),
    [submissionId]
  );

  const questionBank = useAsync<QuestionBank>(
    () => api.questionBank.get(),
    []
  );

  const isLoading = submission.loading || questionBank.loading;
  const hasError = submission.error || questionBank.error;

  // Group answers by dimension
  const groupedAnswers = useMemo(() => {
    if (!submission.data || !questionBank.data) return [];

    const sub = submission.data;
    const role = sub.responderMeta.selectedRole;
    const questions = questionBank.data.questionsByRole[role] || [];

    // Build a map of questionId -> question
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Group by dimension
    const dimensionMap: Record<
      string,
      { questionText: string; value: number | string | boolean }[]
    > = {};

    sub.answers.forEach((ans) => {
      const q = questionMap.get(ans.questionId);
      if (!q) return;
      const dim = q.dimensionKey;
      if (!dimensionMap[dim]) dimensionMap[dim] = [];
      dimensionMap[dim].push({
        questionText: q.text,
        value: ans.value,
      });
    });

    return Object.entries(dimensionMap).map(([dimension, answers]) => ({
      dimension,
      dimensionLabel: dimension
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      answers,
    }));
  }, [submission.data, questionBank.data]);

  // Dimension scores for bar chart
  const dimensionScores = useMemo(() => {
    if (!submission.data) return [];
    return submission.data.computedScores.map((sc) => ({
      key: sc.dimensionKey,
      label: sc.dimensionKey
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      score: sc.score,
    }));
  }, [submission.data]);

  if (isLoading) return <PageSkeleton />;

  if (hasError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Submission Detail"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Submissions', href: `/app/caps/${capId}/submissions` },
            { label: 'Detail' },
          ]}
        />
        <ErrorCard
          message={
            submission.error ||
            questionBank.error ||
            'Failed to load submission.'
          }
          onRetry={() => {
            submission.refetch();
            questionBank.refetch();
          }}
        />
      </div>
    );
  }

  const sub = submission.data!;
  const maxScore = Math.max(...dimensionScores.map((d) => d.score), 1);

  function renderStars(value: number | string | boolean) {
    if (typeof value !== 'number') return <span>{String(value)}</span>;
    const numericVal = Math.min(5, Math.max(1, value));
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < numericVal
                ? 'fill-amber-400 text-amber-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          ({numericVal}/5)
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Submission Detail"
        subtitle={`Response from ${sub.responderMeta.name || 'Anonymous'}`}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          {
            label: 'Submissions',
            href: `/app/caps/${capId}/submissions`,
          },
          { label: sub.responderMeta.name || 'Anonymous' },
        ]}
        actions={
          <Link to={`/app/caps/${capId}/submissions`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Submissions
            </Button>
          </Link>
        }
      />

      {/* Responder Meta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Responder Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="text-sm font-semibold">
                  {sub.responderMeta.selectedRole}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="text-sm font-semibold">
                  {sub.responderMeta.tenureBand}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-semibold">
                  {formatDate(sub.submittedAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dimension Scores Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dimension Scores</CardTitle>
          <CardDescription>
            Computed score per dimension (0-100 scale)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dimensionScores.map((dim) => {
              const widthPercent = maxScore > 0 ? (dim.score / 100) * 100 : 0;
              const barColor =
                dim.score >= 75
                  ? 'bg-green-500'
                  : dim.score >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500';
              return (
                <div key={dim.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{dim.label}</span>
                    <span className="text-muted-foreground font-semibold">
                      {dim.score}/100
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Answers by Dimension */}
      {groupedAnswers.map((group) => (
        <Card key={group.dimension}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Badge variant="outline">{group.dimensionLabel}</Badge>
            </CardTitle>
            <CardDescription>
              {group.answers.length} question
              {group.answers.length !== 1 ? 's' : ''} in this dimension
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {group.answers.map((ans, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b last:border-0 last:pb-0"
                >
                  <p className="text-sm flex-1">{ans.questionText}</p>
                  <div className="flex-shrink-0">
                    {renderStars(ans.value)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
