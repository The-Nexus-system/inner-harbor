import React, { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Alter, FrontEvent, JournalEntry, InternalMessage, SystemTask, SafetyPlan, CalendarEvent, DailyCheckIn, AppSettings, RecurrencePattern } from '@/types/system';
import type { Database } from '@/integrations/supabase/types';

type DbAlter = Database['public']['Tables']['alters']['Row'];
type DbFrontEvent = Database['public']['Tables']['front_events']['Row'];
type DbJournal = Database['public']['Tables']['journal_entries']['Row'];
type DbMessage = Database['public']['Tables']['internal_messages']['Row'];
type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbSafety = Database['public']['Tables']['safety_plans']['Row'];
type DbCalendar = Database['public']['Tables']['calendar_events']['Row'];
type DbCheckIn = Database['public']['Tables']['daily_check_ins']['Row'];
type DbSettings = Database['public']['Tables']['app_settings']['Row'];

// ============================================================
// Row → App type mappers
// ============================================================

function mapAlter(r: DbAlter): Alter {
  return {
    id: r.id, name: r.name, nickname: r.nickname ?? undefined, pronouns: r.pronouns,
    role: r.role ?? undefined, ageRange: r.age_range ?? undefined, species: r.species ?? undefined,
    communicationStyle: r.communication_style ?? undefined, accessNeeds: r.access_needs ?? undefined,
    triggersToAvoid: r.triggers_to_avoid ?? undefined, groundingPreferences: r.grounding_preferences ?? undefined,
    safeFoods: r.safe_foods ?? undefined, musicPreferences: r.music_preferences ?? undefined,
    frontingConfidence: (r.fronting_confidence as Alter['frontingConfidence']) ?? undefined,
    color: r.color ?? undefined, emoji: r.emoji ?? undefined, notes: r.notes ?? undefined,
    visibility: r.visibility as Alter['visibility'], privateFields: r.private_fields ?? undefined,
    isActive: r.is_active, createdAt: r.created_at,
  };
}

function mapFrontEvent(r: DbFrontEvent): FrontEvent {
  return {
    id: r.id, alterIds: r.alter_ids ?? [], status: r.status as FrontEvent['status'],
    startTime: r.start_time, endTime: r.end_time ?? undefined,
    memoryContinuity: r.memory_continuity as FrontEvent['memoryContinuity'],
    trigger: r.trigger_info ?? undefined, symptoms: r.symptoms ?? undefined,
    notes: r.notes ?? undefined, location: r.location ?? undefined,
  };
}

function mapJournal(r: DbJournal): JournalEntry {
  return {
    id: r.id, alterId: r.alter_id ?? undefined, title: r.title ?? undefined,
    content: r.content, mood: (r.mood as JournalEntry['mood']) ?? undefined,
    type: r.type as JournalEntry['type'], tags: r.tags ?? [],
    visibility: r.visibility as JournalEntry['visibility'], createdAt: r.created_at,
  };
}

function mapMessage(r: DbMessage): InternalMessage {
  return {
    id: r.id, fromAlterId: r.from_alter_id ?? undefined, toAlterIds: r.to_alter_ids ?? [],
    content: r.content, priority: r.priority as InternalMessage['priority'],
    isPinned: r.is_pinned, isRead: r.is_read, createdAt: r.created_at,
  };
}

function mapTask(r: DbTask): SystemTask {
  return {
    id: r.id, title: r.title, description: r.description ?? undefined,
    assignedTo: r.assigned_to, isCompleted: r.is_completed,
    dueDate: r.due_date ?? undefined, isRecurring: r.is_recurring,
    recurrencePattern: (r as any).recurrence_pattern as RecurrencePattern | undefined,
    reminderMinutes: r.reminder_minutes ?? undefined,
    category: r.category as SystemTask['category'], createdAt: r.created_at,
  };
}

function mapSafety(r: DbSafety): SafetyPlan {
  const contacts = (Array.isArray(r.trusted_contacts) ? r.trusted_contacts : []) as Array<{ name: string; phone?: string; relationship: string }>;
  return {
    id: r.id, type: r.type as SafetyPlan['type'], title: r.title,
    steps: r.steps ?? [], trustedContacts: contacts,
    notes: r.notes ?? undefined, updatedAt: r.updated_at,
  };
}

