import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck, AlertTriangle, ArrowRight, Building2, FileText } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ResponderInvite, CAP } from '@/types';

export default function ResponderEntry() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const invite = useAsync<ResponderInvite & { cap: CAP }>(
    () => api.invites.getByToken(token!),
    [token]
  );

  if (invite.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading assessment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invite.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-lg border-destructive/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-destructive/10 p-4 mb-4">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Invalid or Expired Link</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              {invite.error}
            </p>
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact the person who shared
              this link with you.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = invite.data!;
  const capData = data.cap;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <ClipboardCheck className="h-10 w-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{capData.title}</CardTitle>
          <CardDescription className="mt-2">
            You have been invited to participate in a people strategy assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assessment details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Assessment:</span>
              <span className="font-medium">{capData.title}</span>
            </div>
            {capData.description && (
              <p className="text-sm text-muted-foreground pl-6">
                {capData.description}
              </p>
            )}
            {data.roleHint && (
              <div className="flex items-center gap-2 text-sm pl-6">
                <span className="text-muted-foreground">Suggested Role:</span>
                <Badge variant="secondary">{data.roleHint}</Badge>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Before you begin:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground mt-0.5">1.</span>
                Select your role and tenure band to ensure the right questions are presented.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground mt-0.5">2.</span>
                Answer each question honestly on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree).
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground mt-0.5">3.</span>
                Your responses are anonymous. Individual answers are never shared with your organization.
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground mt-0.5">4.</span>
                The assessment takes approximately 10-15 minutes to complete.
              </li>
            </ul>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={() => navigate(`/responder/${token}/assessment`)}
          >
            Start Assessment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            By starting the assessment you agree to provide honest feedback for
            organizational improvement purposes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
