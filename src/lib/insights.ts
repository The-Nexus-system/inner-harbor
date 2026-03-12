/**
 * Pattern Insight Engine
 * 
 * Pure functions that gently detect possible patterns across system data.
 * All language is non-clinical, non-judgmental, and trauma-informed.
 */

import type { FrontEvent, JournalEntry, DailyCheckIn, SystemTask, CalendarEvent } from '@/types/system';

export interface Insight {
  key: string;
  title: string;
  description: string;
  category: 'switching' | 'wellbeing' | 'medical' | 'environment' | 'recovery' | 'grounding' | 'continuity';
  confidence: 'low' | 'medium' | 'high';
  dataPoints: number;
}

export interface InsightPreferences {
  insightsEnabled: boolean;
  summariesEnabled: boolean;
  detailMode: 'brief' | 'detailed';
  excludedDataTypes: string[];
  suppressedCategories: string[];
  includeLocation: boolean;
  lowStimulation: boolean;
}

export const defaultInsightPreferences: InsightPreferences = {
  insightsEnabled: true,
  summariesEnabled: true,
  detailMode: 'brief',
  excludedDataTypes: [],
  suppressedCategories: [],
  includeLocation: false,
  lowStimulation: false,
};

function getHour(dateStr: string): number {
  return new Date(dateStr).getHours();
}

function groupBy<T>(arr: T[], fn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of arr) {
    const key = fn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

/**
 * Detect time-of-day switching clusters
 */
function detectSwitchingTimePatterns(frontEvents: FrontEvent[]): Insight | null {
  if (frontEvents.length < 5) return null;

  const hours = frontEvents.map(e => getHour(e.startTime));
  const buckets: Record<string, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const h of hours) {
    if (h >= 6 && h < 12) buckets.morning++;
    else if (h >= 12 && h < 17) buckets.afternoon++;
    else if (h >= 17 && h < 22) buckets.evening++;
    else buckets.night++;
  }

  const total = hours.length;
  const entries = Object.entries(buckets).sort((a, b) => b[1] - a[1]);
  const [topPeriod, topCount] = entries[0];

  if (topCount / total >= 0.45 && topCount >= 3) {
    return {
      key: `switching-time-${topPeriod}`,
      title: 'Switching may happen more during certain times',
      description: `You may notice that switching tends to happen more often in the ${topPeriod}. This was seen in about ${Math.round((topCount / total) * 100)}% of recent front changes. This is just a possible pattern, not a rule.`,
      category: 'switching',
      confidence: topCount >= 8 ? 'medium' : 'low',
      dataPoints: total,
    };
  }
  return null;
}

/**
 * Detect fatigue/stress correlation with rapid switching
 */
function detectFatigueStressCorrelation(
  frontEvents: FrontEvent[],
  checkIns: DailyCheckIn[]
): Insight | null {
  if (checkIns.length < 3 || frontEvents.length < 5) return null;

  const checkInByDate = new Map(checkIns.map(c => [c.date, c]));
  let highStressSwitchDays = 0;
  let totalDaysWithBoth = 0;

  const switchesByDate = groupBy(frontEvents, e => e.startTime.split('T')[0]);

  for (const [date, events] of Object.entries(switchesByDate)) {
    const ci = checkInByDate.get(date);
    if (!ci) continue;
    totalDaysWithBoth++;
    if ((ci.stress >= 4 || ci.fatigue >= 4) && events.length >= 2) {
      highStressSwitchDays++;
    }
  }

  if (totalDaysWithBoth >= 3 && highStressSwitchDays / totalDaysWithBoth >= 0.4) {
    return {
      key: 'fatigue-stress-switching',
      title: 'There seems to be a possible link between stress and switching',
      description: `On days when stress or fatigue was higher, there tended to be more switching. This was noticed on about ${highStressSwitchDays} out of ${totalDaysWithBoth} days with data. This might be worth paying attention to, but treat it as a working pattern.`,
      category: 'wellbeing',
      confidence: totalDaysWithBoth >= 7 ? 'medium' : 'low',
      dataPoints: totalDaysWithBoth,
    };
  }
  return null;
}

/**
 * Detect blurry/unknown front patterns
 */
function detectBlurryFrontPatterns(frontEvents: FrontEvent[]): Insight | null {
  const blurry = frontEvents.filter(e => e.status === 'blurry' || e.status === 'unknown');
  if (blurry.length < 2) return null;

  const total = frontEvents.length;
  const ratio = blurry.length / total;

  if (ratio >= 0.2) {
    return {
      key: 'blurry-front-frequency',
      title: 'Blurry or unknown front periods come up sometimes',
      description: `About ${Math.round(ratio * 100)}% of recorded front periods were blurry or unknown. This is completely normal and not something to worry about. It might help to note what was happening around those times if you want to understand the pattern better.`,
      category: 'continuity',
      confidence: blurry.length >= 5 ? 'medium' : 'low',
      dataPoints: blurry.length,
    };
  }
  return null;
}

/**
 * Detect seizure/medical event clustering around stress
 */
