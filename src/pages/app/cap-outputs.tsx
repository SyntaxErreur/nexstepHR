import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BarChart3, Loader2, RefreshCw, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTable } from '@/components/shared/data-table';
import { MaterialityBadge } from '@/components/shared/status-badge';
import { KPICard } from '@/components/shared/kpi-card';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { formatDateTime } from '@/lib/utils';
import type { CAP, CAPParameter } from '@/types';

export default function CAPOutputs() {
  const { capId } = useParams<{ capId: string }>();
  const navigate = useNavigate();

  const { data: cap, loading, error, refetch } = useAsync<CAP>(
    () => api.cap.getById(capId!),
    [capId],
  );

  const [generating, setGenerating] = useState(false);

  const handleGenerateOutputs = async () => {
    setGenerating(true);
    try {
      await api.cap.generateOutputs(capId!);
      toast.success('Outputs generated successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate outputs.');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="CAP Outputs"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAP', href: `/app/caps/${capId}` },
            { label: 'Outputs' },
          ]}
        />
        <ErrorCard message={error || 'CAP not found.'} onRetry={refetch} />
      </div>
    );
  }

  const outputs = cap.outputs;
  const parameters = outputs?.parameters || [];
  const summary = outputs?.materialitySummary || { high: 0, medium: 0, low: 0 };

  // Find max weight for proportional bar rendering
  const maxWeight = parameters.length > 0
    ? Math.max(...parameters.map((p) => p.weightPct))
    : 100;

  const columns = [
    {
      key: 'label',
      header: 'Dimension',
      sortable: true,
      render: (item: CAPParameter) => (
        <span className="font-medium">{item.label}</span>
      ),
    },
    {
      key: 'weightPct',
      header: 'Weight %',
      sortable: true,
      render: (item: CAPParameter) => (
        <span className="font-semibold">{item.weightPct}%</span>
      ),
    },
    {
      key: 'materialityLevel',
      header: 'Materiality',
      render: (item: CAPParameter) => (
        <MaterialityBadge level={item.materialityLevel} />
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="CAP Outputs"
        subtitle={`Materiality and parameter weights for "${cap.title}"`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title, href: `/app/caps/${cap.id}` },
          { label: 'Outputs' },
        ]}
        actions={
          outputs && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateOutputs}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </>
              )}
            </Button>
          )
        }
      />

      {!outputs ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
              title="No Outputs Generated"
              description={
                cap.contextSelections.length < 8
                  ? 'Complete all 8 context selections before generating outputs.'
                  : 'Generate outputs to see materiality levels and parameter weights for this CAP.'
              }
              action={
                cap.contextSelections.length === 8
                  ? {
                      label: generating ? 'Generating...' : 'Generate Outputs',
                      onClick: handleGenerateOutputs,
                    }
                  : {
                      label: 'Select Contexts',
                      onClick: () => navigate(`/app/caps/${cap.id}/context`),
                    }
              }
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Materiality Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard
              title="High Materiality"
              value={summary.high}
              subtitle="Dimensions requiring critical attention"
              icon={<AlertTriangle className="h-5 w-5" />}
              className="border-red-200"
            />
            <KPICard
              title="Medium Materiality"
              value={summary.medium}
              subtitle="Dimensions of moderate importance"
              icon={<TrendingUp className="h-5 w-5" />}
              className="border-amber-200"
            />
            <KPICard
              title="Low Materiality"
              value={summary.low}
              subtitle="Dimensions with lower priority"
              icon={<BarChart3 className="h-5 w-5" />}
              className="border-green-200"
            />
          </div>

          {/* Computed timestamp */}
          {outputs.computedAt && (
            <p className="text-xs text-muted-foreground">
              Outputs computed at {formatDateTime(outputs.computedAt)}
            </p>
          )}

          {/* Outputs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dimension Weights</CardTitle>
              <CardDescription>
                Materiality level and weight percentage for each dimension.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={parameters}
                columns={columns}
                keyField="key"
                emptyMessage="No parameters found."
              />
            </CardContent>
          </Card>

          {/* Visual Weight Bars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weight Distribution</CardTitle>
              <CardDescription>
                Horizontal bars proportional to each dimension's weight.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parameters
                  .slice()
                  .sort((a, b) => b.weightPct - a.weightPct)
                  .map((param) => {
                    const widthPercent =
                      maxWeight > 0
                        ? Math.round((param.weightPct / maxWeight) * 100)
                        : 0;

                    const barColor =
                      param.materialityLevel === 'High'
                        ? 'bg-red-500'
                        : param.materialityLevel === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-green-500';

                    return (
                      <div key={param.key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{param.label}</span>
                          <div className="flex items-center gap-2">
                            <MaterialityBadge level={param.materialityLevel} />
                            <span className="font-semibold text-muted-foreground w-12 text-right">
                              {param.weightPct}%
                            </span>
                          </div>
                        </div>
                        <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${barColor}`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
