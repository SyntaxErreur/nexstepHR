import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Shield, Users, Zap, Check, Target, FileText } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="border-b bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="font-bold text-xl">NexStep HR</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/login"><Button>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full border px-4 py-1 text-sm mb-6 bg-primary/5 text-primary">
            <Zap className="h-3 w-3 mr-2" /> Context-Driven People Intelligence
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Understand Your People.<br />
            <span className="text-primary">Shape Your Future.</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            NexStep HR is a contextual assessment platform that generates data-driven insights about your organization's people health, tailored to your specific business context.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login"><Button size="lg">Start Free Assessment <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Button size="lg" variant="outline">Request Demo</Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for Modern People Teams</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">From early-stage startups to enterprises, NexStep HR adapts to your unique context.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Target className="h-6 w-6" />, title: 'Context-Based Assessment', desc: 'Select 8 mandatory context parameters to generate materiality-weighted assessments tailored to your stage, industry, and goals.' },
              { icon: <BarChart3 className="h-6 w-6" />, title: 'Data-Driven Dashboards', desc: 'Real-time dashboards showing weighted dimension scores, role-based breakdowns, and actionable insights.' },
              { icon: <FileText className="h-6 w-6" />, title: 'Professional Reports', desc: 'Generate comprehensive PDF reports with executive summaries, materiality analysis, and prioritized recommendations.' },
              { icon: <Users className="h-6 w-6" />, title: 'Multi-Role Responses', desc: 'Collect assessments from CXOs, managers, and ICs with role-specific question sets for nuanced analysis.' },
              { icon: <Shield className="h-6 w-6" />, title: 'Enterprise Security', desc: 'Role-based access control, audit logs, and secure invite-only responder sessions.' },
              { icon: <Zap className="h-6 w-6" />, title: 'Instant Insights', desc: 'Deterministic scoring algorithm provides immediate materiality and weightage calculations.' },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
                <div className="rounded-lg bg-primary/10 p-3 w-fit text-primary mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          </div>
          <div className="space-y-8">
            {[
              { step: '01', title: 'Create a CAP', desc: 'Define your Contextual Assessment Project with title and description.' },
              { step: '02', title: 'Select 8 Contexts', desc: 'Choose your investment stage, industry, growth ambition, and 5 more from the context master.' },
              { step: '03', title: 'Generate Outputs', desc: 'System computes materiality levels and parameter weightages based on your context.' },
              { step: '04', title: 'Invite Responders', desc: 'Send secure assessment links to team members across different roles.' },
              { step: '05', title: 'View Insights', desc: 'Once enough responses are collected, view dashboards and generate reports.' },
            ].map((s, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{s.title}</h3>
                  <p className="text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your People Strategy?</h2>
          <p className="text-primary-foreground/80 mb-8">Join leading companies using NexStep HR to make data-driven people decisions.</p>
          <Link to="/login"><Button size="lg" variant="secondary">Get Started Today <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center"><span className="text-white font-bold text-xs">N</span></div>
            <span className="font-semibold">NexStep HR</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/security" className="hover:text-foreground">Security</Link>
            <Link to="/login" className="hover:text-foreground">Sign in</Link>
          </div>
          <p className="text-sm text-muted-foreground">&copy; 2026 NexStep HR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
