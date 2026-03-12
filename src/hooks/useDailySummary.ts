import { useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { generateDailySummary, generateWeeklyReflection, type DailySummaryData, type WeeklyReflectionData } from '@/lib/daily-summary';
import { stitchTimeline, type TimelineEvent } from '@/lib/timeline';

export function useDailySummary(date: string) {
  const { user } = useAuth();
  const userId = user?.id;
  const { frontEvents, journalEntries, messages, tasks, calendarEvents, checkIn, getAlter } = useSystem();
  const qc = useQueryClient();

  const getAlterName = useCallback((id: string) => getAlter(id)?.name || 'Unknown', [getAlter]);

  // Load check-ins for the week
  const weekCheckInsQ = useQuery({
    queryKey: ['daily_check_ins_week', userId, date],
    queryFn: async () => {
      const d = new Date(date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', userId!)
        .gte('check_date', weekStart.toISOString().split('T')[0])
        .lte('check_date', weekEnd.toISOString().split('T')[0]);
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id, date: r.check_date, alterId: r.alter_id ?? undefined,
        mood: r.mood as 1|2|3|4|5, stress: r.stress as 1|2|3|4|5,
        pain: r.pain as 1|2|3|4|5, fatigue: r.fatigue as 1|2|3|4|5,
        dissociation: r.dissociation as 1|2|3|4|5,
        seizureRisk: (r.seizure_risk as 1|2|3|4|5) ?? undefined,
        notes: r.notes ?? undefined,
      }));
    },
    enabled: !!userId,
  });

  // Load saved summary for this date
  const savedSummaryQ = useQuery({
    queryKey: ['daily_summaries', userId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId!)
        .eq('summary_date', date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Generate timeline
  const timeline = useMemo(() => 
    stitchTimeline(date, frontEvents, journalEntries, messages, tasks, calendarEvents, getAlterName),
    [date, frontEvents, journalEntries, messages, tasks, calendarEvents, getAlterName]
  );

  // Generate summary
  const summary = useMemo(() =>
    generateDailySummary(date, frontEvents, journalEntries, messages, tasks, calendarEvents, checkIn, getAlterName),
    [date, frontEvents, journalEntries, messages, tasks, calendarEvents, checkIn, getAlterName]
  );

  // Weekly reflection
  const weeklyReflection = useMemo((): WeeklyReflectionData | null => {
    const weekCheckIns = weekCheckInsQ.data ?? [];
    if (weekCheckIns.length < 2) return null;

    // Generate summaries for each day of the week
    const d = new Date(date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    
    const dailySummaries: DailySummaryData[] = [];
    const weekFrontEvents = frontEvents.filter(e => {
      const ed = e.startTime.split('T')[0];
      return ed >= weekStart.toISOString().split('T')[0];
    });

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const dayStr = dayDate.toISOString().split('T')[0];
      const dayCheckIn = weekCheckIns.find(c => c.date === dayStr) ?? null;
      
      dailySummaries.push(
        generateDailySummary(dayStr, frontEvents, journalEntries, messages, tasks, calendarEvents, dayCheckIn, getAlterName)
      );
    }

    return generateWeeklyReflection(dailySummaries, weekCheckIns, weekFrontEvents, getAlterName);
  }, [date, frontEvents, journalEntries, messages, tasks, calendarEvents, weekCheckInsQ.data, getAlterName]);

  // Save summary
  const saveSummary = useCallback(async (notes?: string) => {
    if (!userId) return;
    const { data: existing } = await supabase
      .from('daily_summaries')
      .select('id')
      .eq('user_id', userId)
      .eq('summary_date', date)
      .maybeSingle();

    if (existing) {
      await supabase.from('daily_summaries').update({
        summary_data: summary as any,
        user_notes: notes || null,
      }).eq('id', existing.id);
    } else {
      await supabase.from('daily_summaries').insert([{
        user_id: userId,
        summary_date: date,
        summary_data: summary as any,
        user_notes: notes || null,
      }]);
    }
    qc.invalidateQueries({ queryKey: ['daily_summaries', userId, date] });
  }, [userId, date, summary, qc]);

  // Export as text
  const exportAsText = useCallback(() => {
    const text = summary.plainTextSummary;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mosaic-summary-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary, date]);

  return {
    timeline,
    summary,
    weeklyReflection,
    savedSummary: savedSummaryQ.data,
    isLoading: weekCheckInsQ.isLoading || savedSummaryQ.isLoading,
    saveSummary,
    exportAsText,
  };
}
