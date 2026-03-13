import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { HandoffNoteForm } from "@/components/HandoffNoteForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HandHeart, ChevronDown } from "lucide-react";
import type { FrontStatus } from "@/types/system";

const statusLabels: Record<FrontStatus, string> = {
  'fronting': 'Fronting',
  'co-fronting': 'Co-fronting',
  'co-conscious': 'Co-conscious',
  'passive-influence': 'Passive influence',
  'blurry': 'Blurry / unclear',
  'unknown': 'Unknown',
  'dormant': 'Dormant',
  'unavailable': 'Unavailable',
  'stuck': 'Front stuck',
  'nonverbal': 'Nonverbal front',
};

export default function FrontPage() {
  const { alters, frontEvents, currentFront, getAlter, setCurrentFronter, handoffNotes, isLoading } = useSystem();
  const [selectedAlters, setSelectedAlters] = useState<string[]>(currentFront?.alterIds || []);
  const [status, setStatus] = useState<FrontStatus>(currentFront?.status || 'fronting');
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);

  if (isLoading) return <PageSkeleton message="Loading front tracking..." />;

  const toggleAlter = (id: string) => {
    setSelectedAlters(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const handleSwitch = () => {
    if (selectedAlters.length > 0 || status === 'unknown' || status === 'blurry') {
      setCurrentFronter(selectedAlters, status);
    }
  };

  const sortedEvents = [...frontEvents].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Front tracking</h1>
        <p className="text-muted-foreground mt-1">Track who is fronting, co-fronting, or present. No need to always know — uncertain is valid.</p>
      </header>

      <Card aria-label="Current front status">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Who is here now</CardTitle>
        </CardHeader>
        <CardContent>
          {currentFront ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 items-center">
                {currentFront.alterIds.length > 0 ? currentFront.alterIds.map(id => {
                  const a = getAlter(id);
                  return a ? (
                    <Badge key={id} className="text-sm py-1 px-3" style={{ backgroundColor: a.color, color: '#fff' }}>
                      {a.emoji} {a.name}
                    </Badge>
                  ) : null;
                }) : (
                  <Badge variant="secondary">Unknown / unclear</Badge>
                )}
                <Badge variant="outline">{statusLabels[currentFront.status]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Since {new Date(currentFront.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">No front information set</p>
          )}
        </CardContent>
      </Card>

      <Card aria-label="Quick switch tool">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Quick switch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block" id="front-status-label">Front type</label>
            <Select value={status} onValueChange={(v) => setStatus(v as FrontStatus)}>
              <SelectTrigger className="w-full max-w-xs tap-target" aria-labelledby="front-status-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">Who is here? (select one or more)</legend>
            {alters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No alter profiles yet. Create profiles in the System page first.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {alters.filter(a => a.isActive).map(alter => (
                  <label key={alter.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer tap-target">
                    <Checkbox checked={selectedAlters.includes(alter.id)} onCheckedChange={() => toggleAlter(alter.id)} aria-label={`Select ${alter.name}`} />
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: alter.color || 'hsl(var(--primary))' }} aria-hidden="true" />
                    <span className="font-medium">{alter.emoji} {alter.name}</span>
                    <span className="text-xs text-muted-foreground">({alter.pronouns})</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <Button onClick={handleSwitch} className="tap-target" size="lg">Update front</Button>
        </CardContent>
      </Card>

      <Card aria-label="Front history timeline">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Front history</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No front history yet. It will build up as you track.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" role="table" aria-label="Front event history">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Time</th>
                    <th className="text-left py-2 pr-4 font-medium">Who</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Duration</th>
                    <th className="text-left py-2 pr-4 font-medium">Memory</th>
                    <th className="text-left py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEvents.map(event => {
                    const eventAlters = event.alterIds.map(id => getAlter(id)).filter(Boolean);
                    const start = new Date(event.startTime);
                    const end = event.endTime ? new Date(event.endTime) : null;
                    const durationMs = end ? end.getTime() - start.getTime() : null;
                    const durationStr = durationMs
                      ? `${Math.floor(durationMs / 3600000)}h ${Math.floor((durationMs % 3600000) / 60000)}m`
                      : 'Ongoing';

                    return (
                      <tr key={event.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2.5 pr-4 whitespace-nowrap">
                          {start.toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 pr-4">
                          {eventAlters.length > 0
                            ? eventAlters.map(a => a && (
                              <span key={a.id} className="inline-flex items-center gap-1 mr-1.5">
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: a.color }} aria-hidden="true" />
                                {a.name}
                              </span>
                            ))
                            : <span className="text-muted-foreground italic">Unknown</span>
                          }
                        </td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline" className="text-xs">{statusLabels[event.status]}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 whitespace-nowrap">{durationStr}</td>
                        <td className="py-2.5 pr-4">
                          <Badge
                            variant={event.memoryContinuity === 'present' ? 'default' : event.memoryContinuity === 'absent' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {event.memoryContinuity}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-muted-foreground max-w-[200px] truncate">{event.notes || event.trigger || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
