import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Settings, RefreshCw, Pencil, Save, X, MessageSquarePlus, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';

import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import { useAuthStore } from '@/store/auth';
import type { CAP, ContextCategory, ContextValue, ContextSelection } from '@/types';

export default function CAPContextView() {
  const { capId } = useParams<{ capId: string }>();
  const user = useAuthStore((s) => s.user);

  const { data: cap, loading: capLoading, error: capError, refetch: refetchCap } = useAsync<CAP>(
    () => api.cap.getById(capId!),
    [capId],
  );

  const { data: categories, loading: catsLoading } = useAsync<ContextCategory[]>(
    () => api.contextMaster.listCategories(),
    [],
  );

  const { data: allValues, loading: valsLoading } = useAsync<ContextValue[]>(
    () => api.contextMaster.listValues(),
    [],
  );

  // Load company settings to check memberCanEditCapContext
  const { data: company } = useAsync(
    () => (cap?.companyId ? api.companies.getById(cap.companyId) : Promise.resolve(null)),
    [cap?.companyId],
    !!cap?.companyId,
  );

  const [editing, setEditing] = useState(false);
  const [editedSelections, setEditedSelections] = useState<ContextSelection[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRequestText, setChangeRequestText] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const isLoading = capLoading || catsLoading || valsLoading;
  const hasError = capError;

  const canEdit =
    user?.role === 'SPONSOR' ||
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'CONSULTANT' ||
    user?.role === 'SUB_ADMIN' ||
    (user?.role === 'MEMBER' && company?.settings?.memberCanEditCapContext);

  const startEditing = () => {
    setEditedSelections(cap?.contextSelections ? [...cap.contextSelections] : []);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditedSelections([]);
  };

  const handleSelectionChange = (categoryId: string, valueId: string) => {
    const category = categories?.find((c) => c.id === categoryId);
    const value = allValues?.find((v) => v.id === valueId);
    if (!category || !value) return;

    setEditedSelections((prev) => {
      const existing = prev.findIndex((s) => s.categoryId === categoryId);
      const newSel: ContextSelection = {
        categoryId,
        categoryNameSnapshot: category.name,
        valueId,
        valueLabelSnapshot: value.valueLabel,
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newSel;
        return updated;
      }
      return [...prev, newSel];
    });
  };

  const saveSelections = async () => {
    if (editedSelections.length !== 8) {
      toast.error('Exactly 8 context selections are required.');
      return;
    }
    try {
      await api.cap.setContextSelections(capId!, editedSelections);
      toast.success('Context selections saved successfully.');
      setEditing(false);
      refetchCap();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save selections.');
    }
  };

  const handleRegenerateOutputs = async () => {
    setRegenerating(true);
    try {
      await api.cap.generateOutputs(capId!);
      toast.success('Outputs regenerated successfully.');
      refetchCap();
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate outputs.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!changeRequestText.trim()) {
      toast.error('Please describe the changes you want to request.');
      return;
    }
    setSubmittingRequest(true);
    try {
      await api.contextRequests.create({
        capId: capId!,
        requestedByUserId: user!.id,
        details: changeRequestText.trim(),
      });
      toast.success('Change request submitted. A sponsor or admin will review it.');
      setChangeRequestOpen(false);
      setChangeRequestText('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit change request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  if (isLoading) return <PageSkeleton />;

  if (hasError || !cap) {
    return (
      <div className="p-6">
        <PageHeader
          title="Context Selections"
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'CAP', href: `/app/caps/${capId}` },
            { label: 'Context' },
          ]}
        />
        <ErrorCard message={hasError || 'CAP not found.'} onRetry={refetchCap} />
      </div>
    );
  }

  const selections = editing ? editedSelections : cap.contextSelections;

  // Build table data: one row per category, showing selected value
  const tableData = (categories || [])
    .filter((c) => c.isActive)
    .map((cat) => {
      const sel = selections.find((s) => s.categoryId === cat.id);
      const catValues = (allValues || []).filter(
        (v) => v.categoryId === cat.id && v.isActive,
      );
      return {
        id: cat.id,
        categoryName: cat.name,
        categoryDescription: cat.description,
        selectedValueId: sel?.valueId || '',
        selectedValueLabel: sel?.valueLabelSnapshot || '--',
        availableValues: catValues,
      };
    });

  const columns = [
    {
      key: 'categoryName',
      header: 'Category',
      render: (item: (typeof tableData)[0]) => (
        <div>
          <p className="font-medium">{item.categoryName}</p>
          <p className="text-xs text-muted-foreground">{item.categoryDescription}</p>
        </div>
      ),
    },
    {
      key: 'selectedValueLabel',
      header: 'Selected Value',
      render: (item: (typeof tableData)[0]) =>
        editing ? (
          <Select
            options={item.availableValues.map((v) => ({
              value: v.id,
              label: v.valueLabel,
            }))}
            placeholder="Select a value..."
            value={item.selectedValueId}
            onValueChange={(val) => handleSelectionChange(item.id, val)}
          />
        ) : (
          <span
            className={
              item.selectedValueLabel === '--'
                ? 'text-muted-foreground italic'
                : 'font-medium'
            }
          >
            {item.selectedValueLabel}
          </span>
        ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Context Selections"
        subtitle={`Context configuration for "${cap.title}"`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'CAPs', href: '/app/caps' },
          { label: cap.title, href: `/app/caps/${cap.id}` },
          { label: 'Context' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={cancelEditing}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={saveSelections}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Selections
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit Contexts
                  </Button>
                )}
                {!canEdit && user?.role === 'MEMBER' && (
                  <Dialog open={changeRequestOpen} onOpenChange={setChangeRequestOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MessageSquarePlus className="h-4 w-4 mr-1" />
                        Request Change
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Context Change</DialogTitle>
                        <DialogDescription>
                          Describe the changes you would like made to the context
                          selections. A sponsor or admin will review your request.
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Describe the context changes you need..."
                        value={changeRequestText}
                        onChange={(e) => setChangeRequestText(e.target.value)}
                        rows={4}
                      />
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setChangeRequestOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitChangeRequest}
                          disabled={submittingRequest}
                        >
                          {submittingRequest ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Request'
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                {cap.contextSelections.length === 8 && canEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleRegenerateOutputs}
                    disabled={regenerating}
                  >
                    {regenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate Outputs
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-muted-foreground" />
            Context Categories
          </CardTitle>
          <CardDescription>
            {editing
              ? 'Select a value for each of the 8 context categories below.'
              : `${cap.contextSelections.length} of 8 categories have values assigned.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={tableData}
            columns={columns}
            keyField="id"
            emptyMessage="No context categories available."
          />
        </CardContent>
      </Card>
    </div>
  );
}
