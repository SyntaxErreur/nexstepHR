import { Tag, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReleaseEntry {
  version: string;
  date: string;
  title: string;
  type: 'major' | 'minor' | 'patch';
  description: string[];
}

const RELEASES: ReleaseEntry[] = [
  {
    version: '2.4.0',
    date: '2026-03-01',
    title: 'Consultant Role & Multi-Company Support',
    type: 'major',
    description: [
      'Added Consultant role with read-only access to assigned companies.',
      'Consultants can view CAPs, submissions, and reports across assigned companies.',
      'New consultant dashboard with cross-company KPI aggregation.',
      'Impersonation support for Super Admins to troubleshoot user accounts.',
    ],
  },
  {
    version: '2.3.1',
    date: '2026-02-20',
    title: 'Bug Fixes & Performance',
    type: 'patch',
    description: [
      'Fixed report generation failing when CAP has exactly minimum submissions.',
      'Improved loading performance on the audit log page with pagination.',
      'Resolved invite email not showing correct expiry date.',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-02-10',
    title: 'Advanced Report Generation',
    type: 'minor',
    description: [
      'Introduced PDF template system with customizable report sections.',
      'Added executive summary auto-generation based on dimension scores.',
      'New report access levels: basic (free) and advanced (paid).',
      'Bypass code system for complimentary advanced report access.',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-01-25',
    title: 'Context Master Overhaul',
    type: 'minor',
    description: [
      'Redesigned context category and value management interface.',
      'Added context multiplier rules for fine-tuned materiality computation.',
      'Context change request workflow for post-launch modifications.',
      'Improved context selection validation (exactly 8 selections required).',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-01-10',
    title: 'Payment & Billing Integration',
    type: 'minor',
    description: [
      'Mock payment gateway integration for CAP report upgrades.',
      'Payment status tracking (pending, completed, failed).',
      'Bypass code generation and management for Super Admins.',
      'Revenue reporting on the Super Admin dashboard.',
    ],
  },
  {
    version: '2.0.0',
    date: '2025-12-15',
    title: 'Platform Rewrite - NexStep HR v2',
    type: 'major',
    description: [
      'Complete platform rewrite with React + TypeScript.',
      'New role-based access control: Super Admin, Sub Admin, Sponsor, Member, Responder.',
      'CAP lifecycle management: draft, active, collecting, ready, report generated, archived.',
      'Real-time submission tracking and threshold notifications.',
      'Multi-company tenant architecture with isolated data.',
    ],
  },
];

const typeColors: Record<string, string> = {
  major: 'bg-primary text-primary-foreground',
  minor: 'bg-blue-100 text-blue-800',
  patch: 'bg-gray-100 text-gray-800',
};

export default function ChangelogPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Changelog"
        subtitle="Platform release history and updates"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Changelog' },
        ]}
      />

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-8">
          {RELEASES.map((release, idx) => (
            <div key={release.version} className="relative flex gap-6">
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0">
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${
                    idx === 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Tag className="h-5 w-5" />
                </div>
              </div>

              {/* Content */}
              <Card className="flex-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">
                          {release.title}
                        </h3>
                        <Badge className={typeColors[release.type]}>
                          {release.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="font-mono text-xs">
                          v{release.version}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(release.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {release.description.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
