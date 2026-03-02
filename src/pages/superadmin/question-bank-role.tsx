import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/shared/page-header';
import { PageSkeleton } from '@/components/shared/skeleton';
import { ErrorCard } from '@/components/shared/error-card';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { apiQuestionBank } from '@/api/mock';
import { useAsync } from '@/hooks/use-async';
import type { Question } from '@/types';
import { Plus, Save, ArrowLeft, Pencil, X, Check, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

const RESPONSE_TYPE_OPTIONS = [
  { value: 'likert', label: 'Likert (1-5)' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'text', label: 'Free Text' },
];

const DIMENSION_OPTIONS = [
  { value: 'founders_cxos', label: 'Founders/CXOs' },
  { value: 'sr_mgmt_bench', label: 'Sr Mgmt/Bench' },
  { value: 'org_design', label: 'Org Design' },
  { value: 'talent_strategy', label: 'Talent Strategy' },
  { value: 'culture', label: 'Culture' },
  { value: 'esops', label: 'ESOPs' },
  { value: 'hiring_engine', label: 'Hiring Engine' },
  { value: 'people_continuity', label: 'People Continuity' },
];

export default function SuperAdminQuestionBankRolePage() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const decodedRole = decodeURIComponent(role || '');

  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [newDimension, setNewDimension] = useState('founders_cxos');
  const [newResponseType, setNewResponseType] = useState('likert');
  const [newWeight, setNewWeight] = useState('1');
  const [newHelpText, setNewHelpText] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline editing state
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDimension, setEditDimension] = useState('');
  const [editResponseType, setEditResponseType] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [saving, setSaving] = useState(false);

  const {
    data: questionBank,
    loading,
    error,
    refetch,
  } = useAsync(() => apiQuestionBank.get(), []);

  const questions = useMemo(
    () => (questionBank?.questionsByRole[decodedRole] || []),
    [questionBank, decodedRole]
  );

  const handleAdd = async () => {
    if (!newText.trim()) {
      toast.error('Question text is required.');
      return;
    }
    setAdding(true);
    try {
      await apiQuestionBank.addQuestion(decodedRole, {
        text: newText.trim(),
        dimensionKey: newDimension,
        responseType: newResponseType as Question['responseType'],
        weight: parseFloat(newWeight) || 1,
        helpText: newHelpText.trim() || undefined,
      });
      toast.success('Question added successfully.');
      setAddOpen(false);
      setNewText('');
      setNewDimension('founders_cxos');
      setNewResponseType('likert');
      setNewWeight('1');
      setNewHelpText('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add question.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (q: Question) => {
    setEditId(q.id);
    setEditText(q.text);
    setEditDimension(q.dimensionKey);
    setEditResponseType(q.responseType);
    setEditWeight(String(q.weight));
  };

  const cancelEdit = () => {
    setEditId(null);
  };

  const saveEdit = async () => {
    if (!editId || !editText.trim()) return;
    setSaving(true);
    try {
      const updatedQuestions = questions.map(q =>
        q.id === editId
          ? {
              ...q,
              text: editText.trim(),
              dimensionKey: editDimension,
              responseType: editResponseType as Question['responseType'],
              weight: parseFloat(editWeight) || 1,
            }
          : q
      );
      await apiQuestionBank.updateRole(decodedRole, updatedQuestions);
      toast.success('Question updated.');
      setEditId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !questionBank) return <PageSkeleton />;
  if (error) return <ErrorCard message={error} onRetry={refetch} />;

  const columns = [
    {
      key: 'text',
      header: 'Question Text',
      className: 'max-w-md',
      render: (q: Question) =>
        editId === q.id ? (
          <Textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
        ) : (
          <span className="text-sm">{q.text}</span>
        ),
    },
    {
      key: 'dimensionKey',
      header: 'Dimension',
      render: (q: Question) =>
        editId === q.id ? (
          <Select
            options={DIMENSION_OPTIONS}
            value={editDimension}
            onValueChange={setEditDimension}
            className="w-40"
          />
        ) : (
          <Badge variant="secondary" className="text-xs">
            {q.dimensionKey.replace(/_/g, ' ')}
          </Badge>
        ),
    },
    {
      key: 'responseType',
      header: 'Type',
      render: (q: Question) =>
        editId === q.id ? (
          <Select
            options={RESPONSE_TYPE_OPTIONS}
            value={editResponseType}
            onValueChange={setEditResponseType}
            className="w-32"
          />
        ) : (
          <span className="text-sm capitalize">{q.responseType}</span>
        ),
    },
    {
      key: 'weight',
      header: 'Weight',
      className: 'w-20',
      render: (q: Question) =>
        editId === q.id ? (
          <Input
            type="number"
            step="0.1"
            min="0"
            value={editWeight}
            onChange={e => setEditWeight(e.target.value)}
            className="w-20"
          />
        ) : (
          <span className="text-sm">{q.weight}</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (q: Question) =>
        editId === q.id ? (
          <div className="flex items-center gap-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              onClick={saveEdit}
              disabled={saving}
              title="Save"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={cancelEdit}
              title="Cancel"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => startEdit(q)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={`Questions: ${decodedRole}`}
        subtitle={`${questions.length} question${questions.length !== 1 ? 's' : ''} for the ${decodedRole} role.`}
        breadcrumbs={[
          { label: 'Super Admin', href: '/sa' },
          { label: 'Question Bank', href: '/sa/question-bank' },
          { label: decodedRole },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/sa/question-bank')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Question</DialogTitle>
                  <DialogDescription>
                    Add a new question for the {decodedRole} role.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Question Text *</label>
                    <Textarea
                      placeholder="Enter the question text..."
                      value={newText}
                      onChange={e => setNewText(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dimension *</label>
                      <Select
                        options={DIMENSION_OPTIONS}
                        value={newDimension}
                        onValueChange={setNewDimension}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Response Type *</label>
                      <Select
                        options={RESPONSE_TYPE_OPTIONS}
                        value={newResponseType}
                        onValueChange={setNewResponseType}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={newWeight}
                      onChange={e => setNewWeight(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Help Text (optional)</label>
                    <Input
                      placeholder="Guidance for respondents..."
                      value={newHelpText}
                      onChange={e => setNewHelpText(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAdd} loading={adding}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {questions.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8 text-muted-foreground" />}
          title="No Questions"
          description={`No questions have been defined for the ${decodedRole} role yet.`}
          action={{ label: 'Add Question', onClick: () => setAddOpen(true) }}
        />
      ) : (
        <DataTable
          data={questions}
          columns={columns}
          keyField="id"
          searchable
          searchFields={['text', 'dimensionKey']}
          emptyMessage="No questions match your search."
        />
      )}
    </div>
  );
}
