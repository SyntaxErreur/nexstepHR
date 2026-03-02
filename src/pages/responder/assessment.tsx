import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import type { ResponderInvite, CAP, QuestionBank, Question, ResponseAnswer } from '@/types';
import { toast } from 'sonner';

const TENURE_BANDS = [
  { value: '0-1 years', label: '0-1 years' },
  { value: '1-3 years', label: '1-3 years' },
  { value: '3-5 years', label: '3-5 years' },
  { value: '5-10 years', label: '5-10 years' },
  { value: '10+ years', label: '10+ years' },
];

const LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

const QUESTIONS_PER_PAGE = 4;

function getLocalStorageKey(token: string) {
  return `nexstep_assessment_${token}`;
}

function loadSavedState(token: string) {
  try {
    const raw = localStorage.getItem(getLocalStorageKey(token));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveState(token: string, state: object) {
  try {
    localStorage.setItem(getLocalStorageKey(token), JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearState(token: string) {
  try {
    localStorage.removeItem(getLocalStorageKey(token));
  } catch {
    // ignore
  }
}

interface DimensionGroup {
  dimensionKey: string;
  dimensionLabel: string;
  questions: Question[];
}

export default function AssessmentPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const invite = useAsync<ResponderInvite & { cap: CAP }>(
    () => api.invites.getByToken(token!),
    [token]
  );
  const questionBank = useAsync<QuestionBank>(() => api.questionBank.get(), []);

  const [step, setStep] = useState(0); // 0 = role selection step
  const [selectedRole, setSelectedRole] = useState('');
  const [tenureBand, setTenureBand] = useState('');
  const [answers, setAnswers] = useState<Record<string, number | string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  // Restore saved state on mount
  useEffect(() => {
    if (!token) return;
    const saved = loadSavedState(token);
    if (saved) {
      if (saved.selectedRole) setSelectedRole(saved.selectedRole);
      if (saved.tenureBand) setTenureBand(saved.tenureBand);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.step !== undefined) setStep(saved.step);
    }
  }, [token]);

  // Auto-save to localStorage whenever state changes
  const autoSave = useCallback(() => {
    if (!token) return;
    saveState(token, { selectedRole, tenureBand, answers, step });
  }, [token, selectedRole, tenureBand, answers, step]);

  useEffect(() => {
    autoSave();
  }, [autoSave]);

  // Build dimension groups from questions for the selected role
  const dimensionGroups: DimensionGroup[] = useMemo(() => {
    if (!questionBank.data || !selectedRole) return [];
    const roleQuestions = questionBank.data.questionsByRole[selectedRole] || [];
    const groups: Record<string, Question[]> = {};
    roleQuestions.forEach((q) => {
      if (!groups[q.dimensionKey]) groups[q.dimensionKey] = [];
      groups[q.dimensionKey].push(q);
    });
    return Object.entries(groups).map(([key, questions]) => ({
      dimensionKey: key,
      dimensionLabel: key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      questions,
    }));
  }, [questionBank.data, selectedRole]);

  // Break questions into pages of QUESTIONS_PER_PAGE
  const questionPages: { dimensionLabel: string; questions: Question[] }[] = useMemo(() => {
    const pages: { dimensionLabel: string; questions: Question[] }[] = [];
    dimensionGroups.forEach((group) => {
      for (let i = 0; i < group.questions.length; i += QUESTIONS_PER_PAGE) {
        pages.push({
          dimensionLabel: group.dimensionLabel,
          questions: group.questions.slice(i, i + QUESTIONS_PER_PAGE),
        });
      }
    });
    return pages;
  }, [dimensionGroups]);

  const totalSteps = 1 + questionPages.length + 1; // role step + question pages + review step
  const isReviewStep = step === totalSteps - 1;
  const isRoleStep = step === 0;
  const currentQuestionPageIndex = step - 1; // offset by 1 for role step

  const allQuestions = useMemo(() => {
    return dimensionGroups.flatMap((g) => g.questions);
  }, [dimensionGroups]);

  const totalQuestions = allQuestions.length;
  const answeredCount = allQuestions.filter((q) => answers[q.id] !== undefined).length;

  const progressPercent =
    totalSteps > 1 ? Math.round((step / (totalSteps - 1)) * 100) : 0;

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const canProceedFromRole = selectedRole && tenureBand;

  const currentPageFullyAnswered =
    !isRoleStep &&
    !isReviewStep &&
    questionPages[currentQuestionPageIndex]?.questions.every(
      (q) => answers[q.id] !== undefined
    );

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!invite.data || !token) return;
    setSubmitting(true);
    try {
      const answerPayload: ResponseAnswer[] = allQuestions.map((q) => ({
        questionId: q.id,
        value: answers[q.id] ?? 3, // default to 3 if somehow unanswered
      }));

      await api.submissions.submit({
        capId: invite.data.capId,
        inviteId: invite.data.id,
        responderMeta: {
          selectedRole,
          tenureBand,
        },
        answers: answerPayload,
      });

      clearState(token);
      navigate(`/responder/${token}/thank-you`);
    } catch (err: any) {
      toast.error(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // Loading state
  if (invite.loading || questionBank.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-2xl mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (invite.error || questionBank.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-bold mb-2">Unable to Load Assessment</h2>
            <p className="text-sm text-muted-foreground">
              {invite.error || questionBank.error}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roles = (questionBank.data?.roles || []).map((r) => ({
    value: r,
    label: r,
  }));

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header with progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{invite.data?.cap.title}</span>
            <span className="text-muted-foreground">
              Step {step + 1} of {totalSteps}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {!isRoleStep && !isReviewStep && (
            <p className="text-xs text-muted-foreground text-right">
              {answeredCount} of {totalQuestions} questions answered
            </p>
          )}
        </div>

        {/* STEP 0: Role & Tenure Selection */}
        {isRoleStep && (
          <Card>
            <CardHeader>
              <CardTitle>Select Your Role & Tenure</CardTitle>
              <CardDescription>
                Choose the role that best describes your position and how long you
                have been with the organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Role</label>
                <Select
                  options={roles}
                  placeholder="Select your role..."
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                />
                {invite.data?.roleHint && (
                  <p className="text-xs text-muted-foreground">
                    Suggested: {invite.data.roleHint}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenure Band</label>
                <Select
                  options={TENURE_BANDS}
                  placeholder="Select tenure band..."
                  value={tenureBand}
                  onValueChange={setTenureBand}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* QUESTION PAGES */}
        {!isRoleStep && !isReviewStep && questionPages[currentQuestionPageIndex] && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">
                  {questionPages[currentQuestionPageIndex].dimensionLabel}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  Page {currentQuestionPageIndex + 1} of {questionPages.length}
                </Badge>
              </div>
              <CardDescription>
                Rate each statement on a scale of 1 (Strongly Disagree) to 5
                (Strongly Agree).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {questionPages[currentQuestionPageIndex].questions.map((q, qIdx) => (
                <div key={q.id} className="space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-semibold text-muted-foreground mt-0.5 flex-shrink-0">
                      Q{currentQuestionPageIndex * QUESTIONS_PER_PAGE + qIdx + 1}.
                    </span>
                    <p className="text-sm font-medium">{q.text}</p>
                  </div>
                  {q.helpText && (
                    <p className="text-xs text-muted-foreground ml-6">
                      {q.helpText}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 ml-6">
                    {LIKERT_OPTIONS.map((opt) => {
                      const isSelected = answers[q.id] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleAnswer(q.id, opt.value)}
                          className={`
                            flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-all min-w-[80px]
                            ${
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                : 'border-input hover:border-primary/50 hover:bg-muted/50'
                            }
                          `}
                        >
                          <span className="text-lg font-bold">{opt.value}</span>
                          <span className="text-[10px] leading-tight text-center">
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* REVIEW STEP */}
        {isReviewStep && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Review Your Answers
              </CardTitle>
              <CardDescription>
                Review your selections before submitting. You can go back to change
                any answers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meta info */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role:</span>
                  <Badge variant="secondary">{selectedRole}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tenure:</span>
                  <span className="font-medium">{tenureBand}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Questions Answered:</span>
                  <span className="font-medium">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
              </div>

              {/* Answers summary by dimension */}
              {dimensionGroups.map((group) => (
                <div key={group.dimensionKey} className="space-y-2">
                  <h4 className="text-sm font-semibold">{group.dimensionLabel}</h4>
                  <div className="space-y-1">
                    {group.questions.map((q) => {
                      const answer = answers[q.id];
                      const likertLabel = LIKERT_OPTIONS.find(
                        (o) => o.value === answer
                      )?.label;
                      return (
                        <div
                          key={q.id}
                          className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                        >
                          <span className="text-muted-foreground truncate pr-4 flex-1">
                            {q.text}
                          </span>
                          {answer !== undefined ? (
                            <Badge variant="outline" className="flex-shrink-0">
                              {answer as number} - {likertLabel}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-300 flex-shrink-0"
                            >
                              Unanswered
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {answeredCount < totalQuestions && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm text-orange-700">
                    You have {totalQuestions - answeredCount} unanswered
                    question(s). Consider going back to complete them for the best
                    results.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {isReviewStep ? (
            <Button onClick={handleSubmit} loading={submitting} disabled={submitting}>
              Submit Assessment
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={
                (isRoleStep && !canProceedFromRole) ||
                (!isRoleStep && !currentPageFullyAnswered)
              }
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
