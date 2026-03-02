import { CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';

export default function ThankYouPage() {
  const submissionTime = new Date().toISOString();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-6">
          {/* Success Icon */}
          <div className="rounded-full bg-green-100 p-6">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
          </div>

          {/* Main Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Thank You!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for completing the assessment.
            </p>
          </div>

          {/* Submission Details */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3 w-full max-w-sm">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Submitted at:</span>
              <span className="font-medium">{formatDateTime(submissionTime)}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Recorded
              </Badge>
            </div>
          </div>

          {/* Confirmation Note */}
          <div className="space-y-2 max-w-sm">
            <p className="text-sm text-muted-foreground">
              Your responses have been recorded and will be included in the
              assessment analysis. Individual answers are kept anonymous and
              cannot be traced back to you.
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground pt-4">
            You may now close this window. No further action is needed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
