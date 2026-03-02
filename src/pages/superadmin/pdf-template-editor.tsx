import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { apiPDFTemplates } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { PDFTemplate } from '@/types';
import {
  ArrowLeft, Save, Plus, Trash2, GripVertical, ArrowUp, ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SuperAdminPDFTemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [newSection, setNewSection] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: template,
    loading,
    error,
    refetch,
  } = useAsync(() => apiPDFTemplates.getById(id!), [id]);

  // Populate form when template loads
  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description);
      setIsDefault(template.isDefault);
      setSections([...template.sections]);
    }
  }, [template]);

  const handleAddSection = () => {
    const val = newSection.trim().toLowerCase().replace(/\s+/g, '_');
    if (!val) {
      toast.error('Section name is required.');
      return;
    }
    if (sections.includes(val)) {
      toast.error('This section already exists.');
      return;
    }
    setSections(prev => [...prev, val]);
    setNewSection('');
  };

  const handleRemoveSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    setSections(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Template name is required.');
      return;
    }
    if (sections.length === 0) {
      toast.error('At least one section is required.');
      return;
    }
    setSaving(true);
    try {
      await apiPDFTemplates.update(id!, {
        name: name.trim(),
        description: description.trim(),
        isDefault,
        sections,
      });
      toast.success('Template saved successfully.');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !template) return <PageSkeleton />;
  if (error) return <ErrorCard message={error} onRetry={refetch} />;
  if (!template) return <ErrorCard message="Template not found." />;

  return (
    <div className="p-6">
      <PageHeader
        title={`Edit Template: ${template.name}`}
        subtitle="Modify the template name, description, and section layout."
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'PDF Templates', href: '/sa/pdf-templates' },
          { label: template.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/sa/pdf-templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Template Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Template name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of the template..."
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={e => setIsDefault(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
              <span className="text-sm font-medium">Default Template</span>
            </div>
          </CardContent>
        </Card>

        {/* Sections Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sections ({sections.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add section input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="New section name..."
                value={newSection}
                onChange={e => setNewSection(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddSection(); }}
              />
              <Button size="sm" onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {/* Sections list */}
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sections defined. Add sections above.
              </p>
            ) : (
              <div className="space-y-1">
                {sections.map((section, idx) => (
                  <div
                    key={`${section}-${idx}`}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 group hover:bg-muted/50"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium">
                      {section.replace(/_/g, ' ')}
                    </span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {section}
                    </Badge>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveSection(idx, 'up')}
                        disabled={idx === 0}
                        title="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => handleMoveSection(idx, 'down')}
                        disabled={idx === sections.length - 1}
                        title="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveSection(idx)}
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