function mapCalendar(r: DbCalendar): CalendarEvent {
  return {
    id: r.id, title: r.title, date: r.event_date, time: r.event_time ?? undefined,
    preferredFronter: r.preferred_fronter ?? undefined,
    supportNeeded: r.support_needed ?? undefined, sensoryPrep: r.sensory_prep ?? undefined,
    recoveryTime: r.recovery_time ?? undefined, transportNotes: r.transport_notes ?? undefined,
    notes: r.notes ?? undefined, reminderMinutes: r.reminder_minutes ?? undefined,
  };
}

function mapCheckIn(r: DbCheckIn): DailyCheckIn {
  return {
    id: r.id, date: r.check_date, alterId: r.alter_id ?? undefined,
    mood: r.mood as DailyCheckIn['mood'], stress: r.stress as DailyCheckIn['stress'],
    pain: r.pain as DailyCheckIn['pain'], fatigue: r.fatigue as DailyCheckIn['fatigue'],
    dissociation: r.dissociation as DailyCheckIn['dissociation'],
    seizureRisk: (r.seizure_risk as DailyCheckIn['seizureRisk']) ?? undefined,
    notes: r.notes ?? undefined,
  };
}

function mapSettings(r: DbSettings): AppSettings {
  return {
    highContrast: r.high_contrast, darkMode: r.dark_mode,
    fontSize: r.font_size as AppSettings['fontSize'], spacing: r.spacing as AppSettings['spacing'],
    reducedMotion: r.reduced_motion, plainLanguage: r.plain_language,
    soundOff: r.sound_off, screenReaderOptimized: r.screen_reader_optimized,
    themeColor: ((r as any).theme_color as AppSettings['themeColor']) ?? 'sage',
    customThemeHsl: (r as any).custom_theme_hsl ?? undefined,
  };
}

// ============================================================
// Context
// ============================================================

interface SystemContextType {
  alters: Alter[];
  frontEvents: FrontEvent[];
  currentFront: FrontEvent | null;
  journalEntries: JournalEntry[];
  messages: InternalMessage[];
  tasks: SystemTask[];
  safetyPlans: SafetyPlan[];
  calendarEvents: CalendarEvent[];
  checkIn: DailyCheckIn | null;
  settings: AppSettings;
  isLoading: boolean;
  getAlter: (id: string) => Alter | undefined;
  setCurrentFronter: (alterIds: string[], status: FrontEvent['status']) => void;
  addFrontEvent: (event: FrontEvent) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleTask: (id: string) => void;
  markMessageRead: (id: string) => void;
  updateCheckIn: (c: Partial<DailyCheckIn>) => void;
  createAlter: (data: Partial<Alter>) => Promise<void>;
  updateAlter: (id: string, data: Partial<Alter>) => Promise<void>;
  createJournalEntry: (data: Partial<JournalEntry>) => Promise<void>;
  createTask: (data: Partial<SystemTask>) => Promise<void>;
  updateTask: (id: string, data: Partial<SystemTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createMessage: (data: Partial<InternalMessage>) => Promise<void>;
  createSafetyPlan: (data: Partial<SafetyPlan>) => Promise<void>;
  createCalendarEvent: (data: Partial<CalendarEvent>) => Promise<void>;
  updateCalendarEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
}

const defaultSettings: AppSettings = {
  highContrast: false, darkMode: false, fontSize: 'medium', spacing: 'normal',
  reducedMotion: false, plainLanguage: false, soundOff: true, screenReaderOptimized: false,
  themeColor: 'sage',
};

const SystemContext = createContext<SystemContextType | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const qc = useQueryClient();

