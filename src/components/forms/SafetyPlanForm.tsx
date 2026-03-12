import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, GripVertical } from 'lucide-react';
import type { SafetyPlan } from '@/types/system';

interface SafetyPlanFormProps {
  onSubmit: (data: Partial<SafetyPlan>) => Promise<void>;
}

const planTypes: { value: SafetyPlan['type']; label: string }[] = [
  { value: 'grounding', label: '🌿 Grounding' },
  { value: 'crisis', label: '🚨 Crisis' },
  { value: 'flashback', label: '⚡ Flashback' },
  { value: 'shutdown', label: '🔇 Shutdown' },
  { value: 'meltdown', label: '🌊 Meltdown' },
  { value: 'seizure', label: '⚠️ Seizure' },
  { value: 'medical', label: '🏥 Medical' },
  { value: 'hospital-card', label: '🪪 Hospital card' },
];

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

export function SafetyPlanForm({ onSubmit }: SafetyPlanFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<SafetyPlan['type']>('grounding');
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState('');

  const reset = () => {
    setType('grounding');
    setTitle('');
    setSteps(['']);
    setContacts([]);
    setNotes('');
  };

  const addStep = () => setSteps(prev => [...prev, '']);
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));
  const updateStep = (i: number, val: string) => setSteps(prev => prev.map((s, idx) => idx === i ? val : s));

  const addContact = () => setContacts(prev => [...prev, { name: '', phone: '', relationship: '' }]);
  const removeContact = (i: number) => setContacts(prev => prev.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof Contact, val: string) =>
    setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        type,
        title: title.trim(),
        steps: steps.filter(s => s.trim()),
        trustedContacts: contacts.filter(c => c.name.trim()),
        notes: notes.trim() || undefined,
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
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add safety plan</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">New safety plan</DialogTitle>
          <p className="text-sm text-muted-foreground">Create a plan you can access quickly when you need it.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="sp-title">Plan name *</Label>
              <Input id="sp-title" value={title} onChange={e => setTitle(e.target.value)} required maxLength={200} autoFocus placeholder="e.g. My grounding plan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-type">Type</Label>
              <Select value={type} onValueChange={v => setType(v as SafetyPlan['type'])}>
                <SelectTrigger id="sp-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <Label>Steps</Label>
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="text-xs text-muted-foreground w-5 flex-shrink-0">{i + 1}.</span>
                <Input
                  value={step}
                  onChange={e => updateStep(i, e.target.value)}
                  placeholder={`Step ${i + 1}`}
                  maxLength={300}
                />
                {steps.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeStep(i)} aria-label={`Remove step ${i + 1}`}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1">
              <Plus className="h-3 w-3" /> Add step
            </Button>
          </div>

          {/* Trusted contacts */}
          <div className="space-y-2">
            <Label>Trusted contacts</Label>
            {contacts.map((c, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <Input placeholder="Name" value={c.name} onChange={e => updateContact(i, 'name', e.target.value)} maxLength={100} />
                <Input placeholder="Relationship" value={c.relationship} onChange={e => updateContact(i, 'relationship', e.target.value)} maxLength={100} />
                <Input placeholder="Phone" type="tel" value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)} maxLength={30} />
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeContact(i)} aria-label="Remove contact">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addContact} className="gap-1">
              <Plus className="h-3 w-3" /> Add contact
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sp-notes">Notes (optional)</Label>
            <Textarea id="sp-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Create plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
