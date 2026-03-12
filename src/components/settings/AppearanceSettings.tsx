import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import type { ThemeColor } from "@/types/system";
import { cn } from "@/lib/utils";

const THEME_COLORS: { key: ThemeColor; label: string; swatch: string }[] = [
  { key: 'sage', label: 'Sage', swatch: 'hsl(160, 30%, 40%)' },
  { key: 'ocean', label: 'Ocean', swatch: 'hsl(200, 40%, 40%)' },
  { key: 'lavender', label: 'Lavender', swatch: 'hsl(270, 30%, 50%)' },
  { key: 'rose', label: 'Rose', swatch: 'hsl(350, 35%, 50%)' },
  { key: 'amber', label: 'Amber', swatch: 'hsl(35, 50%, 45%)' },
  { key: 'forest', label: 'Forest', swatch: 'hsl(140, 35%, 35%)' },
];

export default function AppearanceSettings() {
  const { settings, updateSettings } = useSystem();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Theme color picker */}
        <div className="space-y-2">
          <Label>Theme color</Label>
          <div className="flex flex-wrap gap-3">
            {THEME_COLORS.map(({ key, label, swatch }) => {
              const isActive = settings.themeColor === key || (!settings.themeColor && key === 'sage');
              return (
                <button
                  key={key}
                  type="button"
                  title={label}
                  aria-label={`${label} theme${isActive ? ' (active)' : ''}`}
                  aria-pressed={isActive}
                  className={cn(
                    "relative w-10 h-10 rounded-full border-2 transition-all tap-target flex items-center justify-center",
                    isActive
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent hover:border-muted-foreground/40 hover:scale-105"
                  )}
                  style={{ backgroundColor: swatch }}
                  onClick={() => updateSettings({ themeColor: key })}
                >
                  {isActive && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              );
            })}
          </div>
        </div>

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
