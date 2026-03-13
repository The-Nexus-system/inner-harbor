import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Baby, Info } from "lucide-react";

export default function InterfaceModeSettings() {
  const { settings, updateSettings, alters, currentFront, activeInterfaceMode, getAlter } = useSystem();

  const currentAlters = currentFront?.alterIds.map(id => getAlter(id)).filter(Boolean) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Baby className="h-5 w-5" aria-hidden="true" />
          Interface modes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Different system members may need different levels of interface complexity. Younger alters or those with different cognitive needs can have a simplified view.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between tap-target">
          <div className="space-y-0.5">
            <Label htmlFor="auto-switch-interface">Auto-switch when fronting</Label>
            <p className="text-xs text-muted-foreground">
              Automatically simplify the interface when an alter with a simplified mode fronts
            </p>
          </div>
          <Switch
            id="auto-switch-interface"
            checked={settings.autoSwitchInterface}
            onCheckedChange={v => updateSettings({ autoSwitchInterface: v })}
          />
        </div>

        {settings.autoSwitchInterface && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
              <p className="text-sm">
                Current mode: <Badge variant="outline">{activeInterfaceMode}</Badge>
              </p>
            </div>
            {currentAlters.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Based on who is fronting: {currentAlters.map(a => a && `${a.emoji} ${a.name}`).join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Mode descriptions</p>
          <div className="space-y-2 text-sm">
            <div className="p-2.5 rounded border border-border">
              <p className="font-medium">Standard</p>
              <p className="text-xs text-muted-foreground">Full feature set, normal layout and data density</p>
            </div>
            <div className="p-2.5 rounded border border-border">
              <p className="font-medium">Simplified</p>
              <p className="text-xs text-muted-foreground">Reduced features, larger touch targets, simpler language, less data on screen</p>
            </div>
            <div className="p-2.5 rounded border border-border">
              <p className="font-medium">Minimal</p>
              <p className="text-xs text-muted-foreground">Only essential tools — safety, grounding, basic front tracking. Very low cognitive load</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">
          Set each alter's preferred mode in their profile on the System page. This feature can be turned off at any time.
        </p>
      </CardContent>
    </Card>
  );
}
