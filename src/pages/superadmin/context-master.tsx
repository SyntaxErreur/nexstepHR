import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Layers, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { EmptyState } from '@/components/shared/empty-state';

import { api } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { ContextCategory } from '@/types';

export default function ContextMasterPage() {
  const navigate = useNavigate();

  const { data: categories, loading, error, refetch } = useAsync(
    () => api.contextMaster.listCategories(),
    [],
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<ContextCategory | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openAddDialog = () => {
    setEditCategory(null);
    setFormName('');
    setFormDescription('');
    setDialogOpen(true);
  };

  const openEditDialog = (cat: ContextCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editCategory) {
        await api.contextMaster.updateCategory(editCategory.id, {
          name: formName.trim(),
          description: formDescription.trim(),
        });
        toast.success('Category updated successfully.');
      } else {
        await api.contextMaster.createCategory({
          name: formName.trim(),
          description: formDescription.trim(),
        });
        toast.success('Category created successfully.');
      }
      setDialogOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: ContextCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setTogglingId(cat.id);
    try {
      await api.contextMaster.updateCategory(cat.id, { isActive: !cat.isActive });
      toast.success(`Category ${cat.isActive ? 'deactivated' : 'activated'}.`);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category.');
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) return <PageSkeleton />;

  if (error) {
    return (
      <div className="p-6">
        <PageHeader title="Context Master" subtitle="Manage context categories and their values" />
        <ErrorCard message={error} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Context Master"
        subtitle="Manage context categories and their values for capability assessments"
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Context Master' },
        ]}
        actions={
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        }
      />

      {!categories || categories.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-8 w-8 text-muted-foreground" />}
          title="No categories yet"
          description="Create your first context category to start configuring assessment contexts."
          action={{ label: 'Add Category', onClick: openAddDialog }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/sa/context-master/${cat.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{cat.name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {cat.description || 'No description'}
                    </CardDescription>
                  </div>
                  <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                    <span>Sort Order: {cat.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleActive(cat, e)}
                      disabled={togglingId === cat.id}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => openEditDialog(cat, e)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editCategory
                ? 'Update the category name and description.'
                : 'Create a new context category for assessments.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input
                placeholder="e.g. Industry Sector"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Input
                placeholder="A brief description of this category"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