function detectMedicalStressCorrelation(
  journalEntries: JournalEntry[],
  checkIns: DailyCheckIn[]
): Insight | null {
  const medicalEntries = journalEntries.filter(e => e.type === 'seizure' || e.type === 'medical' || e.type === 'flashback');
  if (medicalEntries.length < 2 || checkIns.length < 3) return null;

  const checkInByDate = new Map(checkIns.map(c => [c.date, c]));
  let stressCorrelated = 0;

  for (const entry of medicalEntries) {
    const date = entry.createdAt.split('T')[0];
    const ci = checkInByDate.get(date);
    if (ci && (ci.stress >= 4 || ci.dissociation >= 4)) {
      stressCorrelated++;
    }
  }

  if (stressCorrelated >= 2 && stressCorrelated / medicalEntries.length >= 0.4) {
    return {
      key: 'medical-stress-correlation',
      title: 'Medical events may relate to stress levels',
      description: `Some seizure, medical, or flashback events seem to have happened on days with higher stress or dissociation. This was seen in about ${stressCorrelated} events. Data is limited, so treat this as a working pattern, not a conclusion.`,
      category: 'medical',
      confidence: 'low',
      dataPoints: stressCorrelated,
    };
  }
  return null;
}

/**
 * Detect recovery time patterns from calendar events
 */
function detectRecoveryPatterns(calendarEvents: CalendarEvent[]): Insight | null {
  const withRecovery = calendarEvents.filter(e => e.recoveryTime);
  if (withRecovery.length < 2) return null;

  return {
    key: 'recovery-time-noted',
    title: 'Some events need more recovery time',
    description: `You have noted recovery time for ${withRecovery.length} events. Tracking this can help plan future events more gently. This is useful self-knowledge.`,
    category: 'recovery',
    confidence: 'high',
    dataPoints: withRecovery.length,
  };
}

/**
 * Detect memory continuity patterns
 */
function detectMemoryGaps(frontEvents: FrontEvent[]): Insight | null {
  const absent = frontEvents.filter(e => e.memoryContinuity === 'absent');
  const partial = frontEvents.filter(e => e.memoryContinuity === 'partial');

  if (absent.length + partial.length < 2) return null;

  return {
    key: 'memory-continuity-gaps',
    title: 'There are some gaps in continuity',
    description: `There have been ${absent.length} periods with absent memory and ${partial.length} with partial memory. This is part of how your system works. Timeline stitching and daily summaries can help fill in context without pressure.`,
    category: 'continuity',
    confidence: 'high',
    dataPoints: absent.length + partial.length,
  };
}

/**
 * Detect co-fronting patterns
 */
function detectCoFrontingPatterns(frontEvents: FrontEvent[]): Insight | null {
  const coFront = frontEvents.filter(e => e.status === 'co-fronting' || e.alterIds.length > 1);
  if (coFront.length < 2) return null;

  const total = frontEvents.length;
  const ratio = coFront.length / total;

  if (ratio >= 0.15) {
    return {
      key: 'co-fronting-frequency',
      title: 'Co-fronting happens fairly often',
      description: `About ${Math.round(ratio * 100)}% of front periods involved co-fronting. This might be worth noting if it affects communication or energy levels.`,
      category: 'switching',
      confidence: coFront.length >= 5 ? 'medium' : 'low',
      dataPoints: coFront.length,
    };
  }
  return null;
}

/**
 * Main analysis function — runs all pattern detectors
 */
export function analyzePatterns(
  frontEvents: FrontEvent[],
  journalEntries: JournalEntry[],
  checkIns: DailyCheckIn[],
  tasks: SystemTask[],
  calendarEvents: CalendarEvent[],
  preferences: InsightPreferences
): Insight[] {
  if (!preferences.insightsEnabled) return [];

  const excluded = new Set(preferences.excludedDataTypes);
  const insights: Insight[] = [];

  const fe = excluded.has('front_events') ? [] : frontEvents;
  const je = excluded.has('journal_entries') ? [] : journalEntries;
  const ci = excluded.has('check_ins') ? [] : checkIns;
  const ce = excluded.has('calendar_events') ? [] : calendarEvents;

  const detectors = [
    () => detectSwitchingTimePatterns(fe),
    () => detectFatigueStressCorrelation(fe, ci),
    () => detectBlurryFrontPatterns(fe),
    () => detectMedicalStressCorrelation(je, ci),
    () => detectRecoveryPatterns(ce),
    () => detectMemoryGaps(fe),
    () => detectCoFrontingPatterns(fe),
  ];

  for (const detect of detectors) {
    const result = detect();
    if (result) insights.push(result);
  }

  return insights;
}

/**
 * Generate a plain-text summary of insights for screen readers / braille
 */
export function insightsToPlainText(insights: Insight[], mode: 'brief' | 'detailed'): string {
  if (insights.length === 0) {
    return 'No patterns detected yet. As more data is recorded, possible patterns may appear here.';
  }

  const lines = ['Possible Patterns', ''];

  for (const insight of insights) {
    lines.push(`• ${insight.title}`);
    if (mode === 'detailed') {
      lines.push(`  ${insight.description}`);
      lines.push(`  Confidence: ${insight.confidence} (based on ${insight.dataPoints} data points)`);
      lines.push('');
    }
  }

  if (mode === 'brief') {
    lines.push('');
    lines.push(`${insights.length} possible pattern${insights.length === 1 ? '' : 's'} found. Switch to detailed mode for more information.`);
  }

  return lines.join('\n');
}
