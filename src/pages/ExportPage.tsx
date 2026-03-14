import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useSystem } from "@/contexts/SystemContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download, FileText, FileJson, FileSpreadsheet, Printer, Heart,
  CalendarIcon, Eye, Save, FolderOpen, AlertTriangle, Lock, Upload, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit";
import { encryptBackup } from "@/lib/backup-crypto";
import ImportRestoreSection from "@/components/ImportRestoreSection";
import {
  exportAsText, exportAsJson, exportAsCsv, exportAsHtml,
  formatJournalForExport, journalToCsvRows,
  formatFrontHistoryForExport, frontHistoryToCsvRows,
  formatSafetyPlanForExport,
  formatTasksForExport, tasksToCsvRows,
  formatAltersForExport,
  formatCalendarForExport, calendarToCsvRows,
  formatCheckInsForExport, checkInsToCsvRows,
  formatHandoffNotesForExport,
  formatMessagesForExport,
  generateTherapySummary,
  generatePrintableReport,
} from "@/lib/export";

// ─── Types ──────────────────────────────────────────────────
type RecordType =
  | 'alters' | 'front' | 'journal' | 'messages' | 'tasks'
  | 'calendar' | 'safety' | 'checkins' | 'handoffs'
  | 'snapshots' | 'medications';

type ExportFormat = 'text' | 'json' | 'json-encrypted' | 'csv' | 'printable' | 'therapy';

interface ExportPreset {
  id: string;
  name: string;
  recordTypes: RecordType[];
  format: ExportFormat;
  includePrivateNotes: boolean;
  includeMetadata: boolean;
}

const RECORD_LABELS: Record<RecordType, string> = {
  alters: 'Alter profiles',
  front: 'Front timeline',
  journal: 'Journal entries',
  messages: 'Internal messages',
  tasks: 'Tasks',
  calendar: 'Calendar events',
  safety: 'Safety plans',
  checkins: 'Daily check-ins',
  handoffs: 'Handoff notes',
  snapshots: 'Context snapshots',
  medications: 'Medications',
};

const FORMAT_OPTIONS: { value: ExportFormat; label: string; icon: typeof FileText; desc: string }[] = [
  { value: 'text', label: 'Plain text', icon: FileText, desc: 'Accessible, readable by any device' },
  { value: 'json', label: 'JSON', icon: FileJson, desc: 'Structured data, good for backups' },
  { value: 'json-encrypted', label: 'Encrypted JSON', icon: Lock, desc: 'Password-protected backup (AES-256-GCM)' },
  { value: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'Spreadsheet-compatible tables' },
  { value: 'printable', label: 'Printable report', icon: Printer, desc: 'Clean HTML for printing' },
  { value: 'therapy', label: 'Therapy summary', icon: Heart, desc: 'Aggregated overview for sessions' },
];

const ALL_RECORD_TYPES: RecordType[] = [
  'alters', 'front', 'journal', 'messages', 'tasks',
  'calendar', 'safety', 'checkins', 'handoffs', 'snapshots', 'medications',
];

