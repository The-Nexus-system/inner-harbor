import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, ExternalLink, FileDown } from "lucide-react";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { CalendarEventForm } from "@/components/forms/CalendarEventForm";
import { generateICSEvent, generateICSAll, downloadICS, googleCalendarUrl } from "@/lib/ics";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CalendarPage() {
  const { calendarEvents, alters, getAlter, createCalendarEvent, isLoading } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading calendar..." />;

  const getAlterName = (id: string) => getAlter(id)?.name;

  const handleExportAll = () => {
    if (calendarEvents.length === 0) return;
    const ics = generateICSAll(calendarEvents, getAlterName);
    downloadICS(ics, 'mosaic-calendar');
  };

  const handleExportSingle = (event: typeof calendarEvents[0]) => {
    const alterName = event.preferredFronter ? getAlter(event.preferredFronter)?.name : undefined;
    const ics = generateICSEvent(event, alterName);
    downloadICS(ics, `mosaic-${event.title.toLowerCase().replace(/\s+/g, '-')}`);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Upcoming appointments, events, and recurring needs. Plan who fronts and what support is needed.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {calendarEvents.length > 0 && (
            <Button variant="outline" className="gap-2" onClick={handleExportAll}>
              <Download className="h-4 w-4" /> Export all (.ics)
            </Button>
          )}
          <CalendarEventForm alters={alters} onSubmit={createCalendarEvent} />
        </div>
      </header>

      {calendarEvents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No upcoming events. Add appointments and events when you are ready.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {calendarEvents.map(event => {
            const preferred = event.preferredFronter ? getAlter(event.preferredFronter) : null;
            return (
              <Card key={event.id} aria-label={`Event: ${event.title}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                      <CardTitle className="text-base font-heading">{event.title}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                          <ExternalLink className="h-3.5 w-3.5" /> Add to calendar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportSingle(event)}>
                          <FileDown className="h-4 w-4 mr-2" /> Download .ics file
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer">
                            <CalendarDays className="h-4 w-4 mr-2" /> Google Calendar
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString([], { dateStyle: 'full' })}
                    {event.time && ` at ${event.time}`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {preferred && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Preferred fronter:</span>
                      <Badge style={{ backgroundColor: preferred.color, color: '#fff' }}>
                        {preferred.emoji} {preferred.name}
                      </Badge>
                    </div>
                  )}
                  {event.supportNeeded && <p><span className="font-medium">Support needed:</span> {event.supportNeeded}</p>}
                  {event.sensoryPrep && <p><span className="font-medium">Sensory prep:</span> {event.sensoryPrep}</p>}
                  {event.recoveryTime && <p><span className="font-medium">Recovery time:</span> {event.recoveryTime}</p>}
                  {event.transportNotes && <p><span className="font-medium">Transport:</span> {event.transportNotes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
