import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSystem } from '@/contexts/SystemContext';
import { analyzePatterns, defaultInsightPreferences, type Insight, type InsightPreferences } from '@/lib/insights';

export interface SavedInsight {
  id: string;
  insightKey: string;
  title: string;
  description: string;
  status: 'saved' | 'dismissed' | 'useful' | 'not_useful' | 'uncertain';
  createdAt: string;
}

export function useInsights() {
  const { user } = useAuth();
  const userId = user?.id;
  const { frontEvents, journalEntries, tasks, calendarEvents } = useSystem();
  const qc = useQueryClient();

  // Load check-ins for correlation (last 30 days)
  const checkInsQ = useQuery({
    queryKey: ['daily_check_ins_all', userId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', userId!)
        .gte('check_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('check_date', { ascending: false });
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

  // Load preferences
  const prefsQ = useQuery({
    queryKey: ['insight_preferences', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('insight_preferences')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return defaultInsightPreferences;
      return {
        insightsEnabled: data.insights_enabled,
        summariesEnabled: data.summaries_enabled,
        detailMode: data.detail_mode as 'brief' | 'detailed',
        excludedDataTypes: data.excluded_data_types ?? [],
        suppressedCategories: (data as any).suppressed_categories ?? [],
        includeLocation: data.include_location,
        lowStimulation: data.low_stimulation,
      } as InsightPreferences;
    },
    enabled: !!userId,
  });

  // Load saved insights
  const savedQ = useQuery({
    queryKey: ['saved_insights', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_insights')
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(r => ({
        id: r.id,
        insightKey: r.insight_key,
        title: r.title,
        description: r.description,
        status: r.status as SavedInsight['status'],
        createdAt: r.created_at,
      }));
    },
    enabled: !!userId,
  });

  const preferences = prefsQ.data ?? defaultInsightPreferences;
  const savedInsights = savedQ.data ?? [];
  const checkIns = checkInsQ.data ?? [];

  // Compute insights
  const dismissedKeys = new Set(savedInsights.filter(s => s.status === 'dismissed').map(s => s.insightKey));

  const insights = useMemo(() => {
    const all = analyzePatterns(frontEvents, journalEntries, checkIns, tasks, calendarEvents, preferences);
    const suppressed = new Set(preferences.suppressedCategories ?? []);
    return all.filter(i => !dismissedKeys.has(i.key) && !suppressed.has(i.category));
  }, [frontEvents, journalEntries, checkIns, tasks, calendarEvents, preferences, dismissedKeys]);

  // Actions
  const saveInsight = useCallback(async (insight: Insight, status: SavedInsight['status']) => {
    if (!userId) return;
    await supabase.from('saved_insights').insert([{
      user_id: userId,
      insight_key: insight.key,
      title: insight.title,
      description: insight.description,
      status,
    }]);
    qc.invalidateQueries({ queryKey: ['saved_insights', userId] });
  }, [userId, qc]);

  const updateInsightStatus = useCallback(async (id: string, status: SavedInsight['status']) => {
    if (!userId) return;
    await supabase.from('saved_insights').update({ status }).eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['saved_insights', userId] });
  }, [userId, qc]);

  const updatePreferences = useCallback(async (updates: Partial<InsightPreferences>) => {
    if (!userId) return;
    const dbUpdate: Record<string, unknown> = {};
    if (updates.insightsEnabled !== undefined) dbUpdate.insights_enabled = updates.insightsEnabled;
    if (updates.summariesEnabled !== undefined) dbUpdate.summaries_enabled = updates.summariesEnabled;
    if (updates.detailMode !== undefined) dbUpdate.detail_mode = updates.detailMode;
    if (updates.excludedDataTypes !== undefined) dbUpdate.excluded_data_types = updates.excludedDataTypes;
    if (updates.includeLocation !== undefined) dbUpdate.include_location = updates.includeLocation;
    if (updates.lowStimulation !== undefined) dbUpdate.low_stimulation = updates.lowStimulation;
    if (updates.suppressedCategories !== undefined) dbUpdate.suppressed_categories = updates.suppressedCategories;

    const { data: existing } = await supabase.from('insight_preferences').select('user_id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('insight_preferences').update(dbUpdate).eq('user_id', userId);
    } else {
      await supabase.from('insight_preferences').insert([{ user_id: userId, ...dbUpdate }]);
    }
    qc.invalidateQueries({ queryKey: ['insight_preferences', userId] });
  }, [userId, qc]);

  return {
    insights,
    savedInsights,
    preferences,
    checkIns,
    isLoading: prefsQ.isLoading || savedQ.isLoading || checkInsQ.isLoading,
    saveInsight,
    updateInsightStatus,
    updatePreferences,
  };
}
