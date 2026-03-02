import { LifeBuoy, MessageSquare } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  requesterEmail: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-001',
    subject: 'Unable to generate report after payment',
    status: 'open',
    requesterEmail: 'raj.kumar@techcorp.in',
    createdAt: '2026-02-28T10:30:00Z',
    priority: 'high',
  },
  {
    id: 'TKT-002',
    subject: 'Invite email not received by responders',
    status: 'in_progress',
    requesterEmail: 'priya.s@globalhr.com',
    createdAt: '2026-02-27T14:15:00Z',
    priority: 'high',
  },
  {
    id: 'TKT-003',
    subject: 'Request to change company name after registration',
    status: 'open',
    requesterEmail: 'admin@nexgen.io',
    createdAt: '2026-02-26T09:00:00Z',
    priority: 'medium',
  },
  {
    id: 'TKT-004',
    subject: 'How to add a consultant to our company?',
    status: 'resolved',
    requesterEmail: 'hr@innovatetech.com',
    createdAt: '2026-02-25T16:45:00Z',
    priority: 'low',
  },
  {
    id: 'TKT-005',
    subject: 'CAP context selections reverting on page refresh',
    status: 'in_progress',
    requesterEmail: 'deepak.m@startupx.in',
    createdAt: '2026-02-24T11:20:00Z',
    priority: 'medium',
  },
  {
    id: 'TKT-006',
    subject: 'Billing inquiry - duplicate charge on CAP',
    status: 'closed',
    requesterEmail: 'finance@corpgroup.com',
    createdAt: '2026-02-20T08:00:00Z',
    priority: 'high',
  },
  {
    id: 'TKT-007',
    subject: 'Feature request: export audit log to CSV',
    status: 'open',
    requesterEmail: 'sysadmin@enterprise.org',
    createdAt: '2026-02-18T13:30:00Z',
    priority: 'low',
  },
];

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function SupportPage() {
  const openCount = MOCK_TICKETS.filter(
    (t) => t.status === 'open' || t.status === 'in_progress'
  ).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Support Queue"
        subtitle={`${openCount} open or in-progress tickets`}
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Support' },
        ]}
        actions={
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            {MOCK_TICKETS.length} total tickets
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-muted-foreground" />
            Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Requester
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TICKETS.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {ticket.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{ticket.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {ticket.requesterEmail}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          priorityColors[ticket.priority]
                        }`}
                      >
                        {ticket.priority.charAt(0).toUpperCase() +
                          ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(ticket.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
