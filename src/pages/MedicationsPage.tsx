import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { Pill, Plus, Check, X, Clock, CalendarDays, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Medication, MedicationFrequency, MedicationLogStatus } from "@/types/system";

const FREQUENCY_LABELS: Record<MedicationFrequency, string> = {
  'daily': 'Once daily',
  'twice-daily': 'Twice daily',
  'weekly': 'Weekly',
  'as-needed': 'As needed',
  'custom': 'Custom schedule',
};

const STATUS_STYLES: Record<MedicationLogStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  taken: { label: 'Taken', variant: 'default' },
  late: { label: 'Late', variant: 'secondary' },
  skipped: { label: 'Skipped', variant: 'outline' },
  missed: { label: 'Missed', variant: 'destructive' },
};

export default function MedicationsPage() {
  const { medications, medicationLogs, createMedication, updateMedication, deleteMedication, logMedication, isLoading } = useSystem();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState<MedicationFrequency>("daily");
  const [scheduleTimes, setScheduleTimes] = useState<string[]>([""]);
  const [prescriber, setPrescriber] = useState("");
  const [pharmacy, setPharmacy] = useState("");
  const [purpose, setPurpose] = useState("");
  const [sideEffects, setSideEffects] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) return <PageSkeleton message="Loading medications…" />;

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = medicationLogs.filter(l => l.takenAt.startsWith(today));

  const resetForm = () => {
    setName(""); setDosage(""); setFrequency("daily"); setScheduleTimes([""]); 
    setPrescriber(""); setPharmacy(""); setPurpose(""); setSideEffects(""); setNotes("");
    setEditingId(null);
  };

  const openCreate = () => { resetForm(); setFormOpen(true); };

  const openEdit = (med: Medication) => {
    setEditingId(med.id);
    setName(med.name); setDosage(med.dosage || ""); setFrequency(med.frequency);
    setScheduleTimes(med.scheduleTimes.length > 0 ? med.scheduleTimes : [""]);
    setPrescriber(med.prescriber || ""); setPharmacy(med.pharmacy || "");
    setPurpose(med.purpose || ""); setSideEffects(med.sideEffects || ""); setNotes(med.notes || "");
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const data: Partial<Medication> = {
      name, dosage: dosage || undefined, frequency, 
      scheduleTimes: scheduleTimes.filter(t => t.trim()),
      prescriber: prescriber || undefined, pharmacy: pharmacy || undefined,
      purpose: purpose || undefined, sideEffects: sideEffects || undefined,
      notes: notes || undefined,
    };
    if (editingId) {
      await updateMedication(editingId, data);
      toast.success("Medication updated");
    } else {
      await createMedication(data);
      toast.success("Medication added");
    }
    setFormOpen(false); resetForm();
  };

  const handleLog = async (medId: string, status: MedicationLogStatus, scheduledTime?: string) => {
    await logMedication(medId, status, scheduledTime);
    toast.success(status === 'taken' ? "Marked as taken ✓" : `Marked as ${status}`);
  };

  const isTakenToday = (medId: string, time?: string) => {
    return todayLogs.some(l => l.medicationId === medId && (!time || l.scheduledTime === time));
  };

  const addTimeSlot = () => setScheduleTimes(prev => [...prev, ""]);
  const updateTimeSlot = (idx: number, val: string) => {
    setScheduleTimes(prev => prev.map((t, i) => i === idx ? val : t));
  };
  const removeTimeSlot = (idx: number) => {
    setScheduleTimes(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" aria-hidden="true" />
            Medications
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your medications, schedules, and daily adherence.
          </p>
        </div>
        <Button onClick={openCreate} className="tap-target">
          <Plus className="h-4 w-4 mr-1.5" /> Add medication
        </Button>
      </header>

      {/* Today's schedule */}
      {activeMeds.length > 0 && (
        <section aria-label="Today's medication schedule">
          <h2 className="text-lg font-heading font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Today's schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeMeds.map(med => {
              const times = med.scheduleTimes.length > 0 ? med.scheduleTimes : [undefined];
              return times.map((time, idx) => {
                const taken = isTakenToday(med.id, time);
                return (
                  <Card key={`${med.id}-${idx}`} className={taken ? "opacity-60" : ""}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{med.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {med.dosage && <span>{med.dosage}</span>}
                          {time && <span>at {time}</span>}
                        </div>
                      </div>
                      {taken ? (
                        <Badge variant="default" className="flex-shrink-0">
                          <Check className="h-3 w-3 mr-1" /> Taken
                        </Badge>
                      ) : (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="sm" onClick={() => handleLog(med.id, 'taken', time)} className="tap-target">
                            <Check className="h-3.5 w-3.5 mr-1" /> Take
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleLog(med.id, 'skipped', time)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              });
            })}
          </div>
        </section>
      )}

      {/* Active medications list */}
      <section aria-label="Active medications">
        <h2 className="text-lg font-heading font-semibold mb-3">Active medications</h2>
        {activeMeds.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No medications added yet. Add your first medication to start tracking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeMeds.map(med => (
              <Card key={med.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {med.dosage && <Badge variant="secondary" className="text-xs">{med.dosage}</Badge>}
                        <Badge variant="outline" className="text-xs">{FREQUENCY_LABELS[med.frequency]}</Badge>
                        {med.scheduleTimes.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {med.scheduleTimes.join(', ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(med)}>
                        <CalendarDays className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(med.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {med.purpose && <p className="text-sm text-muted-foreground">Purpose: {med.purpose}</p>}
                  {med.prescriber && <p className="text-xs text-muted-foreground">Prescriber: {med.prescriber}</p>}
                  {med.sideEffects && <p className="text-xs text-muted-foreground">Side effects: {med.sideEffects}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent log */}
      {todayLogs.length > 0 && (
        <section aria-label="Today's medication log">
          <h2 className="text-lg font-heading font-semibold mb-3">Today's log</h2>
          <div className="space-y-1">
            {todayLogs.map(log => {
              const med = medications.find(m => m.id === log.medicationId);
              const style = STATUS_STYLES[log.status];
              return (
                <div key={log.id} className="flex items-center gap-3 text-sm py-1.5">
                  <Badge variant={style.variant} className="text-xs">{style.label}</Badge>
                  <span className="font-medium">{med?.name || 'Unknown'}</span>
                  {log.scheduledTime && <span className="text-muted-foreground text-xs">({log.scheduledTime})</span>}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(log.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Inactive meds */}
      {inactiveMeds.length > 0 && (
        <section aria-label="Inactive medications">
          <h2 className="text-lg font-heading font-semibold mb-3 text-muted-foreground">Discontinued</h2>
          <div className="space-y-2">
            {inactiveMeds.map(med => (
              <Card key={med.id} className="opacity-60">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{med.name}</p>
                    {med.dosage && <p className="text-xs text-muted-foreground">{med.dosage}</p>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => updateMedication(med.id, { isActive: true })}>
                    Reactivate
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingId ? "Edit medication" : "Add medication"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="med-name">Medication name *</Label>
              <Input id="med-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Sertraline" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-dosage">Dosage</Label>
                <Input id="med-dosage" value={dosage} onChange={e => setDosage(e.target.value)} placeholder="e.g. 50mg" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-frequency">Frequency</Label>
                <Select value={frequency} onValueChange={v => setFrequency(v as MedicationFrequency)}>
                  <SelectTrigger id="med-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Schedule times</Label>
              {scheduleTimes.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <Input type="time" value={t} onChange={e => updateTimeSlot(i, e.target.value)} className="flex-1" />
                  {scheduleTimes.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeTimeSlot(i)} className="h-10 w-10">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addTimeSlot} className="text-xs">
                <Plus className="h-3 w-3 mr-1" /> Add time
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-purpose">Purpose</Label>
              <Input id="med-purpose" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. For anxiety" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="med-prescriber">Prescriber</Label>
                <Input id="med-prescriber" value={prescriber} onChange={e => setPrescriber(e.target.value)} placeholder="Dr. Smith" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="med-pharmacy">Pharmacy</Label>
                <Input id="med-pharmacy" value={pharmacy} onChange={e => setPharmacy(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-side-effects">Known side effects</Label>
              <Textarea id="med-side-effects" value={sideEffects} onChange={e => setSideEffects(e.target.value)} rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-notes">Notes</Label>
              <Textarea id="med-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
            </div>
            <Button onClick={handleSave} disabled={!name.trim()} className="w-full">
              {editingId ? "Save changes" : "Add medication"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Discontinue this medication?"
        description="This will mark the medication as discontinued. You can reactivate it later."
        confirmLabel="Discontinue"
        onConfirm={() => {
          if (deleteId) updateMedication(deleteId, { isActive: false });
          setDeleteId(null);
        }}
      />
    </div>
  );
}
