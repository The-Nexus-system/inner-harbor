import { useInsights } from "@/hooks/useInsights";
import { defaultInsightPreferences } from "@/lib/insights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Lightbulb, RotateCcw } from "lucide-react";

const DATA_TYPES = [
  { key: 'front_events', label: 'Front events' },
  { key: 'journal_entries', label: 'Journal entries' },
  { key: 'check_ins', label: 'Daily check-ins' },
  { key: 'calendar_events', label: 'Calendar events' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'messages', label: 'Internal messages' },
];

const CATEGORIES = [
  { key: 'switching', label: 'Switching' },
  { key: 'wellbeing', label: 'Wellbeing' },
  { key: 'medical', label: 'Medical' },
  { key: 'environment', label: 'Environment' },
  { key: 'recovery', label: 'Recovery' },
  { key: 'grounding', label: 'Grounding' },
  { key: 'continuity', label: 'Continuity' },
];

export default function InsightSettings() {
  const { preferences: prefs, updatePreferences } = useInsights();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Lightbulb className="h-5 w-5" /> Insights & Summaries
        </CardTitle>
        <p className="text-sm text-muted-foreground">Control what patterns and summaries are shown.</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="insights-enabled">Pattern insights</Label>
          <Switch id="insights-enabled" checked={prefs.insightsEnabled} onCheckedChange={v => updatePreferences({ insightsEnabled: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="summaries-enabled">Daily summaries</Label>
          <Switch id="summaries-enabled" checked={prefs.summariesEnabled} onCheckedChange={v => updatePreferences({ summariesEnabled: v })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="detail-mode">Detail level</Label>
          <Select value={prefs.detailMode} onValueChange={v => updatePreferences({ detailMode: v as 'brief' | 'detailed' })}>
            <SelectTrigger id="detail-mode" className="w-full max-w-xs tap-target">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brief">Brief</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="low-stim">Low stimulation mode</Label>
          <Switch id="low-stim" checked={prefs.lowStimulation} onCheckedChange={v => updatePreferences({ lowStimulation: v })} />
        </div>
        <div className="flex items-center justify-between tap-target">
          <Label htmlFor="include-location">Include location data</Label>
          <Switch id="include-location" checked={prefs.includeLocation} onCheckedChange={v => updatePreferences({ includeLocation: v })} />
        </div>

        {/* Data type exclusions */}
        <div className="space-y-3">
          <Label>Exclude from analysis</Label>
          <p className="text-xs text-muted-foreground">Uncheck data types you do not want included in pattern detection or summaries.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DATA_TYPES.map(dt => {
              const excluded = prefs.excludedDataTypes ?? [];
              const isExcluded = excluded.includes(dt.key);
              return (
                <div key={dt.key} className="flex items-center gap-2 tap-target">
                  <Checkbox
                    id={`exclude-${dt.key}`}
                    checked={!isExcluded}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? excluded.filter(k => k !== dt.key)
                        : [...excluded, dt.key];
                      updatePreferences({ excludedDataTypes: next });
                    }}
                  />
                  <Label htmlFor={`exclude-${dt.key}`} className="text-sm font-normal cursor-pointer">{dt.label}</Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category suppression */}
        <div className="space-y-3">
          <Label>Show insight categories</Label>
          <p className="text-xs text-muted-foreground">Uncheck categories you do not want to see in your insights.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CATEGORIES.map(cat => {
              const suppressed = prefs.suppressedCategories ?? [];
              const isSuppressed = suppressed.includes(cat.key);
              return (
                <div key={cat.key} className="flex items-center gap-2 tap-target">
                  <Checkbox
                    id={`cat-${cat.key}`}
                    checked={!isSuppressed}
                    onCheckedChange={(checked) => {
                      const next = checked
                        ? suppressed.filter(k => k !== cat.key)
                        : [...suppressed, cat.key];
                      updatePreferences({ suppressedCategories: next });
                    }}
                  />
                  <Label htmlFor={`cat-${cat.key}`} className="text-sm font-normal cursor-pointer">{cat.label}</Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset to defaults */}
        <div className="pt-2 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset insight preferences?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will restore all insight and summary settings to their defaults, including data type exclusions and category filters.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updatePreferences(defaultInsightPreferences)}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
