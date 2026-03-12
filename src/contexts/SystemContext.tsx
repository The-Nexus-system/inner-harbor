import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Alter, FrontEvent, JournalEntry, InternalMessage, SystemTask, SafetyPlan, CalendarEvent, DailyCheckIn, AppSettings } from '@/types/system';
import { demoAlters, demoFrontEvents, demoJournalEntries, demoMessages, demoTasks, demoSafetyPlans, demoCalendarEvents, demoCheckIn } from '@/data/demo-data';

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
  getAlter: (id: string) => Alter | undefined;
  setCurrentFronter: (alterIds: string[], status: FrontEvent['status']) => void;
  addFrontEvent: (event: FrontEvent) => void;
  updateSettings: (s: Partial<AppSettings>) => void;
  toggleTask: (id: string) => void;
  markMessageRead: (id: string) => void;
  updateCheckIn: (c: Partial<DailyCheckIn>) => void;
}

const SystemContext = createContext<SystemContextType | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [alters] = useState<Alter[]>(demoAlters);
  const [frontEvents, setFrontEvents] = useState<FrontEvent[]>(demoFrontEvents);
  const [journalEntries] = useState<JournalEntry[]>(demoJournalEntries);
  const [messages, setMessages] = useState<InternalMessage[]>(demoMessages);
  const [tasks, setTasks] = useState<SystemTask[]>(demoTasks);
  const [safetyPlans] = useState<SafetyPlan[]>(demoSafetyPlans);
  const [calendarEvents] = useState<CalendarEvent[]>(demoCalendarEvents);
  const [checkIn, setCheckIn] = useState<DailyCheckIn | null>(demoCheckIn);
  const [settings, setSettings] = useState<AppSettings>({
    highContrast: false,
    darkMode: false,
    fontSize: 'medium',
    spacing: 'normal',
    reducedMotion: false,
    plainLanguage: false,
    soundOff: true,
    screenReaderOptimized: false,
  });

  const getAlter = useCallback((id: string) => alters.find(a => a.id === id), [alters]);

  const currentFront = frontEvents.find(e => !e.endTime) || null;

  const setCurrentFronter = useCallback((alterIds: string[], status: FrontEvent['status']) => {
    setFrontEvents(prev => {
      const updated = prev.map(e => e.endTime ? e : { ...e, endTime: new Date().toISOString() });
      const newEvent: FrontEvent = {
        id: `front-${Date.now()}`,
        alterIds,
        status,
        startTime: new Date().toISOString(),
        memoryContinuity: 'unknown',
      };
      return [...updated, newEvent];
    });
  }, []);

  const addFrontEvent = useCallback((event: FrontEvent) => {
    setFrontEvents(prev => [...prev, event]);
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...s };
      // Apply dark mode
      if (next.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      // Apply high contrast
      if (next.highContrast) document.documentElement.classList.add('high-contrast');
      else document.documentElement.classList.remove('high-contrast');
      // Apply reduced motion
      if (next.reducedMotion) document.documentElement.classList.add('reduce-motion');
      else document.documentElement.classList.remove('reduce-motion');
      // Font size
      document.documentElement.style.fontSize = { small: '14px', medium: '16px', large: '18px', xlarge: '20px' }[next.fontSize];
      return next;
    });
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t));
  }, []);

  const markMessageRead = useCallback((id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  }, []);

  const updateCheckIn = useCallback((c: Partial<DailyCheckIn>) => {
    setCheckIn(prev => prev ? { ...prev, ...c } : null);
  }, []);

  return (
    <SystemContext.Provider value={{
      alters, frontEvents, currentFront, journalEntries, messages, tasks, safetyPlans, calendarEvents, checkIn, settings,
      getAlter, setCurrentFronter, addFrontEvent, updateSettings, toggleTask, markMessageRead, updateCheckIn,
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
