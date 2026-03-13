import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Pencil, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardSection, EnvironmentPreset } from "@/types/system";

const ALL_SECTIONS: { key: DashboardSection; label: string }[] = [
  { key: 'front', label: 'Current front' },
  { key: 'handoff', label: 'Handoff notes' },
  { key: 'checkin', label: 'Daily check-in' },
  { key: 'capacity', label: 'Energy budget' },
  { key: 'medications', label: 'Medications' },
  { key: 'notes', label: 'Quick notes' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'messages', label: 'Messages' },
  { key: 'journal', label: 'Journal' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'safety', label: 'Safety' },
  { key: 'insights', label: 'Insights' },
  { key: 'summary', label: 'Daily summary' },
  { key: 'trends', label: 'Check-in trends' },
];

const DEFAULT_PRESETS: Partial<EnvironmentPreset>[] = [
  { name: 'Home', icon: '🏠', visibleSections: ['front','handoff','checkin','notes','tasks','messages','journal','calendar','safety','insights','summary','trends'] },
  { name: 'Therapy', icon: '💜', visibleSections: ['front','handoff','checkin','journal','safety','insights'] },
  { name: 'Public', icon: '🌍', visibleSections: ['front','tasks','calendar','safety'] },
  { name: 'Work', icon: '💼', visibleSections: ['front','tasks','calendar','notes','messages'] },
  { name: 'Rest', icon: '🌙', visibleSections: ['front','handoff','checkin','safety','notes'] },
];

export function EnvironmentPresetSwitcher() {
  const { environmentPresets, activePreset, activatePreset, createPreset, updatePreset, deletePreset } = useSystem();
  const [editOpen, setEditOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Partial<EnvironmentPreset> | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("🏠");
  const [editSections, setEditSections] = useState<DashboardSection[]>([]);

  const seedDefaults = async () => {
    for (const preset of DEFAULT_PRESETS) {
      await createPreset(preset);
    }
  };

  const openEdit = (preset?: EnvironmentPreset) => {
    if (preset) {
      setEditingPreset(preset);
      setEditName(preset.name);
      setEditIcon(preset.icon);
      setEditSections([...preset.visibleSections]);
    } else {
      setEditingPreset(null);
      setEditName("");
      setEditIcon("🏠");
      setEditSections(ALL_SECTIONS.map(s => s.key));
    }
    setEditOpen(true);
  };

  const handleSave = async () => {
    const data = { name: editName, icon: editIcon, visibleSections: editSections };
    if (editingPreset?.id) {
      await updatePreset(editingPreset.id, data);
    } else {
      await createPreset(data);
    }
    setEditOpen(false);
  };

  const toggleSection = (key: DashboardSection) => {
    setEditSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  return (
    <div className="space-y-3">
      {/* Quick switcher bar */}
      <div className="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Environment preset">
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <button
          onClick={() => activatePreset(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors tap-target",
            !activePreset ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
          role="radio"
          aria-checked={!activePreset}
        >
          All
        </button>
        {environmentPresets.map(preset => (
          <button
            key={preset.id}
            onClick={() => activatePreset(preset.isActive ? null : preset.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors tap-target",
              preset.isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            role="radio"
            aria-checked={preset.isActive}
          >
            {preset.icon} {preset.name}
          </button>
        ))}
      </div>

      {/* Management row */}
      <div className="flex items-center gap-2">
        {environmentPresets.length === 0 && (
          <Button variant="outline" size="sm" onClick={seedDefaults} className="text-xs">
            <Plus className="h-3 w-3 mr-1" /> Add default presets
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => openEdit()} className="text-xs">
          <Plus className="h-3 w-3 mr-1" /> New preset
        </Button>
        {activePreset && (
          <Button variant="ghost" size="sm" onClick={() => openEdit(activePreset)} className="text-xs">
            <Pencil className="h-3 w-3 mr-1" /> Edit "{activePreset.name}"
          </Button>
        )}
        {activePreset && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { if (confirm(`Delete "${activePreset.name}"?`)) deletePreset(activePreset.id); }}
            className="text-xs text-destructive hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" /> Delete
          </Button>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingPreset?.id ? "Edit preset" : "Create preset"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="space-y-1.5 flex-shrink-0">
                <Label htmlFor="preset-icon">Icon</Label>
                <Input id="preset-icon" value={editIcon} onChange={e => setEditIcon(e.target.value)} className="w-16 text-center text-lg" maxLength={2} />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="preset-name">Name</Label>
                <Input id="preset-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder="e.g. Therapy" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Visible dashboard sections</Label>
              <p className="text-xs text-muted-foreground">Choose which parts of the dashboard to show in this environment</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_SECTIONS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm cursor-pointer tap-target">
                    <Checkbox
                      checked={editSections.includes(key)}
                      onCheckedChange={() => toggleSection(key)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={!editName.trim()} className="w-full">
              {editingPreset?.id ? "Save changes" : "Create preset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
