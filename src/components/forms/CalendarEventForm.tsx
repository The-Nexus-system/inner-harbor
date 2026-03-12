import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalendarEvent, Alter } from '@/types/system';

interface CalendarEventFormProps {
  alters: Alter[];
  onSubmit: (data: Partial<CalendarEvent>) => Promise<void>;
  editEvent?: CalendarEvent;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CalendarEventForm({ alters, onSubmit, editEvent, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CalendarEventFormProps) {
  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date>();
  const [form, setForm] = useState({
    title: '', time: '', preferredFronter: '',
    supportNeeded: '', sensoryPrep: '', recoveryTime: '',
    transportNotes: '', notes: '',
  });

  const reset = () => {
    if (editEvent) {
      setDate(parseISO(editEvent.date));
      setForm({
        title: editEvent.title, time: editEvent.time || '',
        preferredFronter: editEvent.preferredFronter || '',
        supportNeeded: editEvent.supportNeeded || '',
        sensoryPrep: editEvent.sensoryPrep || '',
        recoveryTime: editEvent.recoveryTime || '',
        transportNotes: editEvent.transportNotes || '',
        notes: editEvent.notes || '',
      });
    } else {
      setDate(undefined);
      setForm({ title: '', time: '', preferredFronter: '', supportNeeded: '', sensoryPrep: '', recoveryTime: '', transportNotes: '', notes: '' });
    }
  };

  useEffect(() => {
    if (open) reset();
  }, [open, editEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !date) return;
    setSaving(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        date: format(date, 'yyyy-MM-dd'),
        time: form.time || undefined,
        preferredFronter: form.preferredFronter || undefined,
        supportNeeded: form.supportNeeded || undefined,
        sensoryPrep: form.sensoryPrep || undefined,
        recoveryTime: form.recoveryTime || undefined,
        transportNotes: form.transportNotes || undefined,
        notes: form.notes || undefined,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const isEdit = !!editEvent;

  const content = (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-heading">{isEdit ? 'Edit event' : 'New event'}</DialogTitle>
        <p className="text-sm text-muted-foreground">{isEdit ? 'Update this event.' : 'Plan ahead — set who should front, what support is needed, and recovery time.'}</p>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="ce-title">Event name *</Label>
          <Input id="ce-title" value={form.title} onChange={e => set('title', e.target.value)} required maxLength={200} autoFocus placeholder="e.g. Therapy session" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce-time">Time</Label>
            <Input id="ce-time" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-fronter">Preferred fronter</Label>
          <Select value={form.preferredFronter || '__none__'} onValueChange={v => set('preferredFronter', v === '__none__' ? '' : v)}>
            <SelectTrigger id="ce-fronter"><SelectValue placeholder="Anyone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Anyone</SelectItem>
              {alters.map(a => <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-support">Support needed</Label>
          <Textarea id="ce-support" value={form.supportNeeded} onChange={e => set('supportNeeded', e.target.value)} rows={2} maxLength={500} placeholder="e.g. Need someone to drive, need noise-cancelling headphones" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ce-sensory">Sensory prep</Label>
            <Input id="ce-sensory" value={form.sensoryPrep} onChange={e => set('sensoryPrep', e.target.value)} maxLength={200} placeholder="e.g. Sunglasses, earplugs" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ce-recovery">Recovery time</Label>
            <Input id="ce-recovery" value={form.recoveryTime} onChange={e => set('recoveryTime', e.target.value)} maxLength={100} placeholder="e.g. 2 hours rest after" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-transport">Transport notes</Label>
          <Input id="ce-transport" value={form.transportNotes} onChange={e => set('transportNotes', e.target.value)} maxLength={200} placeholder="e.g. Bus route 42, or carer drives" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ce-notes">Notes</Label>
          <Textarea id="ce-notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} maxLength={1000} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.title.trim() || !date}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add event'}
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
        <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add event</Button>
      </DialogTrigger>
      {content}
    </Dialog>
  );
}
