import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AccessibilitySettings() {
  const { settings, updateSettings } = useSystem();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Accessibility</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="plain-language">Plain language mode</Label>
          <Switch id="plain-language" checked={settings.plainLanguage} onCheckedChange={v => updateSettings({ plainLanguage: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="sound-off">Sound off by default</Label>
          <Switch id="sound-off" checked={settings.soundOff} onCheckedChange={v => updateSettings({ soundOff: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="screen-reader">Screen reader optimization</Label>
          <Switch id="screen-reader" checked={settings.screenReaderOptimized} onCheckedChange={v => updateSettings({ screenReaderOptimized: v })} />
        </div>
      </CardContent>
    </Card>
  );
}
