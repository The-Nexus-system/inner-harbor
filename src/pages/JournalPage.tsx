import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { JournalForm } from "@/components/forms/JournalForm";

const typeLabels: Record<string, string> = {
  text: 'Entry', mood: 'Mood', sensory: 'Sensory', flashback: 'Flashback',
  medical: 'Medical', seizure: 'Seizure', victory: 'Victory', 'memory-reconstruction': 'Memory',
};

export default function JournalPage() {
  const { journalEntries, alters, getAlter, isLoading, createJournalEntry } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading journal..." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Journal</h1>
          <p className="text-muted-foreground mt-1">A space for everyone in the system to write, reflect, and record.</p>
        </div>
        <JournalForm alters={alters} onSubmit={createJournalEntry} />
      </header>

      {journalEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">No journal entries yet. This space is ready when you are.</p>
            <JournalForm alters={alters} onSubmit={createJournalEntry} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {journalEntries.map(entry => {
            const author = entry.alterId ? getAlter(entry.alterId) : null;
            return (
              <Card key={entry.id} aria-label={`Journal entry by ${author?.name || 'unknown fronter'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                      {author ? (
                        <>
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: author.color }} aria-hidden="true" />
                          {author.emoji} {author.name}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Unknown fronter</span>
                      )}
                    </CardTitle>
                    <div className="flex gap-1.5">
                      <Badge variant={entry.type === 'victory' ? 'default' : 'secondary'} className="text-xs">
                        {typeLabels[entry.type]}
                      </Badge>
                      {entry.mood && <Badge variant="outline" className="text-xs">Mood: {entry.mood}/5</Badge>}
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </time>
                </CardHeader>
                <CardContent>
                  {entry.title && <h3 className="font-medium mb-1">{entry.title}</h3>}
                  <p className="text-sm text-foreground leading-relaxed">{entry.content}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {entry.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
