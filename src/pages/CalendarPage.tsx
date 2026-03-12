import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { CalendarEventForm } from "@/components/forms/CalendarEventForm";

export default function CalendarPage() {
  const { calendarEvents, alters, getAlter, createCalendarEvent, isLoading } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading calendar..." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">Upcoming appointments, events, and recurring needs. Plan who fronts and what support is needed.</p>
        </div>
        <CalendarEventForm alters={alters} onSubmit={createCalendarEvent} />
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
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
                    <CardTitle className="text-base font-heading">{event.title}</CardTitle>
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
