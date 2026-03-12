import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Download, Save, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { useDailySummary } from '@/hooks/useDailySummary';
import { WeeklyReflection } from '@/components/WeeklyReflection';
import { timelineToPlainText, type TimelineEvent } from '@/lib/timeline';
import { useInsights } from '@/hooks/useInsights';
import { PageSkeleton } from '@/components/LoadingSkeleton';

const typeColors: Record<string, string> = {
  front: 'bg-primary/20 border-primary',
  journal: 'bg-accent/50 border-accent-foreground/20',
  message: 'bg-secondary border-secondary-foreground/20',
  task: 'bg-safe/20 border-safe',
  calendar: 'bg-info/20 border-info',
  gap: 'bg-warning/20 border-warning',
};

const typeLabels: Record<string, string> = {
  front: 'Front',
  journal: 'Journal',
  message: 'Message',
  task: 'Task',
  calendar: 'Event',
  gap: 'Gap',
};

function TimelineItem({ event, mode }: { event: TimelineEvent; mode: string }) {
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const colorClass = typeColors[event.type] || 'bg-muted border-border';

  if (mode === 'low-detail') {
    return (
      <div className="flex items-center gap-3 py-1.5">
        <span className="text-xs text-muted-foreground w-12 flex-shrink-0">{time}</span>
        <Badge variant="outline" className="text-xs">{typeLabels[event.type]}</Badge>
        <span className="text-sm truncate">{event.title}</span>
      </div>
    );
  }

  return (
    <div className={`relative pl-6 pb-4 border-l-2 ${event.type === 'gap' ? 'border-dashed border-warning' : 'border-border'}`}>
      <div className={`absolute left-[-5px] top-1 w-2 h-2 rounded-full ${event.type === 'gap' ? 'bg-warning' : 'bg-primary'}`} aria-hidden="true" />
      <div className={`p-3 rounded-lg border ${colorClass}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">{time}</span>
              <Badge variant="outline" className="text-xs">{typeLabels[event.type]}</Badge>
              {event.certainty !== 'confirmed' && (
                <Badge variant="secondary" className="text-xs">{event.certainty}</Badge>
              )}
            </div>
            <p className="text-sm font-medium mt-1">{event.title}</p>
          </div>
        </div>
        {mode === 'detailed' && event.description && (
          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
        )}
        {mode === 'detailed' && event.metadata?.memoryContinuity && (
          <p className="text-xs text-muted-foreground mt-1">Memory: {String(event.metadata.memoryContinuity)}</p>
        )}
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('visual');
  const [notes, setNotes] = useState('');
  const { timeline, summary, weeklyReflection, isLoading, saveSummary, exportAsText } = useDailySummary(date);
  const { preferences } = useInsights();

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  if (isLoading) return <PageSkeleton message="Loading timeline..." />;

  const plainText = timelineToPlainText(timeline, preferences.detailMode);
  const displayDate = new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Timeline</h1>
        <p className="text-muted-foreground mt-1">
          Here is what we know. Some parts may be incomplete, and that is okay.
        </p>
      </header>

      {/* Date navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => changeDate(-1)} aria-label="Previous day" className="tap-target">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <Input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-auto text-center"
            aria-label="Select date"
          />
          <p className="text-xs text-muted-foreground mt-1">{displayDate}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => changeDate(1)} aria-label="Next day" className="tap-target">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Daily summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.narrativeSummary}</p>
        </CardContent>
      </Card>

      {/* View modes */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="reconstruction">What we know</TabsTrigger>
          <TabsTrigger value="low-detail">Low detail</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        {/* Visual timeline */}
        <TabsContent value="visual" className="mt-4">
          {timeline.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No events recorded for this day.</CardContent></Card>
          ) : (
            <div className="space-y-0" role="list" aria-label="Timeline events">
              {timeline.map(event => <TimelineItem key={event.id} event={event} mode="visual" />)}
            </div>
          )}
        </TabsContent>

        {/* Text-first */}
        <TabsContent value="text" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading flex items-center gap-2">
                <FileText className="h-4 w-4" /> Chronological text view
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" role="document" aria-label="Timeline text view">
                {plainText}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* "What we know" reconstruction */}
        <TabsContent value="reconstruction" className="mt-4 space-y-3">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <h3 className="font-medium">What we know about {displayDate}</h3>
              <p className="text-sm text-muted-foreground">This summary includes confirmed details and possible links.</p>

              {summary.fronters.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Who was here</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {summary.fronters.map(f => (
                      <Badge key={f.name} variant="outline">{f.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {summary.unknownPeriods > 0 && (
                <p className="text-sm text-muted-foreground italic">
                  There {summary.unknownPeriods === 1 ? 'was' : 'were'} {summary.unknownPeriods} uncertain period{summary.unknownPeriods !== 1 ? 's' : ''}.
                </p>
              )}

              {summary.eventsAttended.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium">Events</h4>
                  <ul className="text-sm text-muted-foreground space-y-0.5" role="list">
                    {summary.eventsAttended.map(e => <li key={e}>• {e}</li>)}
                  </ul>
                </div>
              )}

              {summary.tasksCompleted > 0 && (
                <p className="text-sm text-muted-foreground">{summary.tasksCompleted} task{summary.tasksCompleted !== 1 ? 's' : ''} completed.</p>
              )}

              {summary.gaps > 0 && (
                <p className="text-sm text-muted-foreground italic">There {summary.gaps === 1 ? 'is' : 'are'} {summary.gaps} gap{summary.gaps !== 1 ? 's' : ''} in the timeline here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Low detail */}
        <TabsContent value="low-detail" className="mt-4">
          {timeline.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No events recorded.</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-1" role="list" aria-label="Timeline low detail">
                {timeline.map(event => <TimelineItem key={event.id} event={event} mode="low-detail" />)}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Detailed */}
        <TabsContent value="detailed" className="mt-4">
          {timeline.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No events recorded.</CardContent></Card>
          ) : (
            <div className="space-y-0" role="list" aria-label="Timeline detailed">
              {timeline.map(event => <TimelineItem key={event.id} event={event} mode="detailed" />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Notes & save */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Add notes to this day</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add context, fill in gaps, or note anything else about today..."
            className="min-h-[60px]"
            aria-label="Daily notes"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveSummary(notes)} className="gap-1.5 tap-target">
              <Save className="h-3.5 w-3.5" /> Save summary
            </Button>
            <Button size="sm" variant="outline" onClick={exportAsText} className="gap-1.5 tap-target">
              <Download className="h-3.5 w-3.5" /> Export as text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly reflection */}
      {weeklyReflection && <WeeklyReflection data={weeklyReflection} />}
    </div>
  );
}
