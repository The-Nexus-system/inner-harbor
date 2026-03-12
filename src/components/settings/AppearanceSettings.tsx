import { useState, useEffect, useCallback } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Check, Palette } from "lucide-react";
import type { ThemeColor } from "@/types/system";
import { cn } from "@/lib/utils";

function tryParseHslString(input: string): [number, number, number] | null {
  // Accepts: "200 40% 40%", "hsl(200, 40%, 40%)", "200, 40, 40", etc.
  const nums = input.replace(/hsl\(|\)|°|%|,/g, ' ').trim().split(/\s+/).map(Number);
  if (nums.length < 3 || nums.some(isNaN)) return null;
  const [h, s, l] = nums;
  if (h < 0 || h > 360 || s < 0 || s > 100 || l < 0 || l > 100) return null;
  return [Math.round(h), Math.round(Math.max(10, Math.min(80, s))), Math.round(Math.max(20, Math.min(60, l)))];
}

const THEME_COLORS: { key: ThemeColor; label: string; swatch: string }[] = [
  { key: 'sage', label: 'Sage', swatch: 'hsl(160, 30%, 40%)' },
  { key: 'ocean', label: 'Ocean', swatch: 'hsl(200, 40%, 40%)' },
  { key: 'lavender', label: 'Lavender', swatch: 'hsl(270, 30%, 50%)' },
  { key: 'rose', label: 'Rose', swatch: 'hsl(350, 35%, 50%)' },
  { key: 'amber', label: 'Amber', swatch: 'hsl(35, 50%, 45%)' },
  { key: 'forest', label: 'Forest', swatch: 'hsl(140, 35%, 35%)' },
];

function parseHsl(hsl: string | undefined): [number, number, number] {
  if (!hsl) return [200, 40, 40];
  const parts = hsl.replace(/%/g, '').split(/\s+/).map(Number);
  return [parts[0] ?? 200, parts[1] ?? 40, parts[2] ?? 40];
}

function formatHsl(h: number, s: number, l: number): string {
  return `${h} ${s}% ${l}%`;
}

export default function AppearanceSettings() {
  const { settings, updateSettings } = useSystem();

  const isCustom = settings.themeColor === 'custom';
  const [hsl, setHsl] = useState<[number, number, number]>(() => parseHsl(settings.customThemeHsl));

  // Sync local state when settings load from DB
  useEffect(() => {
    if (settings.customThemeHsl) {
      setHsl(parseHsl(settings.customThemeHsl));
    }
  }, [settings.customThemeHsl]);

  // Debounced save for slider changes
  const [saveTimeout, setSaveTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const saveCustomHsl = useCallback((h: number, s: number, l: number) => {
    const value = formatHsl(h, s, l);
    // Apply immediately via inline style for live preview
    const el = document.documentElement;
    el.style.setProperty('--primary', value);
    el.style.setProperty('--ring', value);
    el.style.setProperty('--sidebar-primary', value);
    el.style.setProperty('--sidebar-ring', value);
    // Debounce the DB save
    if (saveTimeout) clearTimeout(saveTimeout);
    const t = setTimeout(() => {
      updateSettings({ themeColor: 'custom', customThemeHsl: value });
    }, 400);
    setSaveTimeout(t);
  }, [updateSettings, saveTimeout]);

  const handleSliderChange = (index: 0 | 1 | 2, value: number) => {
    const next: [number, number, number] = [...hsl];
    next[index] = value;
    setHsl(next);
    saveCustomHsl(next[0], next[1], next[2]);
  };

  const handlePresetClick = (key: ThemeColor) => {
    if (key === 'custom') return;
    updateSettings({ themeColor: key });
  };

  const handleCustomClick = () => {
    const value = formatHsl(hsl[0], hsl[1], hsl[2]);
    updateSettings({ themeColor: 'custom', customThemeHsl: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Theme color picker */}
        <div className="space-y-3">
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
                  onClick={() => handlePresetClick(key)}
                >
                  {isActive && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              );
            })}
            {/* Custom swatch */}
            <button
              type="button"
              title="Custom"
              aria-label={`Custom theme${isCustom ? ' (active)' : ''}`}
              aria-pressed={isCustom}
              className={cn(
                "relative w-10 h-10 rounded-full border-2 transition-all tap-target flex items-center justify-center",
                isCustom
                  ? "border-foreground scale-110 shadow-md"
                  : "border-transparent hover:border-muted-foreground/40 hover:scale-105"
              )}
              style={{
                background: isCustom
                  ? `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`
                  : `conic-gradient(from 0deg, hsl(0,50%,50%), hsl(60,50%,50%), hsl(120,50%,50%), hsl(180,50%,50%), hsl(240,50%,50%), hsl(300,50%,50%), hsl(360,50%,50%))`,
              }}
              onClick={handleCustomClick}
            >
              {isCustom
                ? <Check className="h-4 w-4 text-white drop-shadow-md" />
                : <Palette className="h-4 w-4 text-white drop-shadow-md" />
              }
            </button>
          </div>

          {/* Custom HSL sliders */}
          {isCustom && (
            <div className="space-y-4 pt-2 pl-1 pr-1 animate-fade-in">
              <div
                className="h-8 rounded-lg border border-border"
                style={{ backgroundColor: `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)` }}
                aria-hidden
              />
              <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="hsl-input" className="text-xs text-muted-foreground">HSL value</Label>
                <Input
                  id="hsl-input"
                  placeholder="e.g. 200 40% 40% or hsl(200, 40%, 40%)"
                  value={`${hsl[0]} ${hsl[1]}% ${hsl[2]}%`}
                  onChange={(e) => {
                    const parsed = tryParseHslString(e.target.value);
                    if (parsed) {
                      setHsl(parsed);
                      saveCustomHsl(parsed[0], parsed[1], parsed[2]);
                    }
                  }}
                  className="font-mono text-sm"
                  aria-label="HSL color value"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label className="text-xs text-muted-foreground">Hue</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">{hsl[0]}°</span>
                </div>
                  <Slider
                    min={0}
                    max={360}
                    step={1}
                    value={[hsl[0]]}
                    onValueChange={([v]) => handleSliderChange(0, v)}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    aria-label="Hue"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Saturation</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{hsl[1]}%</span>
                  </div>
                  <Slider
                    min={10}
                    max={80}
                    step={1}
                    value={[hsl[1]]}
                    onValueChange={([v]) => handleSliderChange(1, v)}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    aria-label="Saturation"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="text-xs text-muted-foreground">Lightness</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">{hsl[2]}%</span>
                  </div>
                  <Slider
                    min={20}
                    max={60}
                    step={1}
                    value={[hsl[2]]}
                    onValueChange={([v]) => handleSliderChange(2, v)}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    aria-label="Lightness"
                  />
                </div>
              </div>
            </div>
          )}
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
