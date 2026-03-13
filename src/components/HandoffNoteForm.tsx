import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { HandHeart } from "lucide-react";

interface HandoffNoteFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HandoffNoteForm({ open, onOpenChange }: HandoffNoteFormProps) {
  const { currentFront, createHandoffNote } = useSystem();
  const [currentActivity, setCurrentActivity] = useState("");
  const [unfinishedTasks, setUnfinishedTasks] = useState("");
  const [emotionalState, setEmotionalState] = useState("");
  const [importantReminders, setImportantReminders] = useState("");
  const [warnings, setWarnings] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await createHandoffNote({
        frontEventId: currentFront?.id,
        currentActivity: currentActivity.trim() || undefined,
        unfinishedTasks: unfinishedTasks.trim() || undefined,
        emotionalState: emotionalState.trim() || undefined,
        importantReminders: importantReminders.trim() || undefined,
        warnings: warnings.trim() || undefined,
      });
      toast({ title: "Handoff note saved", description: "The next person will see this. Thank you for sharing." });
      setCurrentActivity("");
      setUnfinishedTasks("");
      setEmotionalState("");
      setImportantReminders("");
      setWarnings("");
      onOpenChange(false);
    } catch {
      toast({ title: "Could not save", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading">
            <HandHeart className="h-5 w-5 text-primary" aria-hidden="true" />
            Leave a handoff note
          </DialogTitle>
          <DialogDescription>
            Before you go, is there anything the next person should know? All fields are optional — share only what feels right.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="handoff-activity">What were you doing?</Label>
            <Textarea
              id="handoff-activity"
              placeholder="e.g. Working on homework, watching a show, resting…"
              value={currentActivity}
              onChange={(e) => setCurrentActivity(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handoff-tasks">Anything left unfinished?</Label>
            <Textarea
              id="handoff-tasks"
              placeholder="e.g. Need to reply to an email, laundry in the dryer…"
              value={unfinishedTasks}
              onChange={(e) => setUnfinishedTasks(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handoff-emotional">How are you/we feeling?</Label>
            <Textarea
              id="handoff-emotional"
              placeholder="e.g. A bit tired but okay, feeling anxious about tomorrow…"
              value={emotionalState}
              onChange={(e) => setEmotionalState(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handoff-reminders">Important reminders</Label>
            <Textarea
              id="handoff-reminders"
              placeholder="e.g. Take meds at 8pm, cat needs feeding…"
              value={importantReminders}
              onChange={(e) => setImportantReminders(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handoff-warnings">Any warnings or heads-up?</Label>
            <Textarea
              id="handoff-warnings"
              placeholder="e.g. Avoid checking social media right now, the kitchen is messy…"
              value={warnings}
              onChange={(e) => setWarnings(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="tap-target">
            Skip for now
          </Button>
          <Button onClick={handleSave} disabled={saving} className="tap-target">
            {saving ? "Saving…" : "Save handoff note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
