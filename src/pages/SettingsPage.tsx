import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileJson, Check, Bell, BellOff, Lightbulb } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useInsights } from "@/hooks/useInsights";
import {
  exportAsText, exportAsJson,
  formatJournalForExport, formatFrontHistoryForExport, formatSafetyPlanForExport,
} from "@/lib/export";

function formatTasksForExport(tasks: Array<{ title: string; description?: string; category: string; assignedTo: string; isCompleted: boolean; dueDate?: string; createdAt: string }>) {
  const lines = ['MOSAIC — Tasks Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const t of tasks) {
    lines.push(`[${t.isCompleted ? 'x' : ' '}] ${t.title}`);
    if (t.description) lines.push(`    ${t.description}`);
    lines.push(`    Category: ${t.category} | Assigned: ${t.assignedTo}${t.dueDate ? ` | Due: ${t.dueDate}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

type ExportKey = 'journal' | 'front' | 'tasks' | 'safety';

export default function SettingsPage() {
  const { settings, updateSettings, journalEntries, frontEvents, tasks, safetyPlans, alters, getAlter } = useSystem();
  const { isSupported, permission, isSubscribed, isLoading: notifLoading, enableNotifications, disableNotifications } = useNotifications();
  const { preferences: insightPrefs, updatePreferences } = useInsights();
  const [exported, setExported] = useState<Record<string, boolean>>({});

  const flash = (key: string) => {
    setExported(p => ({ ...p, [key]: true }));
    setTimeout(() => setExported(p => ({ ...p, [key]: false })), 2000);
  };

  const handleExport = (key: ExportKey, format: 'text' | 'json') => {
    const date = new Date().toISOString().split('T')[0];

    if (key === 'journal') {
      const data = journalEntries.map(e => ({ ...e, authorName: e.alterId ? getAlter(e.alterId)?.name : undefined }));
      if (format === 'json') exportAsJson(data, `mosaic-journal-${date}`);
      else exportAsText(formatJournalForExport(data), `mosaic-journal-${date}`);
    } else if (key === 'front') {
      const data = frontEvents.map(e => ({ ...e, alterNames: e.alterIds.map(id => getAlter(id)?.name || 'Unknown') }));
      if (format === 'json') exportAsJson(data, `mosaic-front-history-${date}`);
      else exportAsText(formatFrontHistoryForExport(data), `mosaic-front-history-${date}`);
    } else if (key === 'tasks') {
      if (format === 'json') exportAsJson(tasks, `mosaic-tasks-${date}`);
      else exportAsText(formatTasksForExport(tasks), `mosaic-tasks-${date}`);
    } else if (key === 'safety') {
      if (format === 'json') exportAsJson(safetyPlans, `mosaic-safety-plans-${date}`);
      else exportAsText(formatSafetyPlanForExport(safetyPlans), `mosaic-safety-plans-${date}`);
    }

    flash(`${key}-${format}`);
  };

  const exportItems: { key: ExportKey; label: string; count: number }[] = [
    { key: 'journal', label: 'Journal entries', count: journalEntries.length },
    { key: 'front', label: 'Front history', count: frontEvents.length },
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'safety', label: 'Safety plans', count: safetyPlans.length },
  ];

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize how the app looks, feels, and behaves. Your comfort matters.</p>
      </header>

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

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Get reminded about upcoming tasks and calendar events.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupported ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <BellOff className="h-4 w-4" />
              <p>Push notifications are not supported in this browser. Try installing the app or using a different browser.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between tap-target">
                <div>
                  <Label htmlFor="push-notifications">Push notifications</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isSubscribed
                      ? 'You will receive reminders for tasks and events.'
                      : permission === 'denied'
                        ? 'Notifications are blocked. Please enable them in your browser settings.'
                        : 'Enable to receive task and calendar reminders.'}
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={isSubscribed}
                  onCheckedChange={handleNotificationToggle}
                  disabled={notifLoading || permission === 'denied'}
                />
              </div>
              {isSubscribed && (
                <p className="text-xs text-muted-foreground">
                  Set reminder times when creating or editing tasks and calendar events.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Download className="h-5 w-5" /> Data Export
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Download your data at any time. Your information belongs to you.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportItems.map(({ key, label, count }) => (
            <div key={key} className="flex items-center justify-between flex-wrap gap-2 py-2 border-b border-border last:border-0">
              <div>
                <span className="font-medium">{label}</span>
                <span className="text-sm text-muted-foreground ml-2">({count} {count === 1 ? 'item' : 'items'})</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={count === 0}
                  onClick={() => handleExport(key, 'text')}
                  aria-label={`Export ${label} as text`}
                >
                  {exported[`${key}-text`] ? <Check className="h-3.5 w-3.5 text-green-600" /> : <FileText className="h-3.5 w-3.5" />}
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={count === 0}
                  onClick={() => handleExport(key, 'json')}
                  aria-label={`Export ${label} as JSON`}
                >
                  {exported[`${key}-json`] ? <Check className="h-3.5 w-3.5 text-green-600" /> : <FileJson className="h-3.5 w-3.5" />}
                  JSON
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
