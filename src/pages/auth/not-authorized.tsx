import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6 max-w-md">You don't have permission to access this page. Contact your administrator if you believe this is a mistake.</p>
        <div className="flex gap-3 justify-center">
          <Link to="/login"><Button variant="outline">Sign in</Button></Link>
          <Link to="/"><Button>Go Home</Button></Link>
        </div>
      </div>
    </div>
  );
}
