import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";

interface ContextSnapshotButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function ContextSnapshotButton({ variant = "outline", size = "default", className, showLabel = true }: ContextSnapshotButtonProps) {
  const { createContextSnapshot } = useSystem();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleQuickSave = async () => {
    setSaving(true);
    try {
      await createContextSnapshot();
      toast({ title: "Snapshot saved", description: "You can come back to this later to reorient." });
    } catch {
      toast({ title: "Could not save snapshot", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithNotes = async () => {
    setSaving(true);
    try {
      await createContextSnapshot(notes.trim() || undefined);
      toast({ title: "Snapshot saved", description: "You can come back to this later to reorient." });
      setNotes("");
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not save snapshot", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <Button
          variant={variant}
          size={size}
          className={`tap-target ${className ?? ""}`}
          onClick={handleQuickSave}
          disabled={saving}
          aria-label="Take a context snapshot"
        >
          <Camera className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {showLabel && (saving ? "Saving…" : "Snapshot")}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => setDialogOpen(true)}
          aria-label="Take snapshot with notes"
          title="Add notes to snapshot"
        >
          <span className="text-xs">+</span>
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <Camera className="h-5 w-5 text-primary" aria-hidden="true" />
              Snapshot with notes
            </DialogTitle>
            <DialogDescription>
              This will capture your current context — who is here, active tasks, upcoming events, and how you're feeling. Add any extra notes below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="snapshot-notes">Additional notes (optional)</Label>
            <Textarea
              id="snapshot-notes"
              placeholder="e.g. Just woke up feeling confused, trying to reorient…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="tap-target">Cancel</Button>
            <Button onClick={handleSaveWithNotes} disabled={saving} className="tap-target">
              {saving ? "Saving…" : "Save snapshot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
