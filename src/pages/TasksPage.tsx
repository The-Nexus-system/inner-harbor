import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { TaskForm } from "@/components/forms/TaskForm";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pencil, Trash2, RefreshCw } from "lucide-react";
import type { SystemTask } from "@/types/system";

const categoryEmoji: Record<string, string> = {
  general: '📋', medication: '💊', hygiene: '🪥', meals: '🍽️',
  hydration: '💧', therapy: '🧠', mobility: '🚶', community: '🤝',
};

const recurrenceLabel: Record<string, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly',
};
  const { tasks, alters, toggleTask, updateTask, deleteTask, getAlter, isLoading, createTask } = useSystem();
  const [editingTask, setEditingTask] = useState<SystemTask | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton message="Loading tasks..." />;

  const incomplete = tasks.filter(t => !t.isCompleted);
  const completed = tasks.filter(t => t.isCompleted);

  const handleEdit = async (data: Partial<SystemTask>) => {
    if (editingTask) await updateTask(editingTask.id, data);
  };

  const handleDelete = async () => {
    if (deletingTaskId) {
      await deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  };

  const renderTask = (task: SystemTask, isComplete: boolean) => {
    const assignee = task.assignedTo === 'system' ? 'Everyone' : task.assignedTo === 'next-fronter' ? 'Whoever fronts next' : getAlter(task.assignedTo)?.name || task.assignedTo;
    return (
      <li key={task.id}>
        <div className={`flex items-center gap-3 p-3 rounded-lg hover:bg-muted group ${isComplete ? 'opacity-60' : ''}`}>
          <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer tap-target">
            <Checkbox checked={isComplete} onCheckedChange={() => toggleTask(task.id)} aria-label={`${isComplete ? 'Uncomplete' : 'Complete'}: ${task.title}`} />
            <span className="text-lg" aria-hidden="true">{categoryEmoji[task.category] || '📋'}</span>
            <div className="flex-1 min-w-0">
              <span className={`font-medium ${isComplete ? 'line-through' : ''}`}>{task.title}</span>
              {!isComplete && task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
            </div>
          </label>
          {!isComplete && <Badge variant="outline" className="text-xs flex-shrink-0">{assignee}</Badge>}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingTask(task)} aria-label="Edit task">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingTaskId(task.id)} aria-label="Delete task">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Daily tasks, medication, self-care, and responsibilities.</p>
        </div>
        <TaskForm alters={alters} onSubmit={createTask} />
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">To do</CardTitle>
        </CardHeader>
        <CardContent>
          {incomplete.length === 0 ? (
            <div className="text-center space-y-3 py-4">
              <p className="text-sm text-muted-foreground">No tasks right now. Nice work, or add some when ready.</p>
              <TaskForm alters={alters} onSubmit={createTask} />
            </div>
          ) : (
            <ul className="space-y-1" role="list">
              {incomplete.map(task => renderTask(task, false))}
            </ul>
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1" role="list">
              {completed.map(task => renderTask(task, true))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Edit dialog */}
      <TaskForm
        alters={alters}
        onSubmit={handleEdit}
        editTask={editingTask || undefined}
        open={!!editingTask}
        onOpenChange={open => { if (!open) setEditingTask(null); }}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingTaskId}
        onOpenChange={open => { if (!open) setDeletingTaskId(null); }}
        title="Delete task"
        description="This task will be archived and removed from your list. This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
