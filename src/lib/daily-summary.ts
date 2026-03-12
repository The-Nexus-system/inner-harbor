/**
 * Gentle Daily Summary Generator
 * 
 * Generates calm, non-judgmental daily and weekly summaries
 * from timeline and system data.
 */

import type { FrontEvent, JournalEntry, InternalMessage, SystemTask, CalendarEvent, DailyCheckIn } from '@/types/system';

export interface DailySummaryData {
  date: string;
  fronters: { name: string; duration?: string; status: string }[];
  unknownPeriods: number;
  tasksCompleted: number;
  tasksPending: number;
  journalCount: number;
  messageCount: number;
  eventsAttended: string[];
  medicalEvents: string[];
  checkIn?: {
    mood: number;
    stress: number;
    fatigue: number;
    dissociation: number;
  };
  gaps: number;
  safetyPlanUsed: boolean;
  narrativeSummary: string;
  plainTextSummary: string;
}

export interface WeeklyReflectionData {
  startDate: string;
  endDate: string;
  commonFronters: { name: string; count: number }[];
  averageMood: number | null;
  averageStress: number | null;
  totalSwitches: number;
  gapsInContinuity: number;
  tasksCompleted: number;
  eventsAttended: number;
  medicalEventCount: number;
  whatSeemedToHelp: string[];
  narrativeSummary: string;
}

/**
 * Generate a gentle daily summary
 */