// ─── Component ──────────────────────────────────────────────
export default function ExportPage() {
  const { user } = useAuth();
  const {
    alters, frontEvents, journalEntries, messages, tasks,
    calendarEvents, safetyPlans, handoffNotes,
    contextSnapshots, medications, getAlter,
  } = useSystem();

  // Check-ins need a separate query since context only has today's
  const [allCheckIns, setAllCheckIns] = useState<Array<{
    date: string; mood: number; stress: number; pain: number;
    fatigue: number; dissociation: number; notes?: string;
  }>>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('daily_check_ins').select('*').eq('user_id', user.id)
      .order('check_date', { ascending: false }).limit(365)
      .then(({ data }) => {
        if (data) setAllCheckIns(data.map(r => ({
          date: r.check_date, mood: r.mood, stress: r.stress,
          pain: r.pain, fatigue: r.fatigue, dissociation: r.dissociation,
          notes: r.notes ?? undefined,
        })));
      });
  }, [user]);

  // ─── State ──────────────────────────────────────────────
  const [selectedTypes, setSelectedTypes] = useState<RecordType[]>(['journal', 'front', 'tasks']);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('text');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<ExportPreset[]>([]);
  const [savePresetOpen, setSavePresetOpen] = useState(false);
  const [encryptPassword, setEncryptPassword] = useState('');
  const [encryptConfirm, setEncryptConfirm] = useState('');
  const [exporting, setExporting] = useState(false);
  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('mosaic-export-presets');
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const savePresetsToStorage = useCallback((presets: ExportPreset[]) => {
    setSavedPresets(presets);
    localStorage.setItem('mosaic-export-presets', JSON.stringify(presets));
  }, []);

  // ─── Date filtering ────────────────────────────────────
  const inRange = useCallback((dateStr: string) => {
    if (!dateFrom && !dateTo) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  }, [dateFrom, dateTo]);

  // ─── Filtered data ─────────────────────────────────────
  const filteredData = useMemo(() => ({
    alters: alters.filter(a => a.isActive),
    front: frontEvents.filter(e => inRange(e.startTime)),
    journal: journalEntries.filter(e => inRange(e.createdAt)),
    messages: messages.filter(m => inRange(m.createdAt)),
    tasks: tasks.filter(t => inRange(t.createdAt)),
    calendar: calendarEvents.filter(e => inRange(e.date)),
    safety: safetyPlans,
    checkins: allCheckIns.filter(c => inRange(c.date)),
    handoffs: handoffNotes.filter(h => inRange(h.createdAt)),
    snapshots: contextSnapshots.filter(s => inRange(s.createdAt)),
    medications: medications.filter(m => m.isActive),
  }), [alters, frontEvents, journalEntries, messages, tasks, calendarEvents, safetyPlans, allCheckIns, handoffNotes, contextSnapshots, medications, inRange]);

  const totalRecords = useMemo(() =>
    selectedTypes.reduce((sum, type) => sum + (filteredData[type]?.length || 0), 0),
    [selectedTypes, filteredData]
  );

  // ─── Toggle helpers ────────────────────────────────────
  const toggleType = (type: RecordType) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => setSelectedTypes([...ALL_RECORD_TYPES]);
  const selectNone = () => setSelectedTypes([]);

  // ─── Generate export content ───────────────────────────
  const generateContent = useCallback((): string => {
    const sections: Array<{ title: string; content: string }> = [];

    if (selectedTypes.includes('alters')) {
      sections.push({
        title: 'Alter Profiles',
        content: formatAltersForExport(filteredData.alters, includePrivateNotes),
      });
    }

    if (selectedTypes.includes('front')) {
      const mapped = filteredData.front.map(e => ({
        ...e, alterNames: e.alterIds.map(id => getAlter(id)?.name || 'Unknown'),
      }));
      sections.push({ title: 'Front Timeline', content: formatFrontHistoryForExport(mapped) });
    }

    if (selectedTypes.includes('journal')) {
      const mapped = filteredData.journal.map(e => ({
        ...e, authorName: e.alterId ? getAlter(e.alterId)?.name : undefined,
      }));
      sections.push({ title: 'Journal Entries', content: formatJournalForExport(mapped) });
    }

    if (selectedTypes.includes('messages')) {
      const mapped = filteredData.messages.map(m => ({
        ...m,
        fromName: m.fromAlterId ? getAlter(m.fromAlterId)?.name : undefined,
        toNames: m.toAlterIds.map(id => getAlter(id)?.name || 'Unknown'),
      }));
      sections.push({ title: 'Internal Messages', content: formatMessagesForExport(mapped) });
    }

    if (selectedTypes.includes('tasks')) {
      sections.push({ title: 'Tasks', content: formatTasksForExport(filteredData.tasks) });
    }

    if (selectedTypes.includes('calendar')) {
      sections.push({ title: 'Calendar Events', content: formatCalendarForExport(filteredData.calendar) });
    }

    if (selectedTypes.includes('safety')) {
      sections.push({ title: 'Safety Plans', content: formatSafetyPlanForExport(filteredData.safety) });
    }

    if (selectedTypes.includes('checkins')) {
      sections.push({ title: 'Daily Check-ins', content: formatCheckInsForExport(filteredData.checkins) });
    }

    if (selectedTypes.includes('handoffs')) {
      sections.push({ title: 'Handoff Notes', content: formatHandoffNotesForExport(filteredData.handoffs) });
    }

    return sections.map(s => `\n${'═'.repeat(40)}\n${s.title}\n${'═'.repeat(40)}\n\n${s.content}`).join('\n');
  }, [selectedTypes, filteredData, includePrivateNotes, getAlter]);

  // ─── Preview ───────────────────────────────────────────
  const handlePreview = () => {
    if (selectedTypes.length === 0) { toast.error("Please select at least one record type."); return; }
    const content = generateContent();
    setPreviewContent(content);
    setPreviewOpen(true);
  };

  // ─── Export ────────────────────────────────────────────
  const handleExport = async () => {
    if (selectedTypes.length === 0) { toast.error("Please select at least one record type."); return; }

    if (selectedFormat === 'json-encrypted' && encryptPassword.length < 8) {
      toast.error("Please enter a password of at least 8 characters."); return;
    }
    if (selectedFormat === 'json-encrypted' && encryptPassword !== encryptConfirm) {
      toast.error("Passwords do not match."); return;
    }

    setExporting(true);
    const date = new Date().toISOString().split('T')[0];
    const basename = `mosaic-export-${date}`;

    try {
      if (selectedFormat === 'therapy') {
        const journalTypes: Record<string, number> = {};
        filteredData.journal.forEach(e => { journalTypes[e.type] = (journalTypes[e.type] || 0) + 1; });

        const summary = generateTherapySummary({
          dateRange: {
            from: dateFrom ? format(dateFrom, 'PP') : 'All time',
            to: dateTo ? format(dateTo, 'PP') : 'Present',
          },
          checkIns: filteredData.checkins,
          journalCount: filteredData.journal.length,
          journalTypes,
          frontSwitches: filteredData.front.length,
          safetyPlanCount: filteredData.safety.length,
          tasksCompleted: filteredData.tasks.filter(t => t.isCompleted).length,
          tasksTotal: filteredData.tasks.length,
        });
        exportAsText(summary, `mosaic-therapy-summary-${date}`);
      } else if (selectedFormat === 'printable') {
        const sections: Array<{ title: string; content: string }> = [];
        const content = generateContent();
        sections.push({ title: 'Full Export', content });
        exportAsHtml(generatePrintableReport(sections), basename);
      } else if (selectedFormat === 'csv') {
        if (selectedTypes.includes('journal')) {
          const mapped = filteredData.journal.map(e => ({ ...e, authorName: e.alterId ? getAlter(e.alterId)?.name : undefined }));
          exportAsCsv(journalToCsvRows(mapped), `mosaic-journal-${date}`);
        }
        if (selectedTypes.includes('front')) {
          const mapped = filteredData.front.map(e => ({ ...e, alterNames: e.alterIds.map(id => getAlter(id)?.name || 'Unknown') }));
          exportAsCsv(frontHistoryToCsvRows(mapped), `mosaic-front-${date}`);
        }
        if (selectedTypes.includes('tasks')) exportAsCsv(tasksToCsvRows(filteredData.tasks), `mosaic-tasks-${date}`);
        if (selectedTypes.includes('calendar')) exportAsCsv(calendarToCsvRows(filteredData.calendar), `mosaic-calendar-${date}`);
        if (selectedTypes.includes('checkins')) exportAsCsv(checkInsToCsvRows(filteredData.checkins), `mosaic-checkins-${date}`);
      } else if (selectedFormat === 'json' || selectedFormat === 'json-encrypted') {
        const exportData: Record<string, unknown> = {};
        selectedTypes.forEach(type => { exportData[type] = filteredData[type]; });

        if (selectedFormat === 'json-encrypted') {
          const encrypted = await encryptBackup(exportData, encryptPassword);
          const blob = new Blob([encrypted], { type: 'application/json;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${basename}-encrypted.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setEncryptPassword('');
          setEncryptConfirm('');
        } else {
          exportAsJson(exportData, basename);
        }
      } else {
        exportAsText(generateContent(), basename);
      }

      logAuditEvent({
        action: 'data_export',
        metadata: { format: selectedFormat, types: selectedTypes, totalRecords, dateRange: { from: dateFrom?.toISOString(), to: dateTo?.toISOString() } },
      });
      toast.success("Export downloaded successfully.");
    } catch (err) {
      toast.error("Export failed. Please try again.");
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  // ─── Presets ───────────────────────────────────────────
  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    const preset: ExportPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      recordTypes: [...selectedTypes],
      format: selectedFormat,
      includePrivateNotes,
      includeMetadata,
    };
    savePresetsToStorage([...savedPresets, preset]);
    setSavePresetOpen(false);
    setPresetName('');
    toast.success("Export preset saved.");
  };

  const loadPreset = (preset: ExportPreset) => {
    setSelectedTypes(preset.recordTypes);
    setSelectedFormat(preset.format);
    setIncludePrivateNotes(preset.includePrivateNotes);
    setIncludeMetadata(preset.includeMetadata);
    toast.success(`Loaded preset: ${preset.name}`);
  };

  const deletePreset = (id: string) => {
    savePresetsToStorage(savedPresets.filter(p => p.id !== id));
    toast.success("Preset removed.");
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-primary" aria-hidden="true" />
          Export &amp; Backup
        </h1>
        <p className="text-muted-foreground mt-1">
          Export, back up, or restore your data. You own your information — take it anywhere.
        </p>
      </header>

      <Tabs defaultValue="export">
        <TabsList className="w-full">
          <TabsTrigger value="export" className="flex-1 gap-1.5">
            <Download className="h-4 w-4" /> Export
          </TabsTrigger>
          <TabsTrigger value="import" className="flex-1 gap-1.5">
            <Upload className="h-4 w-4" /> Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-6 mt-4">

      {/* Privacy notice */}
      <Card className="border-l-4 border-l-primary/40">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Exports are generated on your device and downloaded directly. No data is sent to any server during export.
            You can preview exactly what will be included before downloading.
          </p>
        </CardContent>
      </Card>

      {/* Presets */}
      {savedPresets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Saved presets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {savedPresets.map(preset => (
              <div key={preset.id} className="flex items-center justify-between py-1.5">
                <button
                  onClick={() => loadPreset(preset)}
                  className="text-sm font-medium text-left hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
                >
                  {preset.name}
                </button>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{preset.format}</Badge>
                  <Badge variant="secondary" className="text-xs">{preset.recordTypes.length} types</Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => deletePreset(preset.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Date range */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Date range</CardTitle>
          <p className="text-xs text-muted-foreground">Leave blank to include all records.</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {dateFrom ? format(dateFrom, "PP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {dateTo ? format(dateTo, "PP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(undefined); setDateTo(undefined); }}>
                  Clear dates
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Record types */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading">What to include</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select all</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectNone}>Clear</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_RECORD_TYPES.map(type => {
              const count = filteredData[type]?.length || 0;
              return (
                <label key={type} className="flex items-center gap-2.5 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer tap-target">
                  <Checkbox checked={selectedTypes.includes(type)} onCheckedChange={() => toggleType(type)} />
                  <span className="text-sm flex-1">{RECORD_LABELS[type]}</span>
                  <Badge variant="secondary" className="text-xs tabular-nums">{count}</Badge>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Privacy controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
            Privacy controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-2.5 cursor-pointer tap-target">
            <Checkbox checked={includePrivateNotes} onCheckedChange={(v) => setIncludePrivateNotes(!!v)} className="mt-0.5" />
            <div>
              <span className="text-sm font-medium">Include private notes</span>
              <p className="text-xs text-muted-foreground">Notes marked as private on alter profiles will be included in the export.</p>
            </div>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer tap-target">
            <Checkbox checked={includeMetadata} onCheckedChange={(v) => setIncludeMetadata(!!v)} className="mt-0.5" />
            <div>
              <span className="text-sm font-medium">Include metadata</span>
              <p className="text-xs text-muted-foreground">Record IDs, timestamps, and internal references. Useful for backups.</p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Format selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Export format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {FORMAT_OPTIONS.map(opt => (
              <label key={opt.value} className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer tap-target transition-colors",
                selectedFormat === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}>
                <input
                  type="radio"
                  name="export-format"
                  value={opt.value}
                  checked={selectedFormat === opt.value}
                  onChange={() => setSelectedFormat(opt.value)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <opt.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Encryption password (shown only for encrypted format) */}
      {selectedFormat === 'json-encrypted' && (
        <Card className="border-l-4 border-l-primary/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Encryption password
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose a strong password. You will need it to decrypt and restore this backup.
              There is no way to recover your data if you forget this password.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="encrypt-password">Password (min 8 characters)</Label>
              <Input
                id="encrypt-password"
                type="password"
                value={encryptPassword}
                onChange={e => setEncryptPassword(e.target.value)}
                placeholder="Enter encryption password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="encrypt-confirm">Confirm password</Label>
              <Input
                id="encrypt-confirm"
                type="password"
                value={encryptConfirm}
                onChange={e => setEncryptConfirm(e.target.value)}
                placeholder="Re-enter password"
              />
            </div>
            {encryptPassword.length > 0 && encryptPassword.length < 8 && (
              <p className="text-xs text-destructive">Password must be at least 8 characters.</p>
            )}
            {encryptConfirm.length > 0 && encryptPassword !== encryptConfirm && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary and actions */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {totalRecords} record{totalRecords !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTypes.length} type{selectedTypes.length !== 1 ? 's' : ''} · {FORMAT_OPTIONS.find(f => f.value === selectedFormat)?.label}
                {dateFrom || dateTo ? ` · Date filtered` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePreview} variant="outline" className="gap-1.5" disabled={selectedTypes.length === 0}>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Preview
            </Button>
            <Button onClick={handleExport} className="gap-1.5" disabled={selectedTypes.length === 0 || exporting}>
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              {exporting ? 'Encrypting…' : 'Download export'}
            </Button>
            <Button onClick={() => setSavePresetOpen(true)} variant="outline" className="gap-1.5" disabled={selectedTypes.length === 0}>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save preset
            </Button>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="import" className="mt-4">
          <ImportRestoreSection />
        </TabsContent>
      </Tabs>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Export preview</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This is what your export will contain. Review it before downloading.
          </p>
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto">
            {previewContent || 'No content to preview.'}
          </pre>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={() => { setPreviewOpen(false); handleExport(); }} className="gap-1.5">
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Save preset dialog */}
      <Dialog open={savePresetOpen} onOpenChange={setSavePresetOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Save export preset</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Save your current selections so you can quickly export the same data again later.
          </p>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Preset name</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="e.g. Weekly therapy prep"
              />
            </div>
            <Button onClick={handleSavePreset} disabled={!presetName.trim()} className="w-full">
              Save preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
