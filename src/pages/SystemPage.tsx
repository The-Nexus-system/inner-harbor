import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/LoadingSkeleton";

export default function SystemPage() {
  const { alters, isLoading } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading system profiles..." />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">System</h1>
        <p className="text-muted-foreground mt-1">Profiles for everyone in the system. Each person defines their own information.</p>
      </header>

      {alters.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No alter profiles yet. They will appear here once created.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alters.map(alter => (
            <Card key={alter.id} className="relative overflow-hidden" aria-label={`Profile: ${alter.name}`}>
              <div className="h-1.5 w-full" style={{ backgroundColor: alter.color || 'hsl(var(--primary))' }} aria-hidden="true" />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                  <span>{alter.emoji}</span>
                  <span>{alter.name}</span>
                  {alter.nickname && <span className="text-sm text-muted-foreground font-normal">({alter.nickname})</span>}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{alter.pronouns}</p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {alter.role && <div><span className="font-medium">Role:</span> <span className="text-muted-foreground">{alter.role}</span></div>}
                {alter.ageRange && <div><span className="font-medium">Age:</span> <span className="text-muted-foreground">{alter.ageRange}</span></div>}
                {alter.species && <div><span className="font-medium">Presentation:</span> <span className="text-muted-foreground">{alter.species}</span></div>}
                {alter.communicationStyle && <div><span className="font-medium">Communication:</span> <span className="text-muted-foreground">{alter.communicationStyle}</span></div>}
                {alter.accessNeeds && <div><span className="font-medium">Access needs:</span> <span className="text-muted-foreground">{alter.accessNeeds}</span></div>}
                {alter.triggersToAvoid && <div><span className="font-medium">Triggers to avoid:</span> <span className="text-destructive">{alter.triggersToAvoid}</span></div>}
                {alter.groundingPreferences && <div><span className="font-medium">Grounding:</span> <span className="text-muted-foreground">{alter.groundingPreferences}</span></div>}
                {alter.safeFoods && <div><span className="font-medium">Safe foods:</span> <span className="text-muted-foreground">{alter.safeFoods}</span></div>}
                {alter.notes && <p className="text-muted-foreground italic border-t border-border pt-2 mt-2">{alter.notes}</p>}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-xs">{alter.visibility}</Badge>
                  {alter.frontingConfidence && <Badge variant="secondary" className="text-xs">Fronting confidence: {alter.frontingConfidence}</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
