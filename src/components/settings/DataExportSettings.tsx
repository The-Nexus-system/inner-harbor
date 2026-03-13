import { useState } from "react";
import { useSystem } from "@/contexts/SystemContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileJson, Check } from "lucide-react";
import {
  exportAsText, exportAsJson,
  formatJournalForExport, formatFrontHistoryForExport, formatSafetyPlanForExport,
} from "@/lib/export";
import { logAuditEvent } from "@/lib/audit";

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

export default function DataExportSettings() {
  const { journalEntries, frontEvents, tasks, safetyPlans, getAlter } = useSystem();
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

    logAuditEvent({ action: 'data_export', resource_type: key, metadata: { format, count: exportItems.find(e => e.key === key)?.count } });
    flash(`${key}-${format}`);
  };

  const exportItems: { key: ExportKey; label: string; count: number }[] = [
    { key: 'journal', label: 'Journal entries', count: journalEntries.length },
    { key: 'front', label: 'Front history', count: frontEvents.length },
    { key: 'tasks', label: 'Tasks', count: tasks.length },
    { key: 'safety', label: 'Safety plans', count: safetyPlans.length },
  ];

  return (
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
  );
}
