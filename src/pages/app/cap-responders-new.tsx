import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Users, Mail,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import type { CAP, ResponderInvite } from '@/types';

const ROLE_OPTIONS = [
  { value: '', label: 'No role hint (optional)' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Individual Contributor', label: 'Individual Contributor' },
  { value: 'Director', label: 'Director' },
  { value: 'VP', label: 'VP' },
  { value: 'Executive', label: 'Executive' },
  { value: 'HR', label: 'HR' },
  { value: 'Peer', label: 'Peer' },
  { value: 'Direct Report', label: 'Direct Report' },
];

function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const entries = raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];

  const seen = new Set<string>();
  for (const entry of entries) {
    if (seen.has(entry)) continue;
    seen.add(entry);
    if (emailRegex.test(entry)) {
      valid.push(entry);
    } else {
      invalid.push(entry);
    }
  }

  return { valid, invalid };
}

export default function CAPRespondersNew() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // RBAC: Only SPONSOR can invite responders
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can invite responders.');
      navigate(`/app/caps/${capId}/responders`);
    }
  }, [user, navigate, capId]);

  const { data: cap, loading, error, refetch } = useAsync<CAP>(
    () => api.cap.getById(capId!),
    [capId],
  );

  const [emailsRaw, setEmailsRaw] = useState('');
  const [roleHint, setRoleHint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    successCount: number;
    created: ResponderInvite[];
    invalidEmails: string[];
  } | null>(null);

  const handleSubmit = async () => {
    const { valid, invalid } = parseEmails(emailsRaw);

    if (valid.length === 0) {
      toast.error(
        invalid.length > 0
          ? `No valid emails found. ${invalid.length} invalid email(s) detected.`
          : 'Please enter at least one email address.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.invites.create({
        capId: capId!,
        emails: valid,
        roleHint: roleHint || undefined,
      });

      setResult({
        successCount: created.length,
        created,
        invalidEmails: invalid,
      });

      toast.success(
        `${created.length} invite${created.length !== 1 ? 's' : ''} sent successfully.`,
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to create invites.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMore = () => {
    setResult(null);
    setEmailsRaw('');
    setRoleHint('');
  };

  if (loading) return <PageSkeleton />;

  if (error || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="Invite Responders"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAP', href: `/app/caps/${capId}` },
            { label: 'Responders', href: `/app/caps/${capId}/responders` },
            { label: 'New Invite' },
          ]}
        />
        <ErrorCard message={error || 'CAP not found.'} onRetry={refetch} />
      </div>
    );
  }

  // If we have results, show the success/summary view
  if (result) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Invites Sent"
          subtitle={`Invitations for "${cap.title}"`}
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAPs', href: '/app/caps' },
            { label: cap.title, href: `/app/caps/${cap.id}` },
            { label: 'Responders', href: `/app/caps/${cap.id}/responders` },
            { label: 'Results' },
          ]}
        />

        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">
                {result.successCount} Invite{result.successCount !== 1 ? 's' : ''} Sent
                Successfully
              </h3>
              <p className="text-muted-foreground max-w-md">
                Responders will receive an email with a link to complete the
                assessment. You can track their progress on the responders page.
              </p>
            </div>
          </CardContent>
        </Card>

        {result.invalidEmails.length > 0 && (
          <Card className="border-amber-200">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                <AlertCircle className="h-4 w-4" />
                {result.invalidEmails.length} Invalid Email{result.invalidEmails.length !== 1 ? 's' : ''} Skipped
              </CardTitle>
              <CardDescription>
                The following entries were not valid email addresses and were
                skipped.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {result.invalidEmails.map((email) => (
                  <Badge key={email} variant="secondary">
                    {email}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Created invites summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sent Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.created.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {inv.emailOrPhone}
                    </span>
                  </div>
                  {inv.roleHint && (
                    <Badge variant="outline">{inv.roleHint}</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/app/caps/${cap.id}/responders`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Responders
          </Button>
          <Button onClick={handleSendMore}>
            <Send className="h-4 w-4 mr-2" />
            Send More Invites
          </Button>
        </div>
      </div>
    );
  }

  // Parse current input to show preview
  const { valid: previewValid, invalid: previewInvalid } = emailsRaw.trim()
    ? parseEmails(emailsRaw)
    : { valid: [], invalid: [] };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Invite Responders"
        subtitle={`Send assessment invitations for "${cap.title}"`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title, href: `/app/caps/${cap.id}` },
          { label: 'Responders', href: `/app/caps/${cap.id}/responders` },
          { label: 'New Invite' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/app/caps/${cap.id}/responders`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                Add Responder Emails
              </CardTitle>
              <CardDescription>
                Enter email addresses, one per line or separated by commas.
                Duplicate emails will be automatically removed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={"john.doe@example.com\njane.smith@example.com\nmanager@company.org"}
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Role Hint (Optional)
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Assign a default role hint to all invites in this batch. Responders
                  can override this when submitting.
                </p>
                <Select
                  options={ROLE_OPTIONS}
                  value={roleHint}
                  onValueChange={setRoleHint}
                  placeholder="Select a role hint..."
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || previewValid.length === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending Invites...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send {previewValid.length > 0 ? `${previewValid.length} ` : ''}
                      Invite{previewValid.length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/app/caps/${cap.id}/responders`)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>
                Live validation of entered emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valid emails</span>
                <Badge variant={previewValid.length > 0 ? 'default' : 'secondary'}>
                  {previewValid.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Invalid entries</span>
                <Badge
                  variant={previewInvalid.length > 0 ? 'destructive' : 'secondary'}
                >
                  {previewInvalid.length}
                </Badge>
              </div>
              {roleHint && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role hint</span>
                  <Badge variant="outline">{roleHint}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {previewValid.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Valid Emails ({previewValid.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {previewValid.map((email) => (
                    <p key={email} className="text-sm font-mono truncate">
                      {email}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {previewInvalid.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Invalid ({previewInvalid.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {previewInvalid.map((entry) => (
                    <p
                      key={entry}
                      className="text-sm font-mono text-red-600 truncate"
                    >
                      {entry}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">CAP Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already invited</span>
                <span className="font-medium">{cap.respondersInvitedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submissions</span>
                <span className="font-medium">
                  {cap.submissionsCount} / {cap.inviteSettings.minSubmissionsTotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invite expiry</span>
                <span className="font-medium">
                  {cap.inviteSettings.inviteExpiryDays} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
