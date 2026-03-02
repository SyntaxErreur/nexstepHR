import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plug, Database, Mail, MessageSquare, Calendar, BarChart3 } from 'lucide-react';

const integrations = [
  { name: 'Slack', desc: 'Get notified on assessment milestones', icon: <MessageSquare className="h-6 w-6" />, status: 'available' },
  { name: 'Google Workspace', desc: 'Import team data and send invites', icon: <Mail className="h-6 w-6" />, status: 'available' },
  { name: 'HRIS Systems', desc: 'Sync employee data from BambooHR, Keka', icon: <Database className="h-6 w-6" />, status: 'coming_soon' },
  { name: 'Calendar', desc: 'Schedule assessment deadlines', icon: <Calendar className="h-6 w-6" />, status: 'coming_soon' },
  { name: 'BI Tools', desc: 'Export data to Tableau, PowerBI', icon: <BarChart3 className="h-6 w-6" />, status: 'coming_soon' },
];

export default function IntegrationsPage() {
  return (
    <div>
      <PageHeader title="Integrations" subtitle="Connect NexStep HR with your favorite tools" breadcrumbs={[{ label: 'Dashboard', href: '/app' }, { label: 'Integrations' }]} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(int => (
          <Card key={int.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/10 p-3 text-primary">{int.icon}</div>
                <Badge variant={int.status === 'available' ? 'default' : 'secondary'}>
                  {int.status === 'available' ? 'Available' : 'Coming Soon'}
                </Badge>
              </div>
              <CardTitle className="text-base mt-3">{int.name}</CardTitle>
              <CardDescription>{int.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled={int.status !== 'available'}>
                {int.status === 'available' ? 'Connect' : 'Notify Me'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
