import { useState, useEffect } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { apiSettings } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { PlatformSettings } from '@/types';

export default function SettingsPage() {
  const { data: settings, loading, error, refetch } = useAsync<PlatformSettings>(
    () => apiSettings.get(),
    []
  );

  const [form, setForm] = useState<PlatformSettings>({
    materialityThresholds: { high: 75, medium: 50 },
    defaultInviteExpiryDays: 14,
    defaultMinSubmissions: 8,
    enableRandomFailures: false,
    failureRate: 0.1,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiSettings.update(form);
      toast.success('Platform settings saved successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setForm(settings);
      toast.info('Form reset to last saved values.');
    }
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title="Platform Settings"
          breadcrumbs={[
            { label: 'Super Admin', href: '/sa' },
            { label: 'Settings' },
          ]}
        />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Platform Settings"
        subtitle="Configure global platform parameters and behavior"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Settings' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Materiality Thresholds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              Materiality Thresholds
            </CardTitle>
            <CardDescription>
              Define the weight percentage cutoffs for materiality levels.
              Parameters with weight above the high threshold are classified as
              High, above medium as Medium, and below as Low.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                High Threshold (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.materialityThresholds.high}
                onChange={(e) =>
                  setForm({
                    ...form,
                    materialityThresholds: {
                      ...form.materialityThresholds,
                      high: Number(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Parameters above this weight are classified as High materiality.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Medium Threshold (%)
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.materialityThresholds.medium}
                onChange={(e) =>
                  setForm({
                    ...form,
                    materialityThresholds: {
                      ...form.materialityThresholds,
                      medium: Number(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Parameters above this but below high are classified as Medium.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invite & Submission Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invite & Submission Defaults</CardTitle>
            <CardDescription>
              Default values applied when creating new CAPs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Default Invite Expiry (days)
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                value={form.defaultInviteExpiryDays}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultInviteExpiryDays: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of days before a responder invite link expires.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Default Minimum Submissions
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.defaultMinSubmissions}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultMinSubmissions: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum number of responses required before a report can be
                generated.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Simulated Failures */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Simulated Failures (Dev/QA)</CardTitle>
            <CardDescription>
              Enable random API failures to test error handling in the UI. Only
              use in development or QA environments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable Random Failures</p>
                <p className="text-xs text-muted-foreground">
                  When enabled, API calls have a chance of throwing a simulated
                  error.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={form.enableRandomFailures ? 'destructive' : 'secondary'}
                >
                  {form.enableRandomFailures ? 'Enabled' : 'Disabled'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm({
                      ...form,
                      enableRandomFailures: !form.enableRandomFailures,
                    })
                  }
                >
                  {form.enableRandomFailures ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Failure Rate
                </label>
                <span className="text-sm font-mono text-muted-foreground">
                  {Math.round(form.failureRate * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(form.failureRate * 100)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    failureRate: Number(e.target.value) / 100,
                  })
                }
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                disabled={!form.enableRandomFailures}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