  // Queries
  const altersQ = useQuery({
    queryKey: ['alters', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('alters').select('*').eq('user_id', userId!).is('archived_at', null).order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapAlter);
    },
    enabled: !!userId,
  });

  const frontQ = useQuery({
    queryKey: ['front_events', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('front_events').select('*').eq('user_id', userId!).order('start_time', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(mapFrontEvent);
    },
    enabled: !!userId,
  });

  const journalQ = useQuery({
    queryKey: ['journal_entries', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('journal_entries').select('*').eq('user_id', userId!).is('archived_at', null).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapJournal);
    },
    enabled: !!userId,
  });

  const messagesQ = useQuery({
    queryKey: ['internal_messages', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('internal_messages').select('*').eq('user_id', userId!).order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapMessage);
    },
    enabled: !!userId,
  });

  const tasksQ = useQuery({
    queryKey: ['tasks', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId!).is('archived_at', null).order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapTask);
    },
    enabled: !!userId,
  });

  const safetyQ = useQuery({
    queryKey: ['safety_plans', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('safety_plans').select('*').eq('user_id', userId!).order('created_at');
      if (error) throw error;
      return (data ?? []).map(mapSafety);
    },
    enabled: !!userId,
  });

  const calendarQ = useQuery({
    queryKey: ['calendar_events', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('calendar_events').select('*').eq('user_id', userId!).order('event_date');
      if (error) throw error;
      return (data ?? []).map(mapCalendar);
    },
    enabled: !!userId,
  });

  const today = new Date().toISOString().split('T')[0];
  const checkInQ = useQuery({
    queryKey: ['daily_check_ins', userId, today],
    queryFn: async () => {
      const { data, error } = await supabase.from('daily_check_ins').select('*').eq('user_id', userId!).eq('check_date', today).maybeSingle();
      if (error) throw error;
      return data ? mapCheckIn(data) : null;
    },
    enabled: !!userId,
  });

  const settingsQ = useQuery({
    queryKey: ['app_settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('user_id', userId!).maybeSingle();
      if (error) throw error;
      return data ? mapSettings(data) : null;
    },
    enabled: !!userId,
  });

  // Derived data
  const alters = altersQ.data ?? [];
  const frontEvents = frontQ.data ?? [];
  const journalEntries = journalQ.data ?? [];
  const messages = messagesQ.data ?? [];
  const tasks = tasksQ.data ?? [];
  const safetyPlans = safetyQ.data ?? [];
  const calendarEvents = calendarQ.data ?? [];
  const checkIn = checkInQ.data ?? null;
  const settings = settingsQ.data ?? defaultSettings;
  const currentFront = frontEvents.find(e => !e.endTime) || null;
  const isLoading = altersQ.isLoading || frontQ.isLoading || tasksQ.isLoading;

  const getAlter = useCallback((id: string) => alters.find(a => a.id === id), [alters]);

  // Apply settings to DOM
  useEffect(() => {
    const el = document.documentElement;
    if (settings.darkMode) el.classList.add('dark');
    else el.classList.remove('dark');
    if (settings.highContrast) el.classList.add('high-contrast');
    else el.classList.remove('high-contrast');
    if (settings.reducedMotion) el.classList.add('reduce-motion');
    else el.classList.remove('reduce-motion');
    el.style.fontSize = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' }[settings.fontSize];
    // Theme color
    const themes = ['sage', 'ocean', 'lavender', 'rose', 'amber', 'forest'];
    themes.forEach(t => el.classList.remove(`theme-${t}`));
    // Remove custom inline properties
    el.style.removeProperty('--primary');
    el.style.removeProperty('--ring');
    el.style.removeProperty('--sidebar-primary');
    el.style.removeProperty('--sidebar-ring');
    if (settings.themeColor === 'custom' && settings.customThemeHsl) {
      el.style.setProperty('--primary', settings.customThemeHsl);
      el.style.setProperty('--ring', settings.customThemeHsl);
      el.style.setProperty('--sidebar-primary', settings.customThemeHsl);
      el.style.setProperty('--sidebar-ring', settings.customThemeHsl);
    } else if (settings.themeColor && settings.themeColor !== 'sage') {
      el.classList.add(`theme-${settings.themeColor}`);
    }
  }, [settings]);

  // ============================================================
  // Mutations
  // ============================================================

  const setCurrentFronter = useCallback(async (alterIds: string[], status: FrontEvent['status']) => {
    if (!userId) return;
    // End current fronts
    const { data: openEvents } = await supabase.from('front_events').select('id').eq('user_id', userId).is('end_time', null);
    if (openEvents?.length) {
      await supabase.from('front_events').update({ end_time: new Date().toISOString() }).in('id', openEvents.map(e => e.id));
    }
    // Create new
    await supabase.from('front_events').insert([{
      user_id: userId,
      alter_ids: alterIds,
      status: status as Database['public']['Enums']['front_status'],
      start_time: new Date().toISOString(),
      memory_continuity: 'unknown' as Database['public']['Enums']['memory_continuity'],
    }]);
    qc.invalidateQueries({ queryKey: ['front_events', userId] });
  }, [userId, qc]);

  const addFrontEvent = useCallback(async (event: FrontEvent) => {
    if (!userId) return;
    await supabase.from('front_events').insert([{
      user_id: userId,
      alter_ids: event.alterIds,
      status: event.status as Database['public']['Enums']['front_status'],
      start_time: event.startTime,
      end_time: event.endTime || null,
      memory_continuity: event.memoryContinuity as Database['public']['Enums']['memory_continuity'],
      trigger_info: event.trigger || null,
      symptoms: event.symptoms || null,
      notes: event.notes || null,
      location: event.location || null,
    }]);
    qc.invalidateQueries({ queryKey: ['front_events', userId] });
  }, [userId, qc]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await supabase.from('tasks').update({ is_completed: !task.isCompleted }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['tasks', userId] });
  }, [tasks, userId, qc]);

  const markMessageRead = useCallback(async (id: string) => {
    await supabase.from('internal_messages').update({ is_read: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['internal_messages', userId] });
  }, [userId, qc]);

  // Debounced check-in autosave
  const checkInTimerRef = React.useRef<ReturnType<typeof setTimeout>>();
  const updateCheckIn = useCallback((c: Partial<DailyCheckIn>) => {
    if (!userId) return;
    // Optimistic update in cache
    qc.setQueryData(['daily_check_ins', userId, today], (old: DailyCheckIn | null) => {
      if (old) return { ...old, ...c };
      return null;
    });

    clearTimeout(checkInTimerRef.current);
    checkInTimerRef.current = setTimeout(async () => {
      const current = qc.getQueryData<DailyCheckIn | null>(['daily_check_ins', userId, today]);
      if (!current) {
        // Create new check-in
        await supabase.from('daily_check_ins').insert([{
          user_id: userId,
          check_date: today,
          mood: c.mood ?? 3,
          stress: c.stress ?? 3,
          pain: c.pain ?? 1,
          fatigue: c.fatigue ?? 3,
          dissociation: c.dissociation ?? 1,
          notes: c.notes || null,
        }]);
      } else {
        // Update existing
        const updateData: Record<string, unknown> = {};
        if (c.mood !== undefined) updateData.mood = c.mood;
        if (c.stress !== undefined) updateData.stress = c.stress;
        if (c.pain !== undefined) updateData.pain = c.pain;
        if (c.fatigue !== undefined) updateData.fatigue = c.fatigue;
        if (c.dissociation !== undefined) updateData.dissociation = c.dissociation;
        if (c.notes !== undefined) updateData.notes = c.notes;
        await supabase.from('daily_check_ins').update(updateData).eq('id', current.id);
      }
      qc.invalidateQueries({ queryKey: ['daily_check_ins', userId, today] });
    }, 800); // 800ms debounce for autosave
  }, [userId, today, qc]);

  const updateSettings = useCallback(async (s: Partial<AppSettings>) => {
    if (!userId) return;
    const next = { ...settings, ...s };
    qc.setQueryData(['app_settings', userId], next);

    const dbUpdate: Record<string, unknown> = {};
    if (s.highContrast !== undefined) dbUpdate.high_contrast = s.highContrast;
    if (s.darkMode !== undefined) dbUpdate.dark_mode = s.darkMode;
    if (s.fontSize !== undefined) dbUpdate.font_size = s.fontSize;
    if (s.spacing !== undefined) dbUpdate.spacing = s.spacing;
    if (s.reducedMotion !== undefined) dbUpdate.reduced_motion = s.reducedMotion;
    if (s.plainLanguage !== undefined) dbUpdate.plain_language = s.plainLanguage;
    if (s.soundOff !== undefined) dbUpdate.sound_off = s.soundOff;
    if (s.screenReaderOptimized !== undefined) dbUpdate.screen_reader_optimized = s.screenReaderOptimized;
    if (s.themeColor !== undefined) dbUpdate.theme_color = s.themeColor;

    const { data: existing } = await supabase.from('app_settings').select('user_id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await supabase.from('app_settings').update(dbUpdate).eq('user_id', userId);
    } else {
      await supabase.from('app_settings').insert([{ user_id: userId, ...dbUpdate }]);
    }
    qc.invalidateQueries({ queryKey: ['app_settings', userId] });
  }, [userId, settings, qc]);

  // CRUD mutations
  const createAlter = useCallback(async (data: Partial<Alter>) => {
    if (!userId) return;
    await supabase.from('alters').insert([{
      user_id: userId, name: data.name!, pronouns: data.pronouns || 'they/them',
      nickname: data.nickname || null, role: data.role || null, age_range: data.ageRange || null,
      species: data.species || null, communication_style: data.communicationStyle || null,
      access_needs: data.accessNeeds || null, triggers_to_avoid: data.triggersToAvoid || null,
      grounding_preferences: data.groundingPreferences || null, safe_foods: data.safeFoods || null,
      music_preferences: data.musicPreferences || null, color: data.color || null,
      emoji: data.emoji || null, notes: data.notes || null,
      visibility: (data.visibility || 'shared') as Database['public']['Enums']['visibility'],
    }]);
    qc.invalidateQueries({ queryKey: ['alters', userId] });
  }, [userId, qc]);

  const updateAlter = useCallback(async (id: string, data: Partial<Alter>) => {
    if (!userId) return;
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.pronouns !== undefined) update.pronouns = data.pronouns;
    if (data.nickname !== undefined) update.nickname = data.nickname || null;
    if (data.role !== undefined) update.role = data.role || null;
    if (data.ageRange !== undefined) update.age_range = data.ageRange || null;
    if (data.species !== undefined) update.species = data.species || null;
    if (data.communicationStyle !== undefined) update.communication_style = data.communicationStyle || null;
    if (data.accessNeeds !== undefined) update.access_needs = data.accessNeeds || null;
    if (data.triggersToAvoid !== undefined) update.triggers_to_avoid = data.triggersToAvoid || null;
    if (data.groundingPreferences !== undefined) update.grounding_preferences = data.groundingPreferences || null;
    if (data.safeFoods !== undefined) update.safe_foods = data.safeFoods || null;
    if (data.musicPreferences !== undefined) update.music_preferences = data.musicPreferences || null;
    if (data.color !== undefined) update.color = data.color || null;
    if (data.emoji !== undefined) update.emoji = data.emoji || null;
    if (data.notes !== undefined) update.notes = data.notes || null;
    if (data.visibility !== undefined) update.visibility = data.visibility;
    await supabase.from('alters').update(update).eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['alters', userId] });
  }, [userId, qc]);

  const createJournalEntry = useCallback(async (data: Partial<JournalEntry>) => {
    if (!userId) return;
    await supabase.from('journal_entries').insert([{
      user_id: userId, content: data.content!,
      title: data.title || null, alter_id: data.alterId || null,
      mood: data.mood ?? null, tags: data.tags || [],
      type: (data.type || 'text') as Database['public']['Enums']['journal_type'],
      visibility: (data.visibility || 'shared') as Database['public']['Enums']['visibility'],
    }]);
    qc.invalidateQueries({ queryKey: ['journal_entries', userId] });
  }, [userId, qc]);

  const createTask = useCallback(async (data: Partial<SystemTask>) => {
    if (!userId) return;
    await supabase.from('tasks').insert([{
      user_id: userId, title: data.title!,
      description: data.description || null,
      assigned_to: data.assignedTo || 'system',
      category: (data.category || 'general') as Database['public']['Enums']['task_category'],
      due_date: data.dueDate || null,
      is_recurring: !!data.recurrencePattern,
      recurrence_pattern: data.recurrencePattern || null,
      reminder_minutes: data.reminderMinutes ?? null,
    } as any]);
    qc.invalidateQueries({ queryKey: ['tasks', userId] });
  }, [userId, qc]);

  const updateTask = useCallback(async (id: string, data: Partial<SystemTask>) => {
    if (!userId) return;
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.description !== undefined) update.description = data.description || null;
    if (data.assignedTo !== undefined) update.assigned_to = data.assignedTo;
    if (data.category !== undefined) update.category = data.category;
    if (data.dueDate !== undefined) update.due_date = data.dueDate || null;
    if (data.reminderMinutes !== undefined) update.reminder_minutes = data.reminderMinutes ?? null;
    if (data.recurrencePattern !== undefined) {
      update.recurrence_pattern = data.recurrencePattern || null;
      update.is_recurring = !!data.recurrencePattern;
    }
    await supabase.from('tasks').update(update).eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['tasks', userId] });
  }, [userId, qc]);

  const deleteTask = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('tasks').update({ archived_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['tasks', userId] });
  }, [userId, qc]);

  const createMessage = useCallback(async (data: Partial<InternalMessage>) => {
    if (!userId) return;
    await supabase.from('internal_messages').insert([{
      user_id: userId, content: data.content!,
      from_alter_id: data.fromAlterId || null,
      to_alter_ids: data.toAlterIds || [],
      priority: (data.priority || 'normal') as Database['public']['Enums']['message_priority'],
    }]);
    qc.invalidateQueries({ queryKey: ['internal_messages', userId] });
  }, [userId, qc]);

  const createSafetyPlan = useCallback(async (data: Partial<SafetyPlan>) => {
    if (!userId) return;
    await supabase.from('safety_plans').insert([{
      user_id: userId,
      title: data.title!,
      type: data.type as Database['public']['Enums']['safety_plan_type'],
      steps: data.steps || [],
      trusted_contacts: JSON.parse(JSON.stringify(data.trustedContacts || [])),
      notes: data.notes || null,
    }]);
    qc.invalidateQueries({ queryKey: ['safety_plans', userId] });
  }, [userId, qc]);

  const createCalendarEvent = useCallback(async (data: Partial<CalendarEvent>) => {
    if (!userId) return;
    await supabase.from('calendar_events').insert([{
      user_id: userId,
      title: data.title!,
      event_date: data.date!,
      event_time: data.time || null,
      preferred_fronter: data.preferredFronter || null,
      support_needed: data.supportNeeded || null,
      sensory_prep: data.sensoryPrep || null,
      recovery_time: data.recoveryTime || null,
      transport_notes: data.transportNotes || null,
      notes: data.notes || null,
      reminder_minutes: data.reminderMinutes ?? null,
    }]);
    qc.invalidateQueries({ queryKey: ['calendar_events', userId] });
  }, [userId, qc]);

  const updateCalendarEvent = useCallback(async (id: string, data: Partial<CalendarEvent>) => {
    if (!userId) return;
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.date !== undefined) update.event_date = data.date;
    if (data.time !== undefined) update.event_time = data.time || null;
    if (data.preferredFronter !== undefined) update.preferred_fronter = data.preferredFronter || null;
    if (data.supportNeeded !== undefined) update.support_needed = data.supportNeeded || null;
    if (data.sensoryPrep !== undefined) update.sensory_prep = data.sensoryPrep || null;
    if (data.recoveryTime !== undefined) update.recovery_time = data.recoveryTime || null;
    if (data.transportNotes !== undefined) update.transport_notes = data.transportNotes || null;
    if (data.notes !== undefined) update.notes = data.notes || null;
    if (data.reminderMinutes !== undefined) update.reminder_minutes = data.reminderMinutes ?? null;
    await supabase.from('calendar_events').update(update).eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['calendar_events', userId] });
  }, [userId, qc]);

  const deleteCalendarEvent = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', userId);
    qc.invalidateQueries({ queryKey: ['calendar_events', userId] });
  }, [userId, qc]);

  return (
    <SystemContext.Provider value={{
      alters, frontEvents, currentFront, journalEntries, messages, tasks,
      safetyPlans, calendarEvents, checkIn, settings, isLoading,
      getAlter, setCurrentFronter, addFrontEvent, updateSettings,
      toggleTask, markMessageRead, updateCheckIn,
      createAlter, updateAlter, createJournalEntry, createTask, updateTask, deleteTask, createMessage,
      createSafetyPlan, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
    }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within SystemProvider');
  return ctx;
}
