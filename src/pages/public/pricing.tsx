import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    desc: 'Basic assessment with limited insights',
    features: ['1 CAP at a time', 'Up to 10 responders', 'Basic dashboard', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '₹25,000',
    period: 'per CAP',
    desc: 'Full assessment with advanced insights and PDF reports',
    features: ['Unlimited CAPs', 'Unlimited responders', 'Advanced dashboards', 'PDF report download', 'Role-based analysis', 'Priority support', 'Custom recommendations'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'Tailored solutions for large organizations',
    features: ['Everything in Professional', 'Multi-company support', 'Consultant access', 'Custom question banks', 'API access', 'Dedicated support', 'SLA guarantee', 'Custom PDF templates'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">N</span></div>
            <span className="font-bold text-xl">NexStep HR</span>
          </Link>
          <Link to="/login"><Button>Sign in</Button></Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">Choose the plan that fits your assessment needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div key={plan.name} className={`rounded-xl border bg-white p-8 ${plan.popular ? 'ring-2 ring-primary shadow-lg relative' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 mb-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm ml-1">/{plan.period}</span>}
              </div>
              <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>
              <Button className="w-full mb-6" variant={plan.popular ? 'default' : 'outline'}>{plan.cta}</Button>
              <ul className="space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
