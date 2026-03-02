import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/mock';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CAPCreatePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // RBAC: Only SPONSOR can create CAPs
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can create assessments.');
      navigate('/app/caps');
    }
  }, [user, navigate]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minSubmissionsTotal, setMinSubmissionsTotal] = useState(8);
  const [inviteExpiryDays, setInviteExpiryDays] = useState(14);
  const [allowResubmission, setAllowResubmission] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    }
    if (minSubmissionsTotal < 1) {
      newErrors.minSubmissionsTotal = 'Minimum submissions must be at least 1.';
    }
    if (inviteExpiryDays < 1) {
      newErrors.inviteExpiryDays = 'Expiry days must be at least 1.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!user?.tenantCompanyId) {
      toast.error('No company associated with your account.');
      return;
    }

    setSubmitting(true);
    try {
      const cap = await api.cap.create({
        companyId: user.tenantCompanyId,
        title: title.trim(),
        description: description.trim(),
        createdByUserId: user.id,
        inviteSettings: {
          minSubmissionsTotal,
          inviteExpiryDays,
          allowResubmission,
        },
      });
      toast.success('CAP created successfully.');
      navigate(`/app/caps/new/context?capId=${cap.id}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create CAP.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Create New CAP"
        subtitle="Step 1 of 2 - Basic Information"
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: 'Create New' },
        ]}
      />

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        <Badge className="bg-primary text-primary-foreground">Step 1</Badge>
        <span className="text-sm font-medium">Basic Information</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline">Step 2</Badge>
        <span className="text-sm text-muted-foreground">Select Contexts</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  Assessment Details
                </CardTitle>
                <CardDescription>
                  Provide a title and description for this Context-Aware Assessment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="title"
                    placeholder="e.g. Q1 2026 Organization Health Assessment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={submitting}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose and scope of this assessment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={submitting}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invite Settings</CardTitle>
                <CardDescription>
                  Configure how responders are invited and submission requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="minSubmissions" className="text-sm font-medium">
                      Minimum Submissions
                    </label>
                    <Input
                      id="minSubmissions"
                      type="number"
                      min={1}
                      value={minSubmissionsTotal}
                      onChange={(e) => setMinSubmissionsTotal(Number(e.target.value))}
                      disabled={submitting}
                    />
                    {errors.minSubmissionsTotal && (
                      <p className="text-sm text-destructive">{errors.minSubmissionsTotal}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      The assessment will be marked "Ready" once this many responses are received.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="expiryDays" className="text-sm font-medium">
                      Invite Expiry (days)
                    </label>
                    <Input
                      id="expiryDays"
                      type="number"
                      min={1}
                      value={inviteExpiryDays}
                      onChange={(e) => setInviteExpiryDays(Number(e.target.value))}
                      disabled={submitting}
                    />
                    {errors.inviteExpiryDays && (
                      <p className="text-sm text-destructive">{errors.inviteExpiryDays}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Number of days before an invite link expires.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="allowResubmission"
                    type="checkbox"
                    checked={allowResubmission}
                    onChange={(e) => setAllowResubmission(e.target.checked)}
                    disabled={submitting}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="allowResubmission" className="text-sm font-medium">
                    Allow resubmission
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Responders can update their answers after submitting.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium truncate max-w-[160px]">
                    {title.trim() || '--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Submissions</span>
                  <span className="font-medium">{minSubmissionsTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invite Expiry</span>
                  <span className="font-medium">{inviteExpiryDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resubmission</span>
                  <span className="font-medium">{allowResubmission ? 'Allowed' : 'Not allowed'}</span>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                'Creating...'
              ) : (
                <>
                  Next: Select Contexts
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
