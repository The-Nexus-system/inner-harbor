import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, EarOff, Hand, Wind, Utensils, RotateCcw, Move } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSystem } from "@/contexts/SystemContext";
import { useToast } from "@/hooks/use-toast";

interface SensoryProfile {
  id: string;
  alterId?: string;
  label: string;
  visual: number;
  auditory: number;
  tactile: number;
  olfactory: number;
  gustatory: number;
  vestibular: number;
  proprioceptive: number;
  safeEnvironments?: string;
  sensoryTriggers?: string;
  copingStrategies?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

const SENSES = [
  { key: 'visual', label: 'Visual', icon: Eye, desc: 'Light, colors, movement' },
  { key: 'auditory', label: 'Auditory', icon: EarOff, desc: 'Sounds, noise levels' },
  { key: 'tactile', label: 'Tactile', icon: Hand, desc: 'Touch, textures, pressure' },
  { key: 'olfactory', label: 'Olfactory', icon: Wind, desc: 'Smells, scents' },
  { key: 'gustatory', label: 'Gustatory', icon: Utensils, desc: 'Tastes, food textures' },
  { key: 'vestibular', label: 'Vestibular', icon: RotateCcw, desc: 'Balance, motion' },
  { key: 'proprioceptive', label: 'Proprioceptive', icon: Move, desc: 'Body awareness, pressure' },
] as const;

const sensitivityLabel = (v: number) => {
  if (v <= 1) return 'Very low';
  if (v <= 2) return 'Low';
  if (v <= 3) return 'Moderate';
  if (v <= 4) return 'High';
  return 'Very high';
};

const sensitivityColor = (v: number) => {
  if (v <= 1) return 'bg-muted text-muted-foreground';
  if (v <= 2) return 'bg-secondary text-secondary-foreground';
  if (v <= 3) return 'bg-accent text-accent-foreground';
  if (v <= 4) return 'bg-primary/20 text-primary';
  return 'bg-destructive/20 text-destructive';
};

export default function SensoryProfilePage() {
  const { user } = useAuth();
  const { alters } = useSystem();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<SensoryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SensoryProfile | null>(null);

  // Form state
  const [label, setLabel] = useState('');
  const [alterId, setAlterId] = useState('');
  const [senses, setSenses] = useState<Record<string, number>>({
    visual: 3, auditory: 3, tactile: 3, olfactory: 3, gustatory: 3, vestibular: 3, proprioceptive: 3,
  });
  const [safeEnv, setSafeEnv] = useState('');
  const [triggers, setTriggers] = useState('');
  const [coping, setCoping] = useState('');
  const [notes, setNotes] = useState('');

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('sensory_profiles' as any).select('*').eq('user_id', user.id).order('created_at');
    setProfiles((data ?? []).map((r: any): SensoryProfile => ({
      id: r.id, alterId: r.alter_id ?? undefined, label: r.label,
      visual: r.visual, auditory: r.auditory, tactile: r.tactile,
      olfactory: r.olfactory, gustatory: r.gustatory, vestibular: r.vestibular,
      proprioceptive: r.proprioceptive, safeEnvironments: r.safe_environments ?? undefined,
      sensoryTriggers: r.sensory_triggers ?? undefined, copingStrategies: r.coping_strategies ?? undefined,
      notes: r.notes ?? undefined, isActive: r.is_active, createdAt: r.created_at,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const resetForm = () => {
    setLabel(''); setAlterId('');
    setSenses({ visual: 3, auditory: 3, tactile: 3, olfactory: 3, gustatory: 3, vestibular: 3, proprioceptive: 3 });
    setSafeEnv(''); setTriggers(''); setCoping(''); setNotes('');
    setEditing(null);
  };

  const openEdit = (p: SensoryProfile) => {
    setEditing(p);
    setLabel(p.label); setAlterId(p.alterId || '');
    setSenses({ visual: p.visual, auditory: p.auditory, tactile: p.tactile, olfactory: p.olfactory, gustatory: p.gustatory, vestibular: p.vestibular, proprioceptive: p.proprioceptive });
    setSafeEnv(p.safeEnvironments || ''); setTriggers(p.sensoryTriggers || '');
    setCoping(p.copingStrategies || ''); setNotes(p.notes || '');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!user || !label.trim()) return;
    const row: Record<string, any> = {
      label: label.trim(), alter_id: alterId || null,
      ...senses,
      safe_environments: safeEnv || null, sensory_triggers: triggers || null,
      coping_strategies: coping || null, notes: notes || null,
    };
    if (editing) {
      await supabase.from('sensory_profiles' as any).update(row).eq('id', editing.id);
    } else {
      await supabase.from('sensory_profiles' as any).insert([{ ...row, user_id: user.id }]);
    }
    toast({ title: editing ? 'Profile updated' : 'Profile created' });
    setFormOpen(false); resetForm(); fetchProfiles();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('sensory_profiles' as any).delete().eq('id', id);
    toast({ title: 'Profile removed' });
    fetchProfiles();
  };

  const getAlterName = (id?: string) => alters.find(a => a.id === id)?.name;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Sensory Profiles</h1>
          <p className="text-muted-foreground mt-1">Track sensory sensitivities, triggers, and what helps. Each alter can have their own profile.</p>
        </div>
        <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New profile</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit' : 'New'} Sensory Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Label</Label>
                  <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Morning profile" />
                </div>
                <div>
                  <Label>Alter (optional)</Label>
                  <Select value={alterId} onValueChange={setAlterId}>
                    <SelectTrigger><SelectValue placeholder="System-wide" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">System-wide</SelectItem>
                      {alters.filter(a => a.isActive).map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.emoji} {a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Sensitivity levels (1 = very low, 5 = very high)</p>
                {SENSES.map(s => (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <s.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <Badge variant="outline" className={sensitivityColor(senses[s.key])}>
                        {sensitivityLabel(senses[s.key])}
                      </Badge>
                    </div>
                    <Slider
                      min={1} max={5} step={1}
                      value={[senses[s.key]]}
                      onValueChange={([v]) => setSenses(prev => ({ ...prev, [s.key]: v }))}
                    />
                  </div>
                ))}
              </div>

              <div>
                <Label>Safe environments</Label>
                <Textarea value={safeEnv} onChange={e => setSafeEnv(e.target.value)} placeholder="Quiet room with dim lighting..." rows={2} />
              </div>
              <div>
                <Label>Sensory triggers</Label>
                <Textarea value={triggers} onChange={e => setTriggers(e.target.value)} placeholder="Loud sudden noises, bright fluorescent lights..." rows={2} />
              </div>
              <div>
                <Label>Coping strategies</Label>
                <Textarea value={coping} onChange={e => setCoping(e.target.value)} placeholder="Noise-cancelling headphones, sunglasses..." rows={2} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={!label.trim()}>
                {editing ? 'Update' : 'Create'} profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading && <p className="text-muted-foreground text-sm">Loading...</p>}

      {!loading && profiles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No sensory profiles yet. Create one to track sensory needs.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {profiles.map(p => (
          <Card key={p.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-heading">{p.label}</CardTitle>
                  {p.alterId && (
                    <CardDescription>{getAlterName(p.alterId)}'s profile</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SENSES.map(s => (
                  <Badge key={s.key} variant="outline" className={sensitivityColor(p[s.key as keyof SensoryProfile] as number)}>
                    <s.icon className="h-3 w-3 mr-1" />
                    {s.label}: {sensitivityLabel(p[s.key as keyof SensoryProfile] as number)}
                  </Badge>
                ))}
              </div>
              {p.sensoryTriggers && (
                <div><span className="text-xs font-medium text-muted-foreground">Triggers:</span> <span className="text-sm">{p.sensoryTriggers}</span></div>
              )}
              {p.copingStrategies && (
                <div><span className="text-xs font-medium text-muted-foreground">Coping:</span> <span className="text-sm">{p.copingStrategies}</span></div>
              )}
              {p.safeEnvironments && (
                <div><span className="text-xs font-medium text-muted-foreground">Safe environments:</span> <span className="text-sm">{p.safeEnvironments}</span></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
