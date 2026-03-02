import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorCardProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorCard({ message = 'Something went wrong.', onRetry }: ErrorCardProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-1">Error</h3>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        {onRetry && <Button variant="outline" onClick={onRetry}>Try Again</Button>}
      </CardContent>
    </Card>
  );
}
