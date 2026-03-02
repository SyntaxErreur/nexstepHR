import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth';
import { apiAuth } from '@/api/mock';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await apiAuth.login(email, password);
      login(user);
      toast.success(`Welcome back, ${user.name}!`);
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'SUB_ADMIN':
          navigate('/sa');
          break;
        case 'CONSULTANT':
          navigate('/consultant');
          break;
        default:
          navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string) => {
    setEmail(email);
    setPassword('demo');
    setLoading(true);
    try {
      const user = await apiAuth.login(email, 'demo');
      login(user);
      toast.success(`Welcome back, ${user.name}!`);
      switch (user.role) {
        case 'SUPER_ADMIN':
        case 'SUB_ADMIN':
          navigate('/sa');
          break;
        case 'CONSULTANT':
          navigate('/consultant');
          break;
        default:
          navigate('/app');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="font-bold text-2xl">NexStep HR</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>Enter your email below to access the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <Input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="rounded" /> Remember me
                </label>
                <Link to="/forgot-password" className="text-sm text-primary hover:underline">Forgot password?</Link>
              </div>
              <Button type="submit" className="w-full" loading={loading}>Sign in</Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Login for Demo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Demo Login</CardTitle>
            <CardDescription>Click any role to sign in instantly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => quickLogin('priya@nexstephr.com')}>Super Admin</Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin('rahul@consultingfirm.com')}>Consultant</Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin('anita@nexstephr.com')}>Sub Admin</Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin('vikram@acmecorp.com')}>Sponsor (Acme)</Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin('neha@techstart.io')}>Sponsor (Tech)</Button>
              <Button variant="outline" size="sm" onClick={() => quickLogin('arjun@acmecorp.com')}>Member (View Only)</Button>
            </div>
            <div className="border-t pt-3 space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                <span className="font-medium">Responders</span> do not log in here. They access assessments via unique invite links sent by Sponsors.
              </p>
              <div className="text-center">
                <Link
                  to="/responder/demo-responder-token-001"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Try Demo Responder Assessment →
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
