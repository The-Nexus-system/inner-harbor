import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin } from "lucide-react";

export default function MessagesPage() {
  const { messages, getAlter, markMessageRead } = useSystem();

  const sorted = [...messages].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Messages</h1>
        <p className="text-muted-foreground mt-1">Internal message board. Leave notes, reminders, and support for each other.</p>
      </header>

      <div className="space-y-3">
        {sorted.map(msg => {
          const from = msg.fromAlterId ? getAlter(msg.fromAlterId) : null;
          const toAlters = msg.toAlterIds.map(id => getAlter(id)).filter(Boolean);
          return (
            <Card
              key={msg.id}
              className={`${!msg.isRead ? 'border-l-4 border-l-primary' : ''}`}
              aria-label={`Message from ${from?.name || 'unknown'}`}
              onClick={() => !msg.isRead && markMessageRead(msg.id)}
              role="article"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-heading flex items-center gap-2">
                    {from && (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: from.color }} aria-hidden="true" />
                        {from.emoji} {from.name}
                      </>
                    )}
                    {msg.isPinned && <Pin className="h-3.5 w-3.5 text-primary" aria-label="Pinned message" />}
                  </CardTitle>
                  <div className="flex gap-1.5">
                    {msg.priority !== 'normal' && (
                      <Badge variant={msg.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                        {msg.priority}
                      </Badge>
                    )}
                    {!msg.isRead && <Badge className="bg-primary text-primary-foreground text-xs">New</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time>{new Date(msg.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time>
                  {toAlters.length > 0 ? (
                    <span>→ {toAlters.map(a => a?.name).join(', ')}</span>
                  ) : (
                    <span>→ Everyone</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
