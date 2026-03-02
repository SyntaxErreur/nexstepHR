import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  FileBarChart,
  ArrowLeft,
  Database,
  Calculator,
  LayoutDashboard,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/mock';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorCard } from '@/components/shared/error-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { CAP } from '@/types';

interface GenerationStep {
  label: string;
  description: string;
  durationMs: number;
  icon: React.ReactNode;
}

const GENERATION_STEPS: GenerationStep[] = [
  {
    label: 'Compiling data...',
    description: 'Gathering all submission responses and context parameters',
    durationMs: 800,
    icon: <Database className="h-5 w-5" />,
  },
  {
    label: 'Scoring responses...',
    description: 'Computing dimension scores and aggregating by role',
    durationMs: 600,
    icon: <Calculator className="h-5 w-5" />,
  },
  {
    label: 'Building layout...',
    description: 'Assembling report sections and generating visualizations',
    durationMs: 700,
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    label: 'Finalizing report...',
    description: 'Running final checks and preparing for download',
    durationMs: 500,
    icon: <FileCheck className="h-5 w-5" />,
  },
];

export default function CAPReportGenerate() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // RBAC: Only SPONSOR can generate reports
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can generate reports.');
      navigate(`/app/caps/${capId}`);
    }
  }, [user, navigate, capId]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCap, setGeneratedCap] = useState<CAP | null>(null);

  const totalDuration = GENERATION_STEPS.reduce(
    (s, step) => s + step.durationMs,
    0
  );

  const progressValue = isComplete
    ? 100
    : isGenerating
    ? Math.round(
        (GENERATION_STEPS.slice(0, currentStep).reduce(
          (s, step) => s + step.durationMs,
          0
        ) /
          totalDuration) *
          100
      )
    : 0;

  const runSteps = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setCurrentStep(0);
    setIsComplete(false);

    // Run visual steps in sequence
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise((resolve) =>
        setTimeout(resolve, GENERATION_STEPS[i].durationMs)
      );
    }

    // Call the actual API
    try {
      const result = await api.reports.generate(capId!);
      setGeneratedCap(result);
      setIsComplete(true);
      toast.success('Report generated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to generate report.');
      toast.error('Report generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [capId]);

  // Start generation on mount
  useEffect(() => {
    runSteps();
  }, [runSteps]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Generate Report"
        subtitle="Building your assessment report"
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: 'CAP', href: `/app/caps/${capId}` },
          { label: 'Generate Report' },
        ]}
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            {isComplete
              ? 'Report Generated Successfully'
              : error
              ? 'Generation Failed'
              : 'Generating Report'}
          </CardTitle>
          <CardDescription>
            {isComplete
              ? 'Your assessment report is ready to view.'
              : error
              ? 'An error occurred during report generation.'
              : 'Please wait while we process your assessment data.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progressValue} className="h-3" />
            <p className="text-xs text-muted-foreground text-center">
              {isComplete ? '100' : progressValue}% complete
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {GENERATION_STEPS.map((step, idx) => {
              const isActive = !isComplete && !error && currentStep === idx && isGenerating;
              const isDone = isComplete || currentStep > idx;
              const isPending = !isComplete && !error && currentStep < idx;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-4 rounded-lg border p-4 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5'
                      : isDone
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-muted'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    ) : (
                      <div className="h-5 w-5 text-muted-foreground">
                        {step.icon}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        isPending ? 'text-muted-foreground' : ''
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error state */}
          {error && (
            <ErrorCard message={error} onRetry={runSteps} />
          )}

          {/* Completion actions */}
          {isComplete && (
            <div className="flex items-center justify-center gap-3 pt-4 border-t">
              <Link to={`/app/caps/${capId}/report`}>
                <Button>
                  <FileBarChart className="h-4 w-4 mr-2" />
                  View Report
                </Button>
              </Link>
              <Link to={`/app/caps/${capId}`}>
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to CAP
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
