import { useState, useEffect } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, MessageSquare, BookOpen, Shield, CalendarDays, HandHeart } from "lucide-react";
import { DailyCheckInWidget } from "@/components/DailyCheckInWidget";
import { CheckInTrends } from "@/components/CheckInTrends";
import { QuickNotesWidget } from "@/components/QuickNotesWidget";
import { InsightCard } from "@/components/InsightCard";
import { DailySummaryCard } from "@/components/DailySummaryCard";
import { ContextSnapshotButton } from "@/components/ContextSnapshotButton";
import { Link } from "react-router-dom";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const moodLabels = ['', 'Very low', 'Low', 'Moderate', 'Good', 'Great'];

export default function Dashboard() {
  const { currentFront, getAlter, alters, tasks, messages, journalEntries, calendarEvents, safetyPlans, handoffNotes, isLoading } = useSystem();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, system_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || data?.system_name || null);
      });
  }, [user]);

  if (isLoading) return <PageSkeleton message="Loading your dashboard..." />;

  const currentAlters = currentFront?.alterIds.map(id => getAlter(id)).filter(Boolean) || [];
  const todayTasks = tasks.filter(t => !t.isCompleted);
  const unreadMessages = messages.filter(m => !m.isRead);
  const recentJournal = journalEntries.slice(0, 2);
  const todayEvents = calendarEvents.slice(0, 2);

  const greeting = displayName ? `Welcome back, ${displayName}` : "Welcome back";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{greeting}. Here is what is happening today.</p>
      </header>

      {/* Current Front */}
      <Card aria-label="Current fronter information">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-heading">Who is here right now</CardTitle>
        </CardHeader>
        <CardContent>
          {currentAlters.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {currentAlters.map(alter => alter && (
                <div key={alter.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: alter.color || 'hsl(var(--primary))' }} aria-hidden="true" />
                  <span className="font-medium">{alter.emoji} {alter.name}</span>
                  <span className="text-sm text-muted-foreground">({alter.pronouns})</span>
                </div>
              ))}
              {currentFront && (
                <Badge variant="outline" className="self-center">
                  {currentFront.status === 'co-fronting' ? 'Co-fronting' : 'Fronting'}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No fronter set. <Link to="/front" className="text-primary underline">Set who is here</Link></p>
          )}
        </CardContent>
      </Card>

      {/* Insight + Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard />
        <DailySummaryCard />
      </div>

      {/* Grid of widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyCheckInWidget />
        <QuickNotesWidget />

        <Card aria-label="Today's tasks">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <CheckSquare className="h-5 w-5" aria-hidden="true" /> Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayTasks.length > 0 ? (
              <ul className="space-y-2" role="list">
                {todayTasks.slice(0, 4).map(task => (
                  <li key={task.id} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
                    <span>{task.title}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">{task.category}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No tasks yet. Add some from the Tasks page.</p>
            )}
            <Link to="/tasks" className="text-sm text-primary underline mt-3 inline-block tap-target">View all tasks</Link>
          </CardContent>
        </Card>

        <Card aria-label="Internal messages">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <MessageSquare className="h-5 w-5" aria-hidden="true" /> Messages
              {unreadMessages.length > 0 && <Badge className="bg-primary text-primary-foreground">{unreadMessages.length} new</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length > 0 ? (
              <ul className="space-y-3" role="list">
                {messages.slice(0, 3).map(msg => {
                  const from = msg.fromAlterId ? getAlter(msg.fromAlterId) : null;
                  return (
                    <li key={msg.id} className="text-sm space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {from && <span className="font-medium" style={{ color: from.color }}>{from.emoji} {from.name}</span>}
                        {msg.isPinned && <Badge variant="outline" className="text-xs">Pinned</Badge>}
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            )}
            <Link to="/messages" className="text-sm text-primary underline mt-3 inline-block tap-target">View all messages</Link>
          </CardContent>
        </Card>

        <Card aria-label="Recent journal entries">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5" aria-hidden="true" /> Journal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentJournal.length > 0 ? (
              <ul className="space-y-3" role="list">
                {recentJournal.map(entry => {
                  const author = entry.alterId ? getAlter(entry.alterId) : null;
                  return (
                    <li key={entry.id} className="text-sm space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {author ? (
                          <span className="font-medium" style={{ color: author.color }}>{author.emoji} {author.name}</span>
                        ) : (
                          <span className="font-medium text-muted-foreground">Unknown fronter</span>
                        )}
                        {entry.type === 'victory' && <Badge className="bg-safe text-safe-foreground text-xs">Victory</Badge>}
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{entry.content}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No journal entries yet.</p>
            )}
            <Link to="/journal" className="text-sm text-primary underline mt-3 inline-block tap-target">View journal</Link>
          </CardContent>
        </Card>

        <Card aria-label="Upcoming events">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <CalendarDays className="h-5 w-5" aria-hidden="true" /> Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length > 0 ? (
              <ul className="space-y-2" role="list">
                {todayEvents.map(event => (
                  <li key={event.id} className="text-sm flex items-center gap-2">
                    <span className="font-medium">{event.time}</span>
                    <span>{event.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No events today.</p>
            )}
            <Link to="/calendar" className="text-sm text-primary underline mt-3 inline-block tap-target">View calendar</Link>
          </CardContent>
        </Card>

        <Card aria-label="Safety quick access">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Shield className="h-5 w-5" aria-hidden="true" /> Safety
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safetyPlans.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {safetyPlans.map(plan => (
                  <Link key={plan.id} to="/safety" className="tap-target">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">{plan.title}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No safety plans yet.</p>
            )}
            <div className="flex gap-3 mt-3">
              <Link to="/safety" className="text-sm text-primary underline tap-target">Open safety center</Link>
              <Link to="/grounding" className="text-sm text-primary underline tap-target">Grounding toolbox</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-in trends - full width */}
      <CheckInTrends />
    </div>
  );
}
