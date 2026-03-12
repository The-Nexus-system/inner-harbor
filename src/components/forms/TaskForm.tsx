import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { SystemTask, Alter } from '@/types/system';

interface TaskFormProps {
  alters: Alter[];
  onSubmit: (data: Partial<SystemTask>) => Promise<void>;
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

export function TaskForm({ alters, onSubmit }: TaskFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'general' as SystemTask['category'],
    assignedTo: 'system', dueDate: '',
  });

  const reset = () => setForm({ title: '', description: '', category: 'general', assignedTo: 'system', dueDate: '' });

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
      });
      reset();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (v) reset(); setOpen(v); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add task</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">New task</DialogTitle>
          <p className="text-sm text-muted-foreground">Add a task for yourself or someone in the system.</p>
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

          <div className="space-y-1.5">
            <Label htmlFor="task-due">Due date (optional)</Label>
            <Input id="task-due" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.title.trim()}>
              {saving ? 'Saving…' : 'Add task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
