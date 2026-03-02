import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ArrowLeft, Tags } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { ContextValue } from '@/types';

export default function ContextValuesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();

  // Load category details
  const {
    data: categories,
    loading: catLoading,
    error: catError,
  } = useAsync(() => api.contextMaster.listCategories(), []);

  // Load values for this category
  const {
    data: values,
    loading: valLoading,
    error: valError,
    refetch,
  } = useAsync(
    () => api.contextMaster.listValues(categoryId),
    [categoryId],
  );

  const category = categories?.find((c) => c.id === categoryId);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editValue, setEditValue] = useState<ContextValue | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formSortOrder, setFormSortOrder] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditValue(null);
    setFormLabel('');
    setFormSortOrder('');
    setDialogOpen(true);
  };

  const openEditDialog = (val: ContextValue) => {
    setEditValue(val);
    setFormLabel(val.valueLabel);
    setFormSortOrder(String(val.sortOrder));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim()) {
      toast.error('Value label is required.');
      return;
    }
    setSaving(true);
    try {
      if (editValue) {
        await api.contextMaster.updateValue(editValue.id, {
          valueLabel: formLabel.trim(),
          ...(formSortOrder ? { sortOrder: Number(formSortOrder) } : {}),
        });
        toast.success('Value updated successfully.');
      } else {
        await api.contextMaster.createValue({
          categoryId: categoryId!,
          valueLabel: formLabel.trim(),
        });
        toast.success('Value created successfully.');
      }
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save value.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (val: ContextValue) => {
    setTogglingId(val.id);
    try {
      await api.contextMaster.updateValue(val.id, { isActive: !val.isActive });
      toast.success(`Value ${val.isActive ? 'deactivated' : 'activated'}.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update value.');
    } finally {
      setTogglingId(null);
    }
  };

  const loading = catLoading || valLoading;
  const error = catError || valError;

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Context Values" />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  const columns = [
    {
      key: 'valueLabel',
      header: 'Value Label',
      sortable: true,
      render: (item: ContextValue) => (
        <span className="font-medium">{item.valueLabel}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: ContextValue) => (
        <Badge variant={item.isActive ? 'default' : 'secondary'}>
          {item.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'sortOrder',
      header: 'Sort Order',
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item: ContextValue) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(item);
            }}
            disabled={togglingId === item.id}
          >
            {item.isActive ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(item);
            }}
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={category ? `${category.name} - Values` : 'Context Values'}
        subtitle={category?.description || 'Manage values for this context category'}
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Context Master', href: '/sa/context-master' },
          { label: category?.name || 'Values' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/sa/context-master">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Value
            </Button>
          </div>
        }
      />

      {!values || values.length === 0 ? (
        <EmptyState
          icon={<Tags className="h-8 w-8 text-muted-foreground" />}
          title="No values yet"
          description="Add values to this context category for use in capability assessments."
          action={{ label: 'Add Value', onClick: openAddDialog }}
        />
      ) : (
        <DataTable
          data={values}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['valueLabel']}
          emptyMessage="No values match your search."
        />
      )}

      {/* Add / Edit Value Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editValue ? 'Edit Value' : 'Add Value'}</DialogTitle>
            <DialogDescription>
              {editValue
                ? 'Update the value label and sort order.'
                : `Add a new value to the "${category?.name || ''}" category.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Value Label</label>
              <Input
                placeholder="e.g. Technology"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            {editValue && (
              <div>
                <label className="text-sm font-medium mb-1 block">Sort Order</label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                  min={1}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editValue ? 'Save Changes' : 'Add Value'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
