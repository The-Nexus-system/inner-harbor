import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { InternalMessage, Alter } from '@/types/system';

interface MessageFormProps {
  alters: Alter[];
  onSubmit: (data: Partial<InternalMessage>) => Promise<void>;
}

export function MessageForm({ alters, onSubmit }: MessageFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    content: '', fromAlterId: '', toAlterId: '',
    priority: 'normal' as InternalMessage['priority'],
  });

  const reset = () => setForm({ content: '', fromAlterId: '', toAlterId: '', priority: 'normal' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        content: form.content,
        fromAlterId: form.fromAlterId || undefined,
        toAlterIds: form.toAlterId ? [form.toAlterId] : [],
        priority: form.priority,
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
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> New message</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Leave a message</DialogTitle>
          <p className="text-sm text-muted-foreground">Write a note, reminder, or kind word for someone (or everyone).</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="msg-from">From</Label>
              <Select value={form.fromAlterId} onValueChange={v => setForm(p => ({ ...p, fromAlterId: v }))}>
                <SelectTrigger id="msg-from"><SelectValue placeholder="Anonymous" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anonymous</SelectItem>
                  {alters.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg-to">To</Label>
              <Select value={form.toAlterId} onValueChange={v => setForm(p => ({ ...p, toAlterId: v }))}>
                <SelectTrigger id="msg-to"><SelectValue placeholder="Everyone" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Everyone</SelectItem>
                  {alters.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-content">Message *</Label>
            <Textarea id="msg-content" value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} required maxLength={2000} autoFocus placeholder="What would you like to say?" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-priority">Priority</Label>
            <Select value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as InternalMessage['priority'] }))}>
              <SelectTrigger id="msg-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.content.trim()}>
              {saving ? 'Saving…' : 'Send message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
