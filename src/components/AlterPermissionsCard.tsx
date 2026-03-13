import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";
import type { PermissionScope } from "@/types/system";

const SCOPES: { scope: PermissionScope; label: string; description: string }[] = [
  { scope: 'edit_safety_plans', label: 'Edit safety plans', description: 'Create or modify crisis and grounding plans' },
  { scope: 'edit_system_agreements', label: 'Edit system agreements', description: 'Modify shared system rules and agreements' },
  { scope: 'modify_integrations', label: 'Modify integrations', description: 'Connect or disconnect external services' },
  { scope: 'manage_calendar', label: 'Manage calendar', description: 'Add, edit, or remove calendar events' },
  { scope: 'modify_alter_profiles', label: 'Modify alter profiles', description: 'Edit profiles of other system members' },
  { scope: 'manage_settings', label: 'Manage settings', description: 'Change app settings and preferences' },
  { scope: 'manage_support_portal', label: 'Manage support portal', description: 'Control external support access' },
];

export function AlterPermissionsCard({ alterId }: { alterId: string }) {
  const { alterPermissions, setAlterPermission, getAlter } = useSystem();
  const alter = getAlter(alterId);
  if (!alter) return null;

  const getPermState = (scope: PermissionScope): boolean => {
    const perm = alterPermissions.find(p => p.alterId === alterId && p.scope === scope);
    return perm ? perm.granted : true; // default: allowed
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-heading flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Permissions for {alter.emoji} {alter.name}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          These are optional. By default everyone has full access. Restrictions are gentle boundaries, not locks — emergency overrides always apply.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {SCOPES.map(({ scope, label, description }) => (
          <div key={scope} className="flex items-start justify-between gap-3 py-1.5">
            <div className="space-y-0.5 min-w-0">
              <Label htmlFor={`perm-${alterId}-${scope}`} className="text-sm font-medium">{label}</Label>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Switch
              id={`perm-${alterId}-${scope}`}
              checked={getPermState(scope)}
              onCheckedChange={(checked) => setAlterPermission(alterId, scope, checked)}
              aria-label={`${label} for ${alter.name}`}
            />
          </div>
        ))}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            🛟 Safety note: Permissions never lock anyone out of recovery or grounding tools. These are cooperative boundaries, not restrictions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
