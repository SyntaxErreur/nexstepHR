import { useState, useEffect } from 'react';
import { Settings2, Save, Lock } from 'lucide-react';
import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Company, CompanySettings } from '@/types';
import { toast } from 'sonner';

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="space-y-0.5 pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring focus-visible:ring-offset-2
          ${checked ? 'bg-primary' : 'bg-muted'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg
            ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

export default function CompanySettingsPage() {
  const user = useAuthStore((state) => state.user);
  const companyId = user?.tenantCompanyId;
  const isSponsor = user?.role === 'SPONSOR';

  const company = useAsync<Company>(
    () => api.companies.getById(companyId!),
    [companyId],
    !!companyId
  );

  const [settings, setSettings] = useState<CompanySettings>({
    memberCanInvite: true,
    memberCanEditCapContext: false,
    allowResubmission: false,
    requirePerRoleMinimums: false,
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (company.data) {
      setSettings({ ...company.data.settings });
      setDirty(false);
    }
  }, [company.data]);

  const updateSetting = (key: keyof CompanySettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      await api.companies.update(companyId, { settings });
      toast.success('Settings saved successfully.');
      setDirty(false);
      company.refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <PageHeader title="Settings" />
        <ErrorCard message="No company associated with your account." />
      </div>
    );
  }

  if (company.loading) return <PageSkeleton />;

  if (company.error) {
    return (
      <div className="p-6">
        <PageHeader title="Settings" />
        <ErrorCard message={company.error} onRetry={company.refetch} />
      </div>
    );
  }

  const toggleItems: { key: keyof CompanySettings; label: string; description: string }[] = [
    {
      key: 'memberCanInvite',
      label: 'Member Can Invite Responders',
      description:
        'Allow team members to send assessment invites to responders on behalf of the company.',
    },
    {
      key: 'memberCanEditCapContext',
      label: 'Member Can Edit CAP Context',
      description:
        'Allow team members to modify context selections for assessments they have access to.',
    },
    {
      key: 'allowResubmission',
      label: 'Allow Resubmission',
      description:
        'Allow responders to submit the assessment more than once if they wish to update their answers.',
    },
    {
      key: 'requirePerRoleMinimums',
      label: 'Require Per-Role Minimums',
      description:
        'Enforce minimum submission counts for each responder role before marking an assessment as ready.',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Company Settings"
        subtitle={company.data?.name || 'Settings'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings' },
        ]}
        actions={
          !isSponsor ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Read Only
            </Badge>
          ) : undefined
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            Assessment & Permissions
          </CardTitle>
          <CardDescription>
            {isSponsor
              ? 'Configure how your team members interact with assessments and responders.'
              : 'These settings are managed by the company sponsor. Contact them to request changes.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {toggleItems.map((item) => (
            <ToggleRow
              key={item.key}
              label={item.label}
              description={item.description}
              checked={!!settings[item.key]}
              onChange={(val) => updateSetting(item.key, val)}
              disabled={!isSponsor}
            />
          ))}
        </CardContent>
      </Card>

      {isSponsor && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!dirty || saving}
            loading={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      )}
    </div>
  );
}
