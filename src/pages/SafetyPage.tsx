import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Phone, AlertTriangle } from "lucide-react";
import { PageSkeleton } from "@/components/LoadingSkeleton";
import { SafetyPlanForm } from "@/components/forms/SafetyPlanForm";
import { HospitalCard } from "@/components/HospitalCard";

export default function SafetyPage() {
  const { safetyPlans, createSafetyPlan, isLoading } = useSystem();

  if (isLoading) return <PageSkeleton message="Loading safety plans..." />;

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold">Safety center</h1>
          <p className="text-muted-foreground mt-1">Grounding plans, crisis plans, contacts, and emergency information. Always accessible.</p>
        </div>
        <SafetyPlanForm onSubmit={createSafetyPlan} />
      </header>

      {safetyPlans.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No safety plans yet. Create your first grounding, crisis, or medical plan above.</p>
          </CardContent>
        </Card>
      ) : (
        safetyPlans.map(plan => (
          <Card key={plan.id} aria-label={plan.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                {plan.type === 'crisis' ? <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" /> : <Shield className="h-5 w-5 text-primary" aria-hidden="true" />}
                {plan.title}
              </CardTitle>
              <Badge variant="outline" className="w-fit text-xs">{plan.type}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm mb-2">Steps</h3>
                <ol className="list-decimal list-inside space-y-1.5 text-sm">
                  {plan.steps.map((step, i) => (
                    <li key={i} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>

              {plan.trustedContacts.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1.5">
                    <Phone className="h-4 w-4" aria-hidden="true" /> Trusted contacts
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {plan.trustedContacts.map((contact, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="font-medium">{contact.name}</span>
                        <span className="text-muted-foreground">({contact.relationship})</span>
                        {contact.phone && <a href={`tel:${contact.phone}`} className="text-primary underline tap-target">{contact.phone}</a>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {plan.notes && <p className="text-sm text-muted-foreground italic border-t border-border pt-3">{plan.notes}</p>}
            </CardContent>
          </Card>
        ))
      )}

      {/* Hospital Emergency Card */}
      <HospitalCard />
    </div>
  );
}
