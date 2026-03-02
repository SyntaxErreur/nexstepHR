import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Loader2, CheckCircle2, Layers, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import type { CAP, ContextCategory, ContextValue, ContextSelection } from '@/types';

const REQUIRED_SELECTIONS = 8;

interface SelectionRow {
  categoryId: string;
  valueId: string;
}

export default function CAPContextPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const capId = searchParams.get('capId');
  const user = useAuthStore((s) => s.user);

  // RBAC: Only SPONSOR can select contexts
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can configure context selections.');
      navigate('/app/caps');
    }
  }, [user, navigate]);

  const [selections, setSelections] = useState<SelectionRow[]>(
    Array.from({ length: REQUIRED_SELECTIONS }, () => ({ categoryId: '', valueId: '' }))
  );
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load data
  const {
    data: cap,
    loading: capLoading,
    error: capError,
    refetch: refetchCap,
  } = useAsync<CAP>(() => {
    if (!capId) return Promise.reject(new Error('No CAP ID provided.'));
    return api.cap.getById(capId);
  }, [capId]);

  const {
    data: categories,
    loading: catsLoading,
    error: catsError,
    refetch: refetchCats,
  } = useAsync<ContextCategory[]>(() => api.contextMaster.listCategories(), []);

  const {
    data: allValues,
    loading: valsLoading,
    error: valsError,
    refetch: refetchVals,
  } = useAsync<ContextValue[]>(() => api.contextMaster.listValues(), []);

  // Pre-populate from existing CAP context selections if any
  useEffect(() => {
    if (cap && cap.contextSelections.length === REQUIRED_SELECTIONS && categories && allValues) {
      const existing: SelectionRow[] = cap.contextSelections.map((cs) => ({
        categoryId: cs.categoryId,
        valueId: cs.valueId,
      }));
      setSelections(existing);
    }
  }, [cap, categories, allValues]);

  // Active categories only
  const activeCategories = useMemo(
    () => (categories ?? []).filter((c) => c.isActive),
    [categories]
  );

  // Values grouped by category
  const valuesByCategory = useMemo(() => {
    const map: Record<string, ContextValue[]> = {};
    (allValues ?? []).forEach((v) => {
      if (!v.isActive) return;
      if (!map[v.categoryId]) map[v.categoryId] = [];
      map[v.categoryId].push(v);
    });
    return map;
  }, [allValues]);

  // Which categories are already used (for preventing duplicates)
  const usedCategoryIds = useMemo(
    () => new Set(selections.map((s) => s.categoryId).filter(Boolean)),
    [selections]
  );

  // Update a selection row
  const updateSelection = useCallback(
    (index: number, field: 'categoryId' | 'valueId', value: string) => {
      setSelections((prev) => {
        const next = [...prev];
        if (field === 'categoryId') {
          next[index] = { categoryId: value, valueId: '' };
        } else {
          next[index] = { ...next[index], valueId: value };
        }
        return next;
      });
      setValidationErrors([]);
    },
    []
  );

  // Clear a selection row
  const clearSelection = useCallback((index: number) => {
    setSelections((prev) => {
      const next = [...prev];
      next[index] = { categoryId: '', valueId: '' };
      return next;
    });
    setValidationErrors([]);
  }, []);

  // Count of completed selections
  const completedCount = useMemo(
    () => selections.filter((s) => s.categoryId && s.valueId).length,
    [selections]
  );

  // Validate selections
  function validate(): boolean {
    const errs: string[] = [];
    const completed = selections.filter((s) => s.categoryId && s.valueId);

    if (completed.length !== REQUIRED_SELECTIONS) {
      errs.push(`Exactly ${REQUIRED_SELECTIONS} context selections are required. You have ${completed.length}.`);
    }

    // Check for duplicate categories
    const catIds = completed.map((s) => s.categoryId);
    const uniqueCats = new Set(catIds);
    if (uniqueCats.size !== catIds.length) {
      errs.push('Each category can only be selected once. Remove duplicate categories.');
    }

    setValidationErrors(errs);
    return errs.length === 0;
  }

  // Build ContextSelection[] from current rows
  function buildContextSelections(): ContextSelection[] {
    return selections
      .filter((s) => s.categoryId && s.valueId)
      .map((s) => {
        const cat = activeCategories.find((c) => c.id === s.categoryId);
        const val = (valuesByCategory[s.categoryId] ?? []).find((v) => v.id === s.valueId);
        return {
          categoryId: s.categoryId,
          categoryNameSnapshot: cat?.name ?? '',
          valueId: s.valueId,
          valueLabelSnapshot: val?.valueLabel ?? '',
        };
      });
  }

  // Handle generate outputs
  async function handleGenerate() {
    if (!validate()) return;
    if (!capId) return;

    const contextSelections = buildContextSelections();

    setGenerating(true);
    setGenerationProgress(10);

    try {
      // Step 1: Save context selections
      setGenerationProgress(20);
      await api.cap.setContextSelections(capId, contextSelections);

      // Step 2: Generate outputs (this is the long operation)
      setGenerationProgress(40);

      // Simulate gradual progress while waiting
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 400);

      await api.cap.generateOutputs(capId);

      clearInterval(progressInterval);
      setGenerationProgress(100);

      toast.success('Outputs generated successfully.');

      // Brief pause to show 100% then navigate
      setTimeout(() => {
        navigate(`/app/caps/${capId}`);
      }, 600);
    } catch (err: any) {
      setGenerating(false);
      setGenerationProgress(0);
      toast.error(err.message || 'Failed to generate outputs.');
    }
  }

  // Loading state
  const isLoading = capLoading || catsLoading || valsLoading;
  const loadError = capError || catsError || valsError;

  if (isLoading) return <PageSkeleton />;

  if (loadError) {
    return (
      <div className="p-6">
        <PageHeader
          title="Select Contexts"
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Context Selection' },
          ]}
        />
        <ErrorCard
          message={loadError}
          onRetry={() => {
            refetchCap();
            refetchCats();
            refetchVals();
          }}
        />
      </div>
    );
  }

  if (!capId || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="Select Contexts"
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Context Selection' },
          ]}
        />
        <ErrorCard message="No CAP ID was provided. Please start from the CAP creation page." />
      </div>
    );
  }

  // Generation overlay
  if (generating) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Generating Outputs"
          subtitle={cap.title}
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Generating...' },
          ]}
        />
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 flex flex-col items-center gap-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Generating...</h3>
              <p className="text-sm text-muted-foreground">
                Computing materiality weights and parameters based on your context selections.
                This may take a moment.
              </p>
            </div>
            <div className="w-full space-y-2">
              <Progress value={generationProgress} />
              <p className="text-xs text-muted-foreground text-center">
                {Math.round(generationProgress)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Select Contexts"
        subtitle={`Step 2 of 2 - ${cap.title}`}
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: 'Create New', href: '/app/caps/new' },
          { label: 'Context Selection' },
        ]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-primary text-primary">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Step 1
        </Badge>
        <span className="text-sm text-muted-foreground">Basic Information</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge className="bg-primary text-primary-foreground">Step 2</Badge>
        <span className="text-sm font-medium">Select Contexts</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Context Selection Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-muted-foreground" />
                Context Selections
              </CardTitle>
              <CardDescription>
                Select exactly {REQUIRED_SELECTIONS} context-value pairs from different categories.
                Each category may only be used once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {completedCount} / {REQUIRED_SELECTIONS} selected
                  </span>
                </div>
                <Progress value={(completedCount / REQUIRED_SELECTIONS) * 100} />
              </div>

              {/* Selection rows */}
              <div className="space-y-3">
                {selections.map((sel, index) => {
                  // Categories available for this row: not used by other rows
                  const availableCategories = activeCategories.filter(
                    (cat) => cat.id === sel.categoryId || !usedCategoryIds.has(cat.id)
                  );

                  const valuesForCategory = sel.categoryId
                    ? valuesByCategory[sel.categoryId] ?? []
                    : [];

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                    >
                      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {index + 1}
                      </span>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select
                          value={sel.categoryId}
                          onValueChange={(v) => updateSelection(index, 'categoryId', v)}
                          options={availableCategories.map((cat) => ({
                            value: cat.id,
                            label: cat.name,
                          }))}
                          placeholder="Select category..."
                        />

                        <Select
                          value={sel.valueId}
                          onValueChange={(v) => updateSelection(index, 'valueId', v)}
                          options={valuesForCategory.map((val) => ({
                            value: val.id,
                            label: val.valueLabel,
                          }))}
                          placeholder={
                            sel.categoryId ? 'Select value...' : 'Choose a category first'
                          }
                          disabled={!sel.categoryId}
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clearSelection(index)}
                        disabled={!sel.categoryId && !sel.valueId}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Validation errors */}
              {validationErrors.length > 0 && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-1">
                  {validationErrors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Assessment</span>
                <span className="font-medium truncate max-w-[160px]">{cap.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">
                  {completedCount} / {REQUIRED_SELECTIONS}
                </span>
              </div>

              {completedCount > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Selected Pairs
                  </p>
                  {selections
                    .filter((s) => s.categoryId && s.valueId)
                    .map((s, i) => {
                      const cat = activeCategories.find((c) => c.id === s.categoryId);
                      const val = (valuesByCategory[s.categoryId] ?? []).find(
                        (v) => v.id === s.valueId
                      );
                      return (
                        <div key={i} className="text-xs flex justify-between">
                          <span className="text-muted-foreground truncate max-w-[100px]">
                            {cat?.name ?? '--'}
                          </span>
                          <span className="font-medium truncate max-w-[100px]">
                            {val?.valueLabel ?? '--'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            disabled={completedCount !== REQUIRED_SELECTIONS || generating}
            onClick={handleGenerate}
          >
            Generate Outputs
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          {completedCount < REQUIRED_SELECTIONS && (
            <p className="text-xs text-muted-foreground text-center">
              Select {REQUIRED_SELECTIONS - completedCount} more context{' '}
              {REQUIRED_SELECTIONS - completedCount === 1 ? 'pair' : 'pairs'} to continue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
