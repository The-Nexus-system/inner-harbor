/**
 * Timeline Stitching
 * 
 * Combines front events, journal entries, messages, tasks, calendar events,
 * and medical logs into one chronological timeline.
 */

import type { FrontEvent, JournalEntry, InternalMessage, SystemTask, CalendarEvent, Alter } from '@/types/system';

export type TimelineEventType = 'front' | 'journal' | 'message' | 'task' | 'calendar' | 'gap';
export type TimelineCertainty = 'confirmed' | 'uncertain' | 'estimated';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  endTimestamp?: string;
  title: string;
  description?: string;
  certainty: TimelineCertainty;
  alterIds?: string[];
  sourceId: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineGap {
  id: string;
  type: 'gap';
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  certainty: 'uncertain';
}

/**
 * Stitch all data into a chronological timeline for a given date
 */
export function stitchTimeline(
  date: string,
  frontEvents: FrontEvent[],
  journalEntries: JournalEntry[],
  messages: InternalMessage[],
  tasks: SystemTask[],
  calendarEvents: CalendarEvent[],
  getAlterName: (id: string) => string
): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const dateStart = `${date}T00:00:00`;
  const dateEnd = `${date}T23:59:59`;

  // Front events for this day
  for (const fe of frontEvents) {
    const start = fe.startTime;
    const end = fe.endTime || '';
    
    // Check if event overlaps with this day
    if (start <= dateEnd && (!end || end >= dateStart)) {
      const names = fe.alterIds.map(id => getAlterName(id)).filter(Boolean);
      const statusLabel = fe.status === 'co-fronting' ? 'Co-fronting' : 
                         fe.status === 'blurry' ? 'Blurry front' :
                         fe.status === 'unknown' ? 'Unknown front' : 'Fronting';
      
      events.push({
        id: `front-${fe.id}`,
        type: 'front',
        timestamp: start,
        endTimestamp: end || undefined,
        title: names.length > 0 ? `${statusLabel}: ${names.join(', ')}` : statusLabel,
        description: fe.notes || undefined,
        certainty: fe.status === 'blurry' || fe.status === 'unknown' ? 'uncertain' : 'confirmed',
        alterIds: fe.alterIds,
        sourceId: fe.id,
        metadata: {
          memoryContinuity: fe.memoryContinuity,
          trigger: fe.trigger,
          symptoms: fe.symptoms,
        },
      });
    }
  }

  // Journal entries
  for (const je of journalEntries) {
    if (je.createdAt.startsWith(date)) {
      events.push({
        id: `journal-${je.id}`,
        type: 'journal',
        timestamp: je.createdAt,
        title: je.title || `Journal entry (${je.type})`,
        description: je.content.slice(0, 150) + (je.content.length > 150 ? '…' : ''),
        certainty: 'confirmed',
        alterIds: je.alterId ? [je.alterId] : undefined,
        sourceId: je.id,
        metadata: { type: je.type, mood: je.mood },
      });
    }
  }

  // Messages
  for (const msg of messages) {
    if (msg.createdAt.startsWith(date)) {
      events.push({
        id: `message-${msg.id}`,
        type: 'message',
        timestamp: msg.createdAt,
        title: 'Internal message',
        description: msg.content.slice(0, 100) + (msg.content.length > 100 ? '…' : ''),
        certainty: 'confirmed',
        alterIds: msg.fromAlterId ? [msg.fromAlterId] : undefined,
        sourceId: msg.id,
        metadata: { priority: msg.priority },
      });
    }
  }

  // Tasks completed on this day
  for (const task of tasks) {
    if (task.dueDate === date || task.createdAt.startsWith(date)) {
      events.push({
        id: `task-${task.id}`,
        type: 'task',
        timestamp: task.createdAt,
        title: `Task: ${task.title}`,
        description: task.isCompleted ? 'Completed' : 'Pending',
        certainty: 'confirmed',
        sourceId: task.id,
        metadata: { category: task.category, completed: task.isCompleted },
      });
    }
  }

  // Calendar events
  for (const ce of calendarEvents) {
    if (ce.date === date) {
      events.push({
        id: `calendar-${ce.id}`,
        type: 'calendar',
        timestamp: ce.time ? `${date}T${ce.time}` : `${date}T00:00:00`,
        title: ce.title,
        description: ce.notes || undefined,
        certainty: 'confirmed',
        sourceId: ce.id,
        metadata: { recoveryTime: ce.recoveryTime, supportNeeded: ce.supportNeeded },
      });
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  // Detect gaps between front events
  const frontOnly = events.filter(e => e.type === 'front').sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const gaps: TimelineEvent[] = [];

  for (let i = 0; i < frontOnly.length - 1; i++) {
    const current = frontOnly[i];
    const next = frontOnly[i + 1];
    const currentEnd = current.endTimestamp || current.timestamp;
    
    const gapMs = new Date(next.timestamp).getTime() - new Date(currentEnd).getTime();
    const gapMinutes = gapMs / (1000 * 60);

    if (gapMinutes > 30) {
      const hours = Math.floor(gapMinutes / 60);
      const mins = Math.round(gapMinutes % 60);
      const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      gaps.push({
        id: `gap-${i}`,
        type: 'gap',
        timestamp: currentEnd,
        endTimestamp: next.timestamp,
        title: 'Gap in timeline',
        description: `There is a gap of about ${duration} here. This is okay — not everything needs to be recorded.`,
        certainty: 'uncertain',
        sourceId: `gap-${i}`,
      });
    }
  }

  // Merge gaps into timeline
  const combined = [...events, ...gaps].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return combined;
}

/**
 * Format timeline as plain text for accessibility
 */
export function timelineToPlainText(events: TimelineEvent[], mode: 'brief' | 'detailed'): string {
  if (events.length === 0) {
    return 'No events recorded for this day. That is perfectly okay.';
  }

  const lines = ['Timeline', ''];

  for (const event of events) {
    const time = new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const certaintyMark = event.certainty === 'uncertain' ? ' (uncertain)' : 
                          event.certainty === 'estimated' ? ' (estimated)' : '';

    if (event.type === 'gap') {
      lines.push(`  ~ ${time} — ${event.title}${certaintyMark}`);
      if (mode === 'detailed' && event.description) {
        lines.push(`    ${event.description}`);
      }
    } else {
      lines.push(`  ${time} — ${event.title}${certaintyMark}`);
      if (mode === 'detailed' && event.description) {
        lines.push(`    ${event.description}`);
      }
    }
  }

  return lines.join('\n');
}
