import { useSystem } from '@/contexts/SystemContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, CreditCard, Phone, AlertTriangle } from 'lucide-react';

export function HospitalCard() {
  const { safetyPlans, alters } = useSystem();

  const hospitalPlan = safetyPlans.find(p => p.type === 'hospital-card');
  const crisisPlan = safetyPlans.find(p => p.type === 'crisis');
  const seizurePlan = safetyPlans.find(p => p.type === 'seizure');
  const medicalPlan = safetyPlans.find(p => p.type === 'medical');

  // Gather all trusted contacts across plans
  const allContacts = safetyPlans.flatMap(p => p.trustedContacts);
  const uniqueContacts = allContacts.filter((c, i, arr) =>
    arr.findIndex(x => x.name === c.name && x.phone === c.phone) === i
  );

  // Gather communication styles from alters
  const commStyles = alters
    .filter(a => a.isActive && a.communicationStyle)
    .map(a => ({ name: a.name, style: a.communicationStyle! }));

  const hasContent = hospitalPlan || uniqueContacts.length > 0 || seizurePlan || medicalPlan;

  if (!hasContent) {
    return (
      <Card className="border-dashed" aria-label="Hospital emergency card">
        <CardContent className="py-8 text-center">
          <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground text-sm">
            Create a "Hospital card" safety plan and add trusted contacts to generate your emergency card.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="print:hidden flex items-center justify-between">
        <h2 className="text-lg font-heading font-bold flex items-center gap-2">
          <CreditCard className="h-5 w-5" aria-hidden="true" /> Emergency card
        </h2>
        <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1">
          <Printer className="h-4 w-4" /> Print card
        </Button>
      </div>

      <Card className="print:shadow-none print:border-2 print:border-black" aria-label="Printable emergency card" id="hospital-card">
        <CardHeader className="pb-2 print:pb-1">
          <CardTitle className="text-base font-heading flex items-center gap-2 print:text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive print:text-black" aria-hidden="true" />
            EMERGENCY INFORMATION
          </CardTitle>
          <p className="text-xs text-muted-foreground print:text-black">This person has a dissociative condition. Please be patient and gentle.</p>
        </CardHeader>
        <CardContent className="space-y-3 text-sm print:text-xs">
          {hospitalPlan && hospitalPlan.steps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Key information</h3>
              <ul className="list-disc list-inside space-y-0.5">
                {hospitalPlan.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {seizurePlan && (
            <div>
              <h3 className="font-semibold mb-1 text-destructive print:text-black">⚠️ Seizure protocol</h3>
              <ol className="list-decimal list-inside space-y-0.5">
                {seizurePlan.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ol>
            </div>
          )}

          {medicalPlan && medicalPlan.steps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Medical notes</h3>
              <ul className="list-disc list-inside space-y-0.5">
                {medicalPlan.steps.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {commStyles.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Communication</h3>
              <ul className="space-y-0.5">
                {commStyles.map((c, i) => (
                  <li key={i}><span className="font-medium">{c.name}:</span> {c.style}</li>
                ))}
              </ul>
            </div>
          )}

          {uniqueContacts.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-1">
                <Phone className="h-3 w-3" aria-hidden="true" /> Emergency contacts
              </h3>
              <ul className="space-y-0.5">
                {uniqueContacts.map((c, i) => (
                  <li key={i}>
                    <span className="font-medium">{c.name}</span> ({c.relationship})
                    {c.phone && <> — <a href={`tel:${c.phone}`} className="underline print:no-underline">{c.phone}</a></>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hospitalPlan?.notes && (
            <p className="italic border-t border-border pt-2 print:border-black">{hospitalPlan.notes}</p>
          )}
        </CardContent>
      </Card>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #hospital-card, #hospital-card * { visibility: visible; }
          #hospital-card { position: absolute; left: 0; top: 0; width: 100%; max-width: 400px; }
        }
      `}</style>
    </>
  );
}
