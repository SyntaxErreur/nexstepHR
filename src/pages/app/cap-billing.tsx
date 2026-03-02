import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CreditCard, CheckCircle2, ShieldCheck, Loader2, Star, Zap } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { CAP, Payment } from '@/types';
import { toast } from 'sonner';

const PLANS = [
  {
    name: 'Basic',
    price: 15000,
    features: [
      'Standard report generation',
      'Up to 20 responder invites',
      'Dimension-level scoring',
      'PDF export',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    price: 25000,
    features: [
      'Advanced analytics & insights',
      'Unlimited responder invites',
      'Role-wise deep-dive breakdown',
      'Benchmarking against peers',
      'Actionable recommendations',
      'Priority support',
    ],
  },
];

export default function CAPBilling() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // RBAC: Only SPONSOR can access billing
  useEffect(() => {
    if (user && user.role !== 'SPONSOR') {
      toast.error('Only Sponsors can access billing.');
      navigate(`/app/caps/${capId}`);
    }
  }, [user, navigate, capId]);

  const cap = useAsync<CAP>(() => api.cap.getById(capId!), [capId]);

  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [bypassCode, setBypassCode] = useState('');
  const [bypassLoading, setBypassLoading] = useState(false);

  const handlePayNow = async (planName: string, amount: number) => {
    if (!capId) return;
    setPayingPlan(planName);
    setIsProcessing(true);
    try {
      const payment = await api.billing.initiatePayment(capId, amount, 'INR');
      await api.billing.completePayment(payment.id);
      toast.success('Payment completed successfully!');
      cap.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setPayingPlan(null);
    }
  };

  const handleBypassSubmit = async () => {
    if (!capId || !bypassCode.trim()) return;
    setBypassLoading(true);
    try {
      await api.billing.applyBypassCode(capId, bypassCode.trim());
      toast.success('Bypass code applied successfully!');
      setBypassCode('');
      cap.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Invalid bypass code.');
    } finally {
      setBypassLoading(false);
    }
  };

  if (cap.loading) return <PageSkeleton />;

  if (cap.error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Billing"
          breadcrumbs={[
            { label: 'CAPs', href: '/app/caps' },
            { label: 'Billing' },
          ]}
        />
        <ErrorCard message={cap.error} onRetry={cap.refetch} />
      </div>
    );
  }

  const capData = cap.data!;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Billing & Payment"
        subtitle={`Payment for "${capData.title}"`}
        breadcrumbs={[
          { label: 'CAPs', href: '/app/caps' },
          { label: capData.title, href: `/app/caps/${capId}` },
          { label: 'Billing' },
        ]}
        actions={
          <StatusBadge status={capData.paymentStatus} />
        }
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-lg bg-background p-8 shadow-xl flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-semibold">Processing payment...</p>
            <p className="text-sm text-muted-foreground">Please do not close this window.</p>
          </div>
        </div>
      )}

      {/* PAID STATE */}
      {capData.paymentStatus === 'paid' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">Payment Complete</h2>
            <p className="text-muted-foreground mb-4">
              Your payment has been successfully processed.
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Amount:</span>{' '}
                INR 25,000
              </p>
              <p>
                <span className="font-medium text-foreground">Date:</span>{' '}
                {formatDateTime(capData.updatedAt)}
              </p>
              <p>
                <span className="font-medium text-foreground">Access Level:</span>{' '}
                <Badge variant="secondary">
                  {capData.report?.accessLevel === 'advanced' ? 'Advanced' : 'Basic'}
                </Badge>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BYPASSED STATE */}
      {capData.paymentStatus === 'bypassed' && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-purple-100 p-4 mb-4">
              <ShieldCheck className="h-12 w-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-purple-800 mb-2">Access Bypassed</h2>
            <p className="text-muted-foreground mb-4">
              Payment has been bypassed using an admin-provided code.
            </p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Status:</span>{' '}
                <Badge className="bg-purple-100 text-purple-700">Bypassed</Badge>
              </p>
              {capData.bypassCodeId && (
                <p>
                  <span className="font-medium text-foreground">Bypass Code ID:</span>{' '}
                  {capData.bypassCodeId}
                </p>
              )}
              <p>
                <span className="font-medium text-foreground">Applied:</span>{' '}
                {formatDateTime(capData.updatedAt)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UNPAID STATE */}
      {capData.paymentStatus === 'unpaid' && (
        <>
          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan, idx) => {
              const isProfessional = idx === 1;
              return (
                <Card
                  key={plan.name}
                  className={
                    isProfessional
                      ? 'border-primary shadow-md relative'
                      : 'relative'
                  }
                >
                  {isProfessional && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">
                      {isProfessional ? (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          {plan.name}
                        </span>
                      ) : (
                        plan.name
                      )}
                    </CardTitle>
                    <CardDescription>
                      {isProfessional
                        ? 'Full-featured assessment with advanced insights'
                        : 'Essential assessment and reporting'}
                    </CardDescription>
                    <p className="text-3xl font-bold mt-4">
                      INR {plan.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-muted-foreground">per assessment</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isProfessional ? 'default' : 'outline'}
                      disabled={isProcessing}
                      loading={payingPlan === plan.name}
                      onClick={() => handlePayNow(plan.name, plan.price)}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now - INR {plan.price.toLocaleString('en-IN')}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bypass Code Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                Apply Bypass Code
              </CardTitle>
              <CardDescription>
                If you have received a bypass code from an administrator, enter it below to
                unlock access without payment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 max-w-md">
                <Input
                  placeholder="e.g. NSHR-ABCD-1234"
                  value={bypassCode}
                  onChange={(e) => setBypassCode(e.target.value)}
                  disabled={bypassLoading}
                />
                <Button
                  variant="outline"
                  onClick={handleBypassSubmit}
                  disabled={!bypassCode.trim() || bypassLoading}
                  loading={bypassLoading}
                >
                  Apply
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
