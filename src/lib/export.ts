/**
 * Mosaic — Data Export Utilities
 * 
 * Client-side export of user data in accessible text-first formats.
 */

/**
 * Download a string as a file.
 */
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

/**
 * Export data as a plain text file.
 */
export function exportAsText(data: string, filename: string) {
  downloadFile(data, `${filename}.txt`, 'text/plain;charset=utf-8');
}

/**
 * Export data as JSON.
 */
export function exportAsJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json;charset=utf-8');
}

/**
 * Format journal entries for text export.
 */
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

/**
 * Format front history for text export.
 */
export function formatFrontHistoryForExport(events: Array<{
  startTime: string;
  endTime?: string;
  status: string;
  alterNames: string[];
  memoryContinuity: string;
  notes?: string;
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

/**
 * Format safety plans for text export.
 */
export function formatSafetyPlanForExport(plans: Array<{
  title: string;
  type: string;
  steps: string[];
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
