import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { JournalEntry, Alter } from '@/types/system';

interface JournalFormProps {
  alters: Alter[];
  onSubmit: (data: Partial<JournalEntry>) => Promise<void>;
}

const typeOptions = [
  { value: 'text', label: 'General entry' },
  { value: 'mood', label: 'Mood log' },
  { value: 'sensory', label: 'Sensory note' },
  { value: 'victory', label: 'Victory / win' },
  { value: 'flashback', label: 'Flashback record' },
  { value: 'medical', label: 'Medical note' },
  { value: 'seizure', label: 'Seizure log' },
  { value: 'memory-reconstruction', label: 'Memory reconstruction' },
];

export function JournalForm({ alters, onSubmit }: JournalFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', content: '', type: 'text' as JournalEntry['type'],
    alterId: '', mood: '', tags: '', visibility: 'shared' as JournalEntry['visibility'],
  });

  const reset = () => setForm({ title: '', content: '', type: 'text', alterId: '', mood: '', tags: '', visibility: 'shared' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title || undefined,
        content: form.content,
        type: form.type,
        alterId: form.alterId || undefined,
        mood: form.mood ? (Number(form.mood) as JournalEntry['mood']) : undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        visibility: form.visibility,
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
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> New entry</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">New journal entry</DialogTitle>
          <p className="text-sm text-muted-foreground">Write freely. This space belongs to whoever is fronting.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="journal-type">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as JournalEntry['type'] }))}>
                <SelectTrigger id="journal-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-author">Who's writing?</Label>
              <Select value={form.alterId} onValueChange={v => setForm(p => ({ ...p, alterId: v }))}>
                <SelectTrigger id="journal-author"><SelectValue placeholder="Unknown / not sure" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unknown / not sure</SelectItem>
                  {alters.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="journal-title">Title (optional)</Label>
            <Input id="journal-title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="journal-content">Content *</Label>
            <Textarea id="journal-content" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={6} required maxLength={10000} autoFocus placeholder="What's on your mind?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="journal-mood">Mood (1-5)</Label>
              <Select value={form.mood} onValueChange={v => setForm(p => ({ ...p, mood: v }))}>
                <SelectTrigger id="journal-mood"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Skip</SelectItem>
                  <SelectItem value="1">1 — Very low</SelectItem>
                  <SelectItem value="2">2 — Low</SelectItem>
                  <SelectItem value="3">3 — Neutral</SelectItem>
                  <SelectItem value="4">4 — Good</SelectItem>
                  <SelectItem value="5">5 — Great</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="journal-vis">Visibility</Label>
              <Select value={form.visibility} onValueChange={v => setForm(p => ({ ...p, visibility: v as JournalEntry['visibility'] }))}>
                <SelectTrigger id="journal-vis"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">Shared</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="emergency-only">Emergency only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="journal-tags">Tags (comma-separated)</Label>
            <Input id="journal-tags" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. therapy, progress, sensory" maxLength={300} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.content.trim()}>
              {saving ? 'Saving…' : 'Save entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
