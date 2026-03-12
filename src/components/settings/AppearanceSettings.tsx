import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AppearanceSettings() {
  const { settings, updateSettings } = useSystem();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="dark-mode">Dark mode</Label>
          <Switch id="dark-mode" checked={settings.darkMode} onCheckedChange={v => updateSettings({ darkMode: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="high-contrast">High contrast</Label>
          <Switch id="high-contrast" checked={settings.highContrast} onCheckedChange={v => updateSettings({ highContrast: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="reduced-motion">Reduced motion</Label>
          <Switch id="reduced-motion" checked={settings.reducedMotion} onCheckedChange={v => updateSettings({ reducedMotion: v })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="font-size">Font size</Label>
          <Select value={settings.fontSize} onValueChange={v => updateSettings({ fontSize: v as any })}>
            <SelectTrigger id="font-size" className="w-full max-w-xs tap-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
              <SelectItem value="xlarge">Extra large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
