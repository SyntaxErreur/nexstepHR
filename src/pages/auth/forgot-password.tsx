import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiAuth } from '@/api/mock';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiAuth.forgotPassword(email);
      setSent(true);
      toast.success('Password reset link sent!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold">N</span></div>
            <span className="font-bold text-2xl">NexStep HR</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{sent ? 'Check your email' : 'Reset your password'}</CardTitle>
            <CardDescription>
              {sent ? `We've sent a password reset link to ${email}` : 'Enter your email and we\'ll send you a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <div className="rounded-full bg-green-100 p-4 w-fit mx-auto mb-4">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Didn't receive the email? Check your spam folder or try again.</p>
                <Button variant="outline" onClick={() => setSent(false)}>Try again</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" loading={loading}>Send Reset Link</Button>
              </form>
            )}
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
