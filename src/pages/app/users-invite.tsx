import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Mail,
  Shield,
  MessageSquare,
  CheckCircle2,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { apiUsers } from '@/api/mock';
import { useAsyncAction } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorCard } from '@/components/shared/error-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { User } from '@/types';

export default function UsersInvitePage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const companyId = user?.tenantCompanyId;

  // RBAC: Only SPONSOR can invite users
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can invite team members.');
      navigate('/app/users');
    }
  }, [user, navigate]);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');

  const { execute: createUser, loading: submitting, error: submitError } = useAsyncAction(
    async (data: { email: string; role: 'MEMBER' | 'RESPONDER'; tenantCompanyId: string }) => {
      return apiUsers.create({
        email: data.email,
        role: data.role,
        tenantCompanyId: data.tenantCompanyId,
      });
    },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter an email address.');
      return;
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    if (!companyId) {
      toast.error('No company associated with your account.');
      return;
    }

    try {
      await createUser({
        email: email.trim(),
        role: role as 'MEMBER' | 'RESPONDER',
        tenantCompanyId: companyId,
      });
      setInvitedEmail(email.trim());
      setSuccess(true);
      setEmail('');
      setRole('MEMBER');
      setMessage('');
      toast.success('Invitation sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send invitation.');
    }
  };

  const handleInviteAnother = () => {
    setSuccess(false);
    setInvitedEmail('');
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <PageHeader title="Invite User" />
        <ErrorCard message="No company associated with your account." />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="Invite User"
          breadcrumbs={[
            { label: 'App', href: '/app' },
            { label: 'Users', href: '/app/users' },
            { label: 'Invite' },
          ]}
        />
        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Invitation Sent!</h3>
            <p className="text-sm text-muted-foreground mb-1">
              An invitation has been sent to
            </p>
            <p className="text-sm font-medium mb-6">{invitedEmail}</p>
            <p className="text-xs text-muted-foreground mb-8 max-w-sm">
              They will receive an email with a link to create their account and
              join your team. The invite will appear as pending until they accept.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/app/users')}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Users
              </Button>
              <Button onClick={handleInviteAnother}>
                <UserPlus className="h-4 w-4 mr-1" />
                Invite Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Invite User"
        subtitle="Send an invitation to join your team"
        breadcrumbs={[
          { label: 'App', href: '/app' },
          { label: 'Users', href: '/app/users' },
          { label: 'Invite' },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate('/app/users')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Button>
        }
      />

      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-muted-foreground" />
            New Invitation
          </CardTitle>
          <CardDescription>
            Fill in the details below to invite a new user to your company. They
            will receive an email with instructions to set up their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
                <span className="text-destructive">*</span>
              </label>
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Role
                <span className="text-destructive">*</span>
              </label>
              <Select
                options={[
                  { value: 'MEMBER', label: 'Member - Can view assessments and reports' },
                ]}
                value={role}
                onValueChange={setRole}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Members have read-only access to assessments, reports, and dashboards. Responders are invited separately via the CAP invite flow.
              </p>
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                Personal Message
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (optional)
                </span>
              </label>
              <Textarea
                placeholder="Add a personal note to the invitation email..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={submitting}
                rows={3}
              />
            </div>

            {/* Error display */}
            {submitError && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/app/users')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send className="h-4 w-4 mr-1" />
                {submitting ? 'Sending Invite...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
