import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContextSnapshotButton } from "@/components/ContextSnapshotButton";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { Camera, Trash2, CheckSquare, CalendarDays, Brain, Activity } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";

export default function SnapshotsPage() {
  const { contextSnapshots, handoffNotes, getAlter, deleteContextSnapshot, isLoading } = useSystem();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton message="Loading snapshots…" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
            <Camera className="h-6 w-6 text-primary" aria-hidden="true" />
            Snapshots
          </h1>
          <p className="text-muted-foreground mt-1">
            Captured moments to help you reorient. Each snapshot records who was here, what was happening, and how things felt.
          </p>
        </div>
        <ContextSnapshotButton variant="default" />
      </header>

      {/* Recent handoff notes */}
      {handoffNotes.length > 0 && (
        <section aria-label="Recent handoff notes">
          <h2 className="text-lg font-heading font-semibold mb-3">Recent handoff notes</h2>
          <div className="space-y-3">
            {handoffNotes.slice(0, 5).map(note => (
              <Card key={note.id} className="border-l-4 border-l-primary/40">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                    {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {note.currentActivity && (
                    <div><span className="text-xs font-medium text-muted-foreground">Activity:</span> <span className="text-sm">{note.currentActivity}</span></div>
                  )}
                  {note.unfinishedTasks && (
                    <div><span className="text-xs font-medium text-muted-foreground">Unfinished:</span> <span className="text-sm">{note.unfinishedTasks}</span></div>
                  )}
                  {note.emotionalState && (
                    <div><span className="text-xs font-medium text-muted-foreground">Feeling:</span> <span className="text-sm">{note.emotionalState}</span></div>
                  )}
                  {note.importantReminders && (
                    <div><span className="text-xs font-medium text-muted-foreground">Reminders:</span> <span className="text-sm">{note.importantReminders}</span></div>
                  )}
                  {note.warnings && (
                    <div className="text-sm text-destructive"><span className="text-xs font-medium">⚠ Heads-up:</span> {note.warnings}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Context snapshots */}
      <section aria-label="Context snapshots">
        <h2 className="text-lg font-heading font-semibold mb-3">Context snapshots</h2>
        {contextSnapshots.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No snapshots yet. Take one whenever you want to remember this moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contextSnapshots.map(snap => {
              const snapAlters = snap.frontAlterIds.map(id => getAlter(id)).filter(Boolean);
              return (
                <Card key={snap.id} className="relative">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(snap.snapshotTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}{' '}
                          {new Date(snap.snapshotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {snapAlters.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {snapAlters.map(a => a && (
                              <Badge key={a.id} variant="secondary" className="text-xs" style={{ borderColor: a.color }}>
                                {a.emoji} {a.name}
                              </Badge>
                            ))}
                            {snap.frontStatus && <Badge variant="outline" className="text-xs">{snap.frontStatus}</Badge>}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(snap.id)}
                        aria-label="Delete snapshot"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {snap.mood != null && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Brain className="h-3 w-3" aria-hidden="true" /> Mood: {snap.mood}/5
                        </div>
                      )}
                      {snap.stress != null && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-3 w-3" aria-hidden="true" /> Stress: {snap.stress}/5
                        </div>
                      )}
                      {snap.activeTasks.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CheckSquare className="h-3 w-3" aria-hidden="true" /> {snap.activeTasks.length} active tasks
                        </div>
                      )}
                      {snap.calendarContext.length > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" aria-hidden="true" /> {snap.calendarContext.length} upcoming
                        </div>
                      )}
                    </div>

                    {snap.activeTasks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Active tasks</p>
                        <ul className="text-sm space-y-0.5" role="list">
                          {snap.activeTasks.slice(0, 5).map((t: any) => (
                            <li key={t.id} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                              {t.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {snap.notes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">Notes</p>
                        <p className="text-sm">{snap.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Delete this snapshot?"
        description="This will permanently remove this context snapshot."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteContextSnapshot(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
