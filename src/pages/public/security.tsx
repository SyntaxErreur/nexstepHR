import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Lock, Eye, Server, FileCheck, Users } from 'lucide-react';

export default function SecurityPage() {
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

      <div className="max-w-4xl mx-auto py-20 px-4">
        <div className="text-center mb-16">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Enterprise-Grade Security</h1>
          <p className="text-lg text-muted-foreground">Your data security is our top priority</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: <Lock className="h-6 w-6" />, title: 'Role-Based Access Control', desc: 'Granular permissions across Super Admin, Consultant, Sponsor, Member, and Responder roles.' },
            { icon: <Eye className="h-6 w-6" />, title: 'Complete Audit Trail', desc: 'Every action is logged with timestamps, user details, and change descriptions.' },
            { icon: <Server className="h-6 w-6" />, title: 'Data Encryption', desc: 'All data encrypted at rest and in transit using industry-standard protocols.' },
            { icon: <FileCheck className="h-6 w-6" />, title: 'Secure Assessments', desc: 'Token-based invite links with expiry controls for responder sessions.' },
            { icon: <Users className="h-6 w-6" />, title: 'Tenant Isolation', desc: 'Complete data isolation between organizations with strict access boundaries.' },
            { icon: <Shield className="h-6 w-6" />, title: 'SOC 2 Compliance', desc: 'Designed to meet SOC 2 Type II requirements for enterprise deployments.' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl border p-6">
              <div className="rounded-lg bg-primary/10 p-3 w-fit text-primary mb-4">{item.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
