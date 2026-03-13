/**
 * Mosaic — Data Export Utilities
 * 
 * Client-side export of user data in accessible text-first formats.
 * Supports plain text, JSON, CSV, printable report, and therapy-ready summary.
 */

// ─── File download ──────────────────────────────────────────
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportAsText(data: string, filename: string) {
  downloadFile(data, `${filename}.txt`, 'text/plain;charset=utf-8');
}

export function exportAsJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json;charset=utf-8');
}

export function exportAsCsv(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h];
        const str = val == null ? '' : String(val);
        // Escape commas, quotes, newlines
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ];
  downloadFile(csvRows.join('\n'), `${filename}.csv`, 'text/csv;charset=utf-8');
}

export function exportAsHtml(html: string, filename: string) {
  downloadFile(html, `${filename}.html`, 'text/html;charset=utf-8');
}

// ─── Journal formatters ─────────────────────────────────────
export function formatJournalForExport(entries: Array<{
  title?: string;
  content: string;
  type: string;
  mood?: number;
  tags: string[];
  createdAt: string;
  authorName?: string;
}>): string {
  const lines = ['MOSAIC — Journal Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const entry of entries) {
    lines.push(`Date: ${new Date(entry.createdAt).toLocaleString()}`);
    if (entry.authorName) lines.push(`Author: ${entry.authorName}`);
    lines.push(`Type: ${entry.type}`);
    if (entry.mood) lines.push(`Mood: ${entry.mood}/5`);
    if (entry.title) lines.push(`Title: ${entry.title}`);
    lines.push('', entry.content, '');
    if (entry.tags.length > 0) lines.push(`Tags: ${entry.tags.join(', ')}`);
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

export function journalToCsvRows(entries: Array<{
  title?: string; content: string; type: string; mood?: number;
  tags: string[]; createdAt: string; authorName?: string;
}>): Record<string, unknown>[] {
  return entries.map(e => ({
    date: new Date(e.createdAt).toLocaleString(),
    author: e.authorName || '',
    type: e.type,
    mood: e.mood ?? '',
    title: e.title || '',
    content: e.content,
    tags: e.tags.join('; '),
  }));
}

// ─── Front history formatters ───────────────────────────────
export function formatFrontHistoryForExport(events: Array<{
  startTime: string; endTime?: string; status: string;
  alterNames: string[]; memoryContinuity: string; notes?: string;
}>): string {
  const lines = ['MOSAIC — Front History Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const event of events) {
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : null;
    lines.push(`Time: ${start.toLocaleString()}${end ? ` — ${end.toLocaleTimeString()}` : ' (ongoing)'}`);
    lines.push(`Who: ${event.alterNames.length > 0 ? event.alterNames.join(', ') : 'Unknown'}`);
    lines.push(`Status: ${event.status}`);
    lines.push(`Memory: ${event.memoryContinuity}`);
    if (event.notes) lines.push(`Notes: ${event.notes}`);
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

export function frontHistoryToCsvRows(events: Array<{
  startTime: string; endTime?: string; status: string;
  alterNames: string[]; memoryContinuity: string; notes?: string;
}>): Record<string, unknown>[] {
  return events.map(e => ({
    start: new Date(e.startTime).toLocaleString(),
    end: e.endTime ? new Date(e.endTime).toLocaleString() : 'ongoing',
    who: e.alterNames.join('; '),
    status: e.status,
    memory: e.memoryContinuity,
    notes: e.notes || '',
  }));
}

// ─── Safety plan formatters ─────────────────────────────────
export function formatSafetyPlanForExport(plans: Array<{
  title: string; type: string; steps: string[];
  trustedContacts: Array<{ name: string; phone?: string; relationship: string }>;
  notes?: string;
}>): string {
  const lines = ['MOSAIC — Safety Plans Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const plan of plans) {
    lines.push(`${plan.title} (${plan.type})`, '');
    lines.push('Steps:');
    plan.steps.forEach((step, i) => lines.push(`  ${i + 1}. ${step}`));
    lines.push('');
    if (plan.trustedContacts.length > 0) {
      lines.push('Trusted Contacts:');
      for (const c of plan.trustedContacts) {
        lines.push(`  - ${c.name} (${c.relationship})${c.phone ? ` — ${c.phone}` : ''}`);
      }
      lines.push('');
    }
    if (plan.notes) lines.push(`Notes: ${plan.notes}`, '');
    lines.push('---', '');
  }
  return lines.join('\n');
}

// ─── Task formatters ────────────────────────────────────────
export function formatTasksForExport(tasks: Array<{
  title: string; description?: string; category: string;
  assignedTo: string; isCompleted: boolean; dueDate?: string; createdAt: string;
}>): string {
  const lines = ['MOSAIC — Tasks Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const t of tasks) {
    lines.push(`[${t.isCompleted ? 'x' : ' '}] ${t.title}`);
    if (t.description) lines.push(`    ${t.description}`);
    lines.push(`    Category: ${t.category} | Assigned: ${t.assignedTo}${t.dueDate ? ` | Due: ${t.dueDate}` : ''}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function tasksToCsvRows(tasks: Array<{
  title: string; description?: string; category: string;
  assignedTo: string; isCompleted: boolean; dueDate?: string; createdAt: string;
}>): Record<string, unknown>[] {
  return tasks.map(t => ({
    title: t.title,
    description: t.description || '',
    category: t.category,
    assigned_to: t.assignedTo,
    completed: t.isCompleted ? 'Yes' : 'No',
    due_date: t.dueDate || '',
    created: new Date(t.createdAt).toLocaleDateString(),
  }));
}

// ─── Alter profile formatters ───────────────────────────────
export function formatAltersForExport(alters: Array<{
  name: string; pronouns: string; role?: string; emoji?: string;
  communicationStyle?: string; accessNeeds?: string; notes?: string;
}>, includePrivateNotes: boolean): string {
  const lines = ['MOSAIC — Alter Profiles Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const a of alters) {
    lines.push(`${a.emoji || ''} ${a.name} (${a.pronouns})`);
    if (a.role) lines.push(`  Role: ${a.role}`);
    if (a.communicationStyle) lines.push(`  Communication: ${a.communicationStyle}`);
    if (a.accessNeeds) lines.push(`  Access needs: ${a.accessNeeds}`);
    if (includePrivateNotes && a.notes) lines.push(`  Notes: ${a.notes}`);
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

// ─── Calendar formatters ────────────────────────────────────
export function formatCalendarForExport(events: Array<{
  title: string; date: string; time?: string; notes?: string;
  supportNeeded?: string; sensoryPrep?: string;
}>): string {
  const lines = ['MOSAIC — Calendar Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const e of events) {
    lines.push(`${e.date}${e.time ? ' at ' + e.time : ''} — ${e.title}`);
    if (e.supportNeeded) lines.push(`  Support: ${e.supportNeeded}`);
    if (e.sensoryPrep) lines.push(`  Sensory prep: ${e.sensoryPrep}`);
    if (e.notes) lines.push(`  Notes: ${e.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function calendarToCsvRows(events: Array<{
  title: string; date: string; time?: string; notes?: string;
}>): Record<string, unknown>[] {
  return events.map(e => ({
    date: e.date,
    time: e.time || '',
    title: e.title,
    notes: e.notes || '',
  }));
}

// ─── Check-in formatters ────────────────────────────────────
export function formatCheckInsForExport(checkIns: Array<{
  date: string; mood: number; stress: number; pain: number;
  fatigue: number; dissociation: number; notes?: string;
}>): string {
  const lines = ['MOSAIC — Daily Check-ins Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const c of checkIns) {
    lines.push(`Date: ${c.date}`);
    lines.push(`  Mood: ${c.mood}/5  Stress: ${c.stress}/5  Pain: ${c.pain}/5`);
    lines.push(`  Fatigue: ${c.fatigue}/5  Dissociation: ${c.dissociation}/5`);
    if (c.notes) lines.push(`  Notes: ${c.notes}`);
    lines.push('');
  }
  return lines.join('\n');
}

export function checkInsToCsvRows(checkIns: Array<{
  date: string; mood: number; stress: number; pain: number;
  fatigue: number; dissociation: number; notes?: string;
}>): Record<string, unknown>[] {
  return checkIns.map(c => ({
    date: c.date, mood: c.mood, stress: c.stress, pain: c.pain,
    fatigue: c.fatigue, dissociation: c.dissociation, notes: c.notes || '',
  }));
}

// ─── Handoff notes formatter ────────────────────────────────
export function formatHandoffNotesForExport(notes: Array<{
  createdAt: string; currentActivity?: string; unfinishedTasks?: string;
  emotionalState?: string; importantReminders?: string; warnings?: string;
}>): string {
  const lines = ['MOSAIC — Handoff Notes Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const n of notes) {
    lines.push(`Time: ${new Date(n.createdAt).toLocaleString()}`);
    if (n.currentActivity) lines.push(`  Activity: ${n.currentActivity}`);
    if (n.emotionalState) lines.push(`  Emotional state: ${n.emotionalState}`);
    if (n.unfinishedTasks) lines.push(`  Unfinished: ${n.unfinishedTasks}`);
    if (n.importantReminders) lines.push(`  Reminders: ${n.importantReminders}`);
    if (n.warnings) lines.push(`  Warnings: ${n.warnings}`);
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

// ─── Messages formatter ─────────────────────────────────────
export function formatMessagesForExport(messages: Array<{
  createdAt: string; content: string; fromName?: string;
  toNames: string[]; priority: string;
}>): string {
  const lines = ['MOSAIC — Internal Messages Export', `Exported: ${new Date().toLocaleDateString()}`, '', '---', ''];
  for (const m of messages) {
    lines.push(`${new Date(m.createdAt).toLocaleString()}`);
    if (m.fromName) lines.push(`  From: ${m.fromName}`);
    if (m.toNames.length) lines.push(`  To: ${m.toNames.join(', ')}`);
    if (m.priority !== 'normal') lines.push(`  Priority: ${m.priority}`);
    lines.push(`  ${m.content}`);
    lines.push('', '---', '');
  }
  return lines.join('\n');
}

// ─── Therapy-ready summary ──────────────────────────────────
export function generateTherapySummary(data: {
  dateRange: { from: string; to: string };
  checkIns: Array<{ date: string; mood: number; stress: number; dissociation: number }>;
  journalCount: number;
  journalTypes: Record<string, number>;
  frontSwitches: number;
  safetyPlanCount: number;
  tasksCompleted: number;
  tasksTotal: number;
}): string {
  const lines = [
    'MOSAIC — Therapy Session Summary',
    `Period: ${data.dateRange.from} to ${data.dateRange.to}`,
    `Generated: ${new Date().toLocaleDateString()}`,
    '',
    '═══════════════════════════════════',
    '',
    'OVERVIEW',
    `  Journal entries: ${data.journalCount}`,
    `  Front switches: ${data.frontSwitches}`,
    `  Tasks completed: ${data.tasksCompleted} of ${data.tasksTotal}`,
    `  Safety plans available: ${data.safetyPlanCount}`,
    '',
  ];

  if (data.checkIns.length > 0) {
    const avg = (key: 'mood' | 'stress' | 'dissociation') =>
      (data.checkIns.reduce((s, c) => s + c[key], 0) / data.checkIns.length).toFixed(1);
    lines.push(
      'CHECK-IN AVERAGES',
      `  Mood: ${avg('mood')}/5`,
      `  Stress: ${avg('stress')}/5`,
      `  Dissociation: ${avg('dissociation')}/5`,
      `  Days tracked: ${data.checkIns.length}`,
      '',
    );
  }

  if (Object.keys(data.journalTypes).length > 0) {
    lines.push('JOURNAL ENTRY TYPES');
    for (const [type, count] of Object.entries(data.journalTypes)) {
      lines.push(`  ${type}: ${count}`);
    }
    lines.push('');
  }

  lines.push(
    '═══════════════════════════════════',
    '',
    'This summary was generated from the user\'s own data.',
    'It is intended to support therapy sessions and is not a clinical assessment.',
  );

  return lines.join('\n');
}

// ─── Printable HTML report ──────────────────────────────────
export function generatePrintableReport(sections: Array<{
  title: string;
  content: string;
}>): string {
  const sectionHtml = sections.map(s => `
    <section>
      <h2>${escapeHtml(s.title)}</h2>
      <pre style="white-space:pre-wrap;font-family:inherit;font-size:0.9em;">${escapeHtml(s.content)}</pre>
    </section>
  `).join('\n<hr>\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mosaic — Export Report</title>
  <style>
    body { font-family: Georgia, serif; max-width: 720px; margin: 2em auto; padding: 0 1em; color: #222; line-height: 1.6; }
    h1 { font-size: 1.5em; border-bottom: 2px solid #666; padding-bottom: 0.3em; }
    h2 { font-size: 1.2em; color: #444; margin-top: 1.5em; }
    hr { border: none; border-top: 1px solid #ccc; margin: 2em 0; }
    .meta { color: #666; font-size: 0.85em; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Mosaic — Export Report</h1>
  <p class="meta">Generated: ${new Date().toLocaleString()}</p>
  ${sectionHtml}
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
