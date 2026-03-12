import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { TaskForm } from "@/components/forms/TaskForm";

const categoryEmoji: Record<string, string> = {
  general: '📋', medication: '💊', hygiene: '🪥', meals: '🍽️',
  hydration: '💧', therapy: '🧠', mobility: '🚶', community: '🤝',
};

export default function TasksPage() {
  const { tasks, alters, toggleTask, getAlter, isLoading, createTask } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading tasks..." />;

  const incomplete = tasks.filter(t => !t.isCompleted);
  const completed = tasks.filter(t => t.isCompleted);

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
              {incomplete.map(task => {
                const assignee = task.assignedTo === 'system' ? 'Everyone' : task.assignedTo === 'next-fronter' ? 'Whoever fronts next' : getAlter(task.assignedTo)?.name || task.assignedTo;
                return (
                  <li key={task.id}>
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer tap-target">
                      <Checkbox checked={false} onCheckedChange={() => toggleTask(task.id)} aria-label={`Complete: ${task.title}`} />
                      <span className="text-lg" aria-hidden="true">{categoryEmoji[task.category] || '📋'}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{task.title}</span>
                        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">{assignee}</Badge>
                    </label>
                  </li>
                );
              })}
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
              {completed.map(task => (
                <li key={task.id}>
                  <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer tap-target opacity-60">
                    <Checkbox checked={true} onCheckedChange={() => toggleTask(task.id)} aria-label={`Uncomplete: ${task.title}`} />
                    <span className="text-lg" aria-hidden="true">{categoryEmoji[task.category] || '📋'}</span>
                    <span className="line-through">{task.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
