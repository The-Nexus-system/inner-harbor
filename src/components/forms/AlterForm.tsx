import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil } from 'lucide-react';
import type { Alter, InterfaceMode } from '@/types/system';

interface AlterFormProps {
  alter?: Alter;
  onSubmit: (data: Partial<Alter>) => Promise<void>;
  trigger?: React.ReactNode;
}

const defaultValues: Partial<Alter> = {
  name: '', pronouns: 'they/them', visibility: 'shared',
  nickname: '', role: '', ageRange: '', species: '',
  communicationStyle: '', accessNeeds: '', triggersToAvoid: '',
  groundingPreferences: '', safeFoods: '', musicPreferences: '',
  color: '#7c3aed', emoji: '🌟', notes: '',
};

export function AlterForm({ alter, onSubmit, trigger }: AlterFormProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Alter>>(alter ?? defaultValues);
  const [saving, setSaving] = useState(false);

  const isEdit = !!alter;

  const handleOpen = (val: boolean) => {
    if (val && !isEdit) setForm(defaultValues);
    if (val && isEdit) setForm(alter);
    setOpen(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof Alter, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="gap-2">
            {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isEdit ? 'Edit' : 'Add profile'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEdit ? 'Edit profile' : 'New profile'}</DialogTitle>
          <p className="text-sm text-muted-foreground">Fill in what feels right. Everything except the name is optional.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="alter-name">Name *</Label>
              <Input id="alter-name" value={form.name || ''} onChange={e => set('name', e.target.value)} required maxLength={100} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alter-pronouns">Pronouns</Label>
              <Input id="alter-pronouns" value={form.pronouns || ''} onChange={e => set('pronouns', e.target.value)} placeholder="they/them" maxLength={50} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="alter-emoji">Emoji</Label>
              <Input id="alter-emoji" value={form.emoji || ''} onChange={e => set('emoji', e.target.value)} maxLength={4} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alter-color">Colour</Label>
              <Input id="alter-color" type="color" value={form.color || '#7c3aed'} onChange={e => set('color', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alter-nickname">Nickname</Label>
              <Input id="alter-nickname" value={form.nickname || ''} onChange={e => set('nickname', e.target.value)} maxLength={100} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="alter-role">Role</Label>
              <Input id="alter-role" value={form.role || ''} onChange={e => set('role', e.target.value)} placeholder="e.g. protector, little" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alter-age">Age range</Label>
              <Input id="alter-age" value={form.ageRange || ''} onChange={e => set('ageRange', e.target.value)} placeholder="e.g. child, teen, adult" maxLength={50} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-species">Presentation / species</Label>
            <Input id="alter-species" value={form.species || ''} onChange={e => set('species', e.target.value)} placeholder="Optional" maxLength={100} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-comm">Communication style</Label>
            <Textarea id="alter-comm" value={form.communicationStyle || ''} onChange={e => set('communicationStyle', e.target.value)} placeholder="How do you prefer to communicate?" rows={2} maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-access">Access needs</Label>
            <Textarea id="alter-access" value={form.accessNeeds || ''} onChange={e => set('accessNeeds', e.target.value)} placeholder="Any accommodations or support needs" rows={2} maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-triggers" className="text-destructive">Triggers to avoid</Label>
            <Textarea id="alter-triggers" value={form.triggersToAvoid || ''} onChange={e => set('triggersToAvoid', e.target.value)} placeholder="Things others should avoid around you" rows={2} maxLength={500} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-grounding">Grounding preferences</Label>
            <Textarea id="alter-grounding" value={form.groundingPreferences || ''} onChange={e => set('groundingPreferences', e.target.value)} placeholder="What helps you feel grounded?" rows={2} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="alter-foods">Safe foods</Label>
              <Input id="alter-foods" value={form.safeFoods || ''} onChange={e => set('safeFoods', e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alter-music">Music preferences</Label>
              <Input id="alter-music" value={form.musicPreferences || ''} onChange={e => set('musicPreferences', e.target.value)} maxLength={200} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-visibility">Visibility</Label>
            <Select value={form.visibility || 'shared'} onValueChange={v => setForm(prev => ({ ...prev, visibility: v as Alter['visibility'] }))}>
              <SelectTrigger id="alter-visibility"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">Shared — visible to the whole system</SelectItem>
                <SelectItem value="private">Private — only you</SelectItem>
                <SelectItem value="emergency-only">Emergency only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="alter-notes">Notes</Label>
            <Textarea id="alter-notes" value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Anything else" rows={2} maxLength={1000} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.name?.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create profile'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
