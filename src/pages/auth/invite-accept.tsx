import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { apiAuth } from '@/api/mock';

export default function InviteAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await apiAuth.acceptInvite(token, name, password);
      login(user);
      toast.success('Account activated successfully!');
      navigate('/app');
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
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center mx-auto"><span className="text-white font-bold">N</span></div>
          <h1 className="font-bold text-2xl mt-2">NexStep HR</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Accept Invitation</CardTitle>
            <CardDescription>Set up your account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Full Name</label>
                <Input placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Set Password</label>
                <Input type="password" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" loading={loading}>Activate Account</Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
