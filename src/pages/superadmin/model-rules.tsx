import { useState } from 'react';
import { Plus, Trash2, Scale, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { ContextMultiplierRule, ContextCategory, ContextValue, BaseModelWeights } from '@/types';

export default function ModelRulesPage() {
  // Load rules
  const { data: rules, loading: rulesLoading, error: rulesError, refetch: refetchRules } = useAsync(
    () => api.model.getRules(),
    [],
  );

  // Load categories for the dropdown
  const { data: categories, loading: catLoading, error: catError } = useAsync(
    () => api.contextMaster.listCategories(),
    [],
  );

  // Load all values for lookups
  const { data: allValues, loading: valLoading, error: valError } = useAsync(
    () => api.contextMaster.listValues(),
    [],
  );

  // Load base model to get dimension keys
  const { data: baseModel, loading: modelLoading, error: modelError } = useAsync(
    () => api.model.getBaseModel(),
    [],
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedValueId, setSelectedValueId] = useState('');
  const [selectedDimensionKey, setSelectedDimensionKey] = useState('');
  const [multiplierInput, setMultiplierInput] = useState('1.0');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Confirm delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loading = rulesLoading || catLoading || valLoading || modelLoading;
  const error = rulesError || catError || valError || modelError;

  // Lookup helpers
  const getCategoryName = (categoryId: string): string => {
    return categories?.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const getValueLabel = (valueId: string): string => {
    return allValues?.find((v) => v.id === valueId)?.valueLabel || valueId;
  };

  const getDimensionLabel = (key: string): string => {
    const dim = baseModel?.weights.find((w) => w.key === key);
    return dim ? dim.label : key;
  };

  // Filtered values based on selected category
  const filteredValues = allValues?.filter((v) => v.categoryId === selectedCategoryId) || [];

  const openAddDialog = () => {
    setSelectedCategoryId('');
    setSelectedValueId('');
    setSelectedDimensionKey('');
    setMultiplierInput('1.0');
    setDialogOpen(true);
  };

  const handleAddRule = async () => {
    if (!selectedCategoryId) {
      toast.error('Please select a category.');
      return;
    }
    if (!selectedValueId) {
      toast.error('Please select a value.');
      return;
    }
    if (!selectedDimensionKey) {
      toast.error('Please select a dimension.');
      return;
    }
    const multiplier = parseFloat(multiplierInput);
    if (isNaN(multiplier) || multiplier <= 0) {
      toast.error('Multiplier must be a positive number.');
      return;
    }

    // Check for duplicate rule
    const duplicate = rules?.find(
      (r) =>
        r.categoryId === selectedCategoryId &&
        r.valueId === selectedValueId &&
        r.dimensionKey === selectedDimensionKey,
    );
    if (duplicate) {
      toast.error('A rule with this exact combination already exists.');
      return;
    }

    setSaving(true);
    try {
      await api.model.addRule({
        categoryId: selectedCategoryId,
        valueId: selectedValueId,
        dimensionKey: selectedDimensionKey,
        multiplier,
      });
      toast.success('Rule added successfully.');
      setDialogOpen(false);
      refetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingId(ruleId);
    try {
      await api.model.deleteRule(ruleId);
      toast.success('Rule deleted.');
      setConfirmDeleteId(null);
      refetchRules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete rule.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Context Multiplier Rules" />
        <ErrorCard message={error} onRetry={refetchRules} />
      </div>
    );
  }

  const categoryOptions = (categories || [])
    .filter((c) => c.isActive)
    .map((c) => ({ value: c.id, label: c.name }));

  const valueOptions = filteredValues
    .filter((v) => v.isActive)
    .map((v) => ({ value: v.id, label: v.valueLabel }));

  const dimensionOptions = (baseModel?.weights || []).map((w) => ({
    value: w.key,
    label: `${w.label} (${w.key})`,
  }));

  const columns = [
    {
      key: 'categoryId',
      header: 'Category',
      sortable: true,
      render: (item: ContextMultiplierRule) => (
        <span className="font-medium">{getCategoryName(item.categoryId)}</span>
      ),
    },
    {
      key: 'valueId',
      header: 'Value',
      sortable: true,
      render: (item: ContextMultiplierRule) => (
        <Badge variant="outline">{getValueLabel(item.valueId)}</Badge>
      ),
    },
    {
      key: 'dimensionKey',
      header: 'Dimension',
      sortable: true,
      render: (item: ContextMultiplierRule) => (
        <div>
          <span>{getDimensionLabel(item.dimensionKey)}</span>
          <span className="ml-2 text-xs text-muted-foreground font-mono">({item.dimensionKey})</span>
        </div>
      ),
    },
    {
      key: 'multiplier',
      header: 'Multiplier',
      sortable: true,
      render: (item: ContextMultiplierRule) => {
        const isBoost = item.multiplier > 1;
        const isReduce = item.multiplier < 1;
        return (
          <Badge
            variant={isBoost ? 'default' : isReduce ? 'secondary' : 'outline'}
            className={
              isBoost
                ? 'bg-green-100 text-green-800 border-green-200'
                : isReduce
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : ''
            }
          >
            x{item.multiplier.toFixed(2)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px] text-right',
      render: (item: ContextMultiplierRule) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmDeleteId(item.id);
          }}
          disabled={deletingId === item.id}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Context Multiplier Rules"
        subtitle="Define how context selections modify dimension weights in the assessment model"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Multiplier Rules' },
        ]}
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rule
          </Button>
        }
      />

      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rules</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{rules?.length ?? 0}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categories Covered</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {new Set(rules?.map((r) => r.categoryId) ?? []).size}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dimensions Affected</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">
              {new Set(rules?.map((r) => r.dimensionKey) ?? []).size}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Rules table */}
      {!rules || rules.length === 0 ? (
        <EmptyState
          icon={<Scale className="h-8 w-8 text-muted-foreground" />}
          title="No multiplier rules configured"
          description="Add rules to customize how context selections affect dimension weights during assessment computation."
          action={{ label: 'Add Rule', onClick: openAddDialog }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Rules
            </CardTitle>
            <CardDescription>
              Each rule applies a multiplier to a dimension weight when a specific context value is selected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={rules}
              columns={columns}
              keyField="id"
              searchable
              searchFields={['dimensionKey']}
              emptyMessage="No rules match your search."
            />
          </CardContent>
        </Card>
      )}

      {/* Add Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Multiplier Rule</DialogTitle>
            <DialogDescription>
              Define a context-to-multiplier rule. When the selected context value is chosen in an assessment, the specified dimension weight will be multiplied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Category</label>
              <Select
                options={categoryOptions}
                placeholder="Select a category..."
                value={selectedCategoryId}
                onValueChange={(val) => {
                  setSelectedCategoryId(val);
                  setSelectedValueId('');
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Value</label>
              <Select
                options={valueOptions}
                placeholder={
                  selectedCategoryId ? 'Select a value...' : 'Select a category first'
                }
                value={selectedValueId}
                onValueChange={setSelectedValueId}
                disabled={!selectedCategoryId}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dimension</label>
              <Select
                options={dimensionOptions}
                placeholder="Select a dimension..."
                value={selectedDimensionKey}
                onValueChange={setSelectedDimensionKey}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Multiplier</label>
              <Input
                type="number"
                step="0.05"
                min="0.01"
                placeholder="1.0"
                value={multiplierInput}
                onChange={(e) => setMultiplierInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Values greater than 1.0 increase the dimension weight; less than 1.0 decrease it.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRule} loading={saving}>
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this multiplier rule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deletingId !== null}
              onClick={() => confirmDeleteId && handleDeleteRule(confirmDeleteId)}
            >
              Delete Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
