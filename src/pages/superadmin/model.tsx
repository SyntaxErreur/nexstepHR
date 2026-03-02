import { useState, useEffect } from 'react';
import { Save, RotateCcw, Weight, Clock, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import type { BaseModelWeights } from '@/types';

export default function ModelPage() {
  const user = useAuthStore((s) => s.user);

  const { data: baseModel, loading, error, refetch } = useAsync(
    () => api.model.getBaseModel(),
    [],
  );

  // Local editable weights state
  const [weights, setWeights] = useState<BaseModelWeights['weights']>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync fetched data into local state
  useEffect(() => {
    if (baseModel) {
      setWeights(baseModel.weights.map((w) => ({ ...w })));
      setDirty(false);
    }
  }, [baseModel]);

  const handleWeightChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (value !== '' && isNaN(num)) return;
    setWeights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], baseWeight: value === '' ? 0 : num };
      return next;
    });
    setDirty(true);
  };

  const handleLabelChange = (index: number, value: string) => {
    setWeights((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], label: value };
      return next;
    });
    setDirty(true);
  };

  const handleReset = () => {
    if (baseModel) {
      setWeights(baseModel.weights.map((w) => ({ ...w })));
      setDirty(false);
      toast.info('Changes reverted.');
    }
  };

  const handleSave = async () => {
    // Validate total weight
    const total = weights.reduce((sum, w) => sum + w.baseWeight, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast.error(`Total weight must equal 100%. Current total: ${total.toFixed(1)}%`);
      return;
    }
    if (weights.some((w) => !w.label.trim())) {
      toast.error('All dimensions must have a label.');
      return;
    }

    setSaving(true);
    try {
      await api.model.updateBaseModel(weights, user?.id || 'unknown');
      toast.success('Base model weights saved successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save model weights.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Base Model Weights" />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  const totalWeight = weights.reduce((sum, w) => sum + w.baseWeight, 0);
  const isValidTotal = Math.abs(totalWeight - 100) <= 0.01;

  const columns = [
    {
      key: 'key',
      header: 'Dimension Key',
      sortable: true,
      render: (item: BaseModelWeights['weights'][number], _: any, index?: number) => (
        <code className="px-2 py-1 rounded bg-muted text-sm font-mono">{item.key}</code>
      ),
    },
    {
      key: 'label',
      header: 'Label',
      render: (item: BaseModelWeights['weights'][number]) => {
        const idx = weights.findIndex((w) => w.key === item.key);
        return (
          <Input
            value={weights[idx]?.label ?? item.label}
            onChange={(e) => handleLabelChange(idx, e.target.value)}
            className="max-w-[240px] h-9"
          />
        );
      },
    },
    {
      key: 'baseWeight',
      header: 'Base Weight (%)',
      className: 'w-[160px]',
      render: (item: BaseModelWeights['weights'][number]) => {
        const idx = weights.findIndex((w) => w.key === item.key);
        return (
          <Input
            type="number"
            step="0.5"
            min="0"
            max="100"
            value={weights[idx]?.baseWeight ?? item.baseWeight}
            onChange={(e) => handleWeightChange(idx, e.target.value)}
            className="max-w-[120px] h-9"
          />
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Base Model Weights"
        subtitle="Configure the default dimension weights used by the assessment computation engine"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Model Weights' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={!dirty}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!dirty}>
              <Save className="h-4 w-4 mr-2" />
              Save Weights
            </Button>
          </div>
        }
      />

      {/* Version & metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Model Version</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base px-3 py-1">
                v{baseModel?.version ?? 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last Updated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {baseModel?.updatedAt
                  ? new Date(baseModel.updatedAt).toLocaleString()
                  : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Weight</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${isValidTotal ? 'text-green-600' : 'text-red-600'}`}>
                {totalWeight.toFixed(1)}%
              </span>
              {!isValidTotal && (
                <span className="text-xs text-red-500">Must equal 100%</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info banner */}
      {dirty && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4 text-sm text-amber-800">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>You have unsaved changes. Save to increment the model version.</span>
        </div>
      )}

      {/* Weights table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Weight className="h-5 w-5" />
            Dimension Weights
          </CardTitle>
          <CardDescription>
            Edit the base weight percentages for each assessment dimension. Weights must total 100%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={weights}
            columns={columns}
            keyField="key"
            emptyMessage="No dimensions configured."
          />
        </CardContent>
      </Card>
    </div>
  );
}
