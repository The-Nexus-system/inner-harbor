import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { SystemTask, Alter, RecurrencePattern } from '@/types/system';

interface TaskFormProps {
  alters: Alter[];
  onSubmit: (data: Partial<SystemTask>) => Promise<void>;
  editTask?: SystemTask;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories: { value: SystemTask['category']; label: string; emoji: string }[] = [
  { value: 'general', label: 'General', emoji: '📋' },
  { value: 'medication', label: 'Medication', emoji: '💊' },
  { value: 'hygiene', label: 'Hygiene', emoji: '🪥' },
  { value: 'meals', label: 'Meals', emoji: '🍽️' },
  { value: 'hydration', label: 'Hydration', emoji: '💧' },
  { value: 'therapy', label: 'Therapy', emoji: '🧠' },
  { value: 'mobility', label: 'Mobility', emoji: '🚶' },
  { value: 'community', label: 'Community', emoji: '🤝' },
];

const recurrenceOptions: { value: string; label: string }[] = [
  { value: '__none__', label: 'Does not repeat' },
  { value: 'daily', label: '🔄 Daily' },
  { value: 'weekly', label: '🔄 Weekly' },
  { value: 'monthly', label: '🔄 Monthly' },
];

export function TaskForm({ alters, onSubmit, editTask, open: controlledOpen, onOpenChange: controlledOnOpenChange }: TaskFormProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'general' as SystemTask['category'],
    assignedTo: 'system', dueDate: '', recurrencePattern: '' as string,
    reminderMinutes: '' as string,
  });

  const reset = () => setForm({
    title: editTask?.title || '',
    description: editTask?.description || '',
    category: editTask?.category || 'general',
    assignedTo: editTask?.assignedTo || 'system',
    dueDate: editTask?.dueDate || '',
    recurrencePattern: editTask?.recurrencePattern || '',
    reminderMinutes: editTask?.reminderMinutes?.toString() || '',
  });

  useEffect(() => {
    if (open) reset();
  }, [open, editTask]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title,
        description: form.description || undefined,
        category: form.category,
        assignedTo: form.assignedTo,
        dueDate: form.dueDate || undefined,
        recurrencePattern: (form.recurrencePattern || undefined) as RecurrencePattern | undefined,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editTask;

  const content = (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle className="font-heading">{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        <p className="text-sm text-muted-foreground">{isEdit ? 'Update this task.' : 'Add a task for yourself or someone in the system.'}</p>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="task-title">What needs doing? *</Label>
          <Input id="task-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required maxLength={200} autoFocus placeholder="e.g. Take evening meds" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-desc">Details (optional)</Label>
          <Textarea id="task-desc" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} maxLength={500} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-cat">Category</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as SystemTask['category'] }))}>
              <SelectTrigger id="task-cat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-assign">Assigned to</Label>
            <Select value={form.assignedTo} onValueChange={v => setForm(p => ({ ...p, assignedTo: v }))}>
              <SelectTrigger id="task-assign"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="system">Everyone</SelectItem>
                <SelectItem value="next-fronter">Whoever fronts next</SelectItem>
                {alters.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input id="task-due" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-repeat">Repeat</Label>
            <Select value={form.recurrencePattern || '__none__'} onValueChange={v => setForm(p => ({ ...p, recurrencePattern: v === '__none__' ? '' : v }))}>
              <SelectTrigger id="task-repeat"><SelectValue /></SelectTrigger>
              <SelectContent>
                {recurrenceOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (isControlled) {
    return <Dialog open={open} onOpenChange={setOpen}>{content}</Dialog>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add task</Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}
