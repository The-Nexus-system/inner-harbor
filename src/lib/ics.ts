/**
 * ICS file generation utilities for calendar event export.
 */

import type { CalendarEvent } from '@/types/system';

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatDateICS(date: string, time?: string): string {
  const d = date.replace(/-/g, '');
  if (time) {
    const t = time.replace(/:/g, '') + '00';
    return `${d}T${t}`;
  }
  return d;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}@mosaic`;
}

export function generateICSEvent(event: CalendarEvent, alterName?: string): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mosaic//System Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid()}`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
  ];

  if (event.time) {
    lines.push(`DTSTART:${formatDateICS(event.date, event.time)}`);
    // Default 1 hour duration
    const [h, m] = event.time.split(':').map(Number);
    const endH = String(h + 1).padStart(2, '0');
    const endM = String(m).padStart(2, '0');
    lines.push(`DTEND:${formatDateICS(event.date, `${endH}:${endM}`)}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${formatDateICS(event.date)}`);
    // All-day event — next day
    const next = new Date(event.date);
    next.setDate(next.getDate() + 1);
    const nd = next.toISOString().split('T')[0];
    lines.push(`DTEND;VALUE=DATE:${formatDateICS(nd)}`);
  }

  lines.push(`SUMMARY:${escapeICS(event.title)}`);

  const descParts: string[] = [];
  if (alterName) descParts.push(`Preferred fronter: ${alterName}`);
  if (event.supportNeeded) descParts.push(`Support: ${event.supportNeeded}`);
  if (event.sensoryPrep) descParts.push(`Sensory prep: ${event.sensoryPrep}`);
  if (event.recoveryTime) descParts.push(`Recovery: ${event.recoveryTime}`);
  if (event.transportNotes) descParts.push(`Transport: ${event.transportNotes}`);
  if (event.notes) descParts.push(event.notes);

  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

export function generateICSAll(events: CalendarEvent[], getAlterName?: (id: string) => string | undefined): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mosaic//System Management//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Mosaic Calendar`,
  ];

  for (const event of events) {
    const alterName = event.preferredFronter && getAlterName ? getAlterName(event.preferredFronter) : undefined;
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:mosaic-${event.id}@mosaic`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    if (event.time) {
      lines.push(`DTSTART:${formatDateICS(event.date, event.time)}`);
      const [h, m] = event.time.split(':').map(Number);
      lines.push(`DTEND:${formatDateICS(event.date, `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${formatDateICS(event.date)}`);
      const next = new Date(event.date);
      next.setDate(next.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${formatDateICS(next.toISOString().split('T')[0])}`);
    }

    lines.push(`SUMMARY:${escapeICS(event.title)}`);

    const descParts: string[] = [];
    if (alterName) descParts.push(`Preferred fronter: ${alterName}`);
    if (event.supportNeeded) descParts.push(`Support: ${event.supportNeeded}`);
    if (event.sensoryPrep) descParts.push(`Sensory prep: ${event.sensoryPrep}`);
    if (event.recoveryTime) descParts.push(`Recovery: ${event.recoveryTime}`);
    if (event.transportNotes) descParts.push(`Transport: ${event.transportNotes}`);
    if (event.notes) descParts.push(event.notes);
    if (descParts.length > 0) lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadICS(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Generate a Google Calendar "Add Event" URL */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams();
  params.set('action', 'TEMPLATE');
  params.set('text', event.title);

  if (event.time) {
    const dt = `${event.date.replace(/-/g, '')}T${event.time.replace(/:/g, '')}00`;
    const [h, m] = event.time.split(':').map(Number);
    const endDt = `${event.date.replace(/-/g, '')}T${String(h + 1).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    params.set('dates', `${dt}/${endDt}`);
  } else {
    const d = event.date.replace(/-/g, '');
    const next = new Date(event.date);
    next.setDate(next.getDate() + 1);
    const nd = next.toISOString().split('T')[0].replace(/-/g, '');
    params.set('dates', `${d}/${nd}`);
  }

  const details: string[] = [];
  if (event.supportNeeded) details.push(`Support: ${event.supportNeeded}`);
  if (event.sensoryPrep) details.push(`Sensory prep: ${event.sensoryPrep}`);
  if (event.recoveryTime) details.push(`Recovery: ${event.recoveryTime}`);
  if (event.transportNotes) details.push(`Transport: ${event.transportNotes}`);
  if (event.notes) details.push(event.notes);
  if (details.length) params.set('details', details.join('\n'));

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