export function generateDailySummary(
  date: string,
  frontEvents: FrontEvent[],
  journalEntries: JournalEntry[],
  messages: InternalMessage[],
  tasks: SystemTask[],
  calendarEvents: CalendarEvent[],
  checkIn: DailyCheckIn | null,
  getAlterName: (id: string) => string
): DailySummaryData {
  // Filter to this date
  const dayFronts = frontEvents.filter(e => e.startTime.startsWith(date));
  const dayJournals = journalEntries.filter(e => e.createdAt.startsWith(date));
  const dayMessages = messages.filter(e => e.createdAt.startsWith(date));
  const dayTasks = tasks.filter(t => t.dueDate === date || t.createdAt.startsWith(date));
  const dayEvents = calendarEvents.filter(e => e.date === date);
  const dayMedical = journalEntries.filter(e => 
    e.createdAt.startsWith(date) && 
    (e.type === 'seizure' || e.type === 'medical' || e.type === 'flashback')
  );

  // Build fronter list
  const fronterMap = new Map<string, { name: string; status: string }>();
  for (const fe of dayFronts) {
    for (const aid of fe.alterIds) {
      const name = getAlterName(aid);
      if (name && !fronterMap.has(aid)) {
        fronterMap.set(aid, { name, status: fe.status });
      }
    }
  }
  const fronters = Array.from(fronterMap.values());

  const unknownPeriods = dayFronts.filter(e => e.status === 'unknown' || e.status === 'blurry').length;
  const tasksCompleted = dayTasks.filter(t => t.isCompleted).length;
  const tasksPending = dayTasks.filter(t => !t.isCompleted).length;
  const gaps = dayFronts.filter(e => e.memoryContinuity === 'absent').length;

  // Build narrative
  const parts: string[] = [];
  parts.push('Here is what we know about today.');

  if (fronters.length > 0) {
    const names = fronters.map(f => f.name).join(', ');
    parts.push(`${names} ${fronters.length === 1 ? 'was' : 'were'} present at some point.`);
  }

  if (unknownPeriods > 0) {
    parts.push(`There ${unknownPeriods === 1 ? 'was' : 'were'} ${unknownPeriods} blurry or unknown period${unknownPeriods === 1 ? '' : 's'}. That is completely okay.`);
  }

  if (tasksCompleted > 0) {
    parts.push(`${tasksCompleted} task${tasksCompleted === 1 ? ' was' : 's were'} completed.`);
  }

  if (dayEvents.length > 0) {
    parts.push(`${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}: ${dayEvents.map(e => e.title).join(', ')}.`);
  }

  if (dayMedical.length > 0) {
    parts.push(`${dayMedical.length} medical or symptom event${dayMedical.length === 1 ? '' : 's'} logged.`);
  }

  if (gaps > 0) {
    parts.push(`Some parts of today are incomplete. That is normal.`);
  }

  if (checkIn) {
    parts.push(`Check-in recorded: mood ${checkIn.mood}/5, stress ${checkIn.stress}/5.`);
  }

  const narrativeSummary = parts.join(' ');

  // Plain text version for screen readers
  const plainLines = [
    `Daily Summary — ${new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '',
    ...parts,
  ];

  return {
    date,
    fronters,
    unknownPeriods,
    tasksCompleted,
    tasksPending,
    journalCount: dayJournals.length,
    messageCount: dayMessages.length,
    eventsAttended: dayEvents.map(e => e.title),
    medicalEvents: dayMedical.map(e => e.type),
    checkIn: checkIn ? {
      mood: checkIn.mood,
      stress: checkIn.stress,
      fatigue: checkIn.fatigue,
      dissociation: checkIn.dissociation,
    } : undefined,
    gaps,
    safetyPlanUsed: false,
    narrativeSummary,
    plainTextSummary: plainLines.join('\n'),
  };
}

/**
 * Generate a gentle weekly reflection
 */
export function generateWeeklyReflection(
  dailySummaries: DailySummaryData[],
  checkIns: DailyCheckIn[],
  frontEvents: FrontEvent[],
  getAlterName: (id: string) => string
): WeeklyReflectionData {
  const dates = dailySummaries.map(s => s.date).sort();
  const startDate = dates[0] || '';
  const endDate = dates[dates.length - 1] || '';

  // Count fronters
  const fronterCounts = new Map<string, number>();
  for (const s of dailySummaries) {
    for (const f of s.fronters) {
      fronterCounts.set(f.name, (fronterCounts.get(f.name) || 0) + 1);
    }
  }
  const commonFronters = Array.from(fronterCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Averages
  const moods = checkIns.map(c => c.mood);
  const stresses = checkIns.map(c => c.stress);
  const avgMood = moods.length > 0 ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10 : null;
  const avgStress = stresses.length > 0 ? Math.round((stresses.reduce((a, b) => a + b, 0) / stresses.length) * 10) / 10 : null;

  const totalSwitches = frontEvents.length;
  const gapsInContinuity = dailySummaries.reduce((sum, s) => sum + s.gaps, 0);
  const tasksCompleted = dailySummaries.reduce((sum, s) => sum + s.tasksCompleted, 0);
  const eventsAttended = dailySummaries.reduce((sum, s) => sum + s.eventsAttended.length, 0);
  const medicalEventCount = dailySummaries.reduce((sum, s) => sum + s.medicalEvents.length, 0);

  // What helped
  const helpful: string[] = [];
  if (tasksCompleted > 0) helpful.push('Completing tasks');
  if (eventsAttended > 0) helpful.push('Attending scheduled events');
  const journalDays = dailySummaries.filter(s => s.journalCount > 0).length;
  if (journalDays > 2) helpful.push('Regular journaling');
  const messageDays = dailySummaries.filter(s => s.messageCount > 0).length;
  if (messageDays > 1) helpful.push('Internal communication');

  const parts: string[] = [];
  parts.push('Here is a gentle look at the past week.');
  if (commonFronters.length > 0) {
    parts.push(`${commonFronters[0].name} was present most often (${commonFronters[0].count} days).`);
  }
  if (avgMood !== null) parts.push(`Average mood was ${avgMood}/5.`);
  if (gapsInContinuity > 0) parts.push(`There were ${gapsInContinuity} gaps in continuity across the week.`);
  if (helpful.length > 0) parts.push(`What seemed to help: ${helpful.join(', ')}.`);
  parts.push('This summary is observational, not evaluative. You are doing your best.');

  return {
    startDate,
    endDate,
    commonFronters,
    averageMood: avgMood,
    averageStress: avgStress,
    totalSwitches,
    gapsInContinuity,
    tasksCompleted,
    eventsAttended,
    medicalEventCount,
    whatSeemedToHelp: helpful,
    narrativeSummary: parts.join(' '),
  };
}
