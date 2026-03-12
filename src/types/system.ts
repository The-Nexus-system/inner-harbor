// Core types for the plural system management app

export type Visibility = 'private' | 'shared' | 'emergency-only';

export type FrontStatus =
  | 'fronting'
  | 'co-fronting'
  | 'co-conscious'
  | 'passive-influence'
  | 'blurry'
  | 'unknown'
  | 'dormant'
  | 'unavailable'
  | 'stuck'
  | 'nonverbal';

export type MemoryContinuity = 'present' | 'partial' | 'absent' | 'unknown';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface Alter {
  id: string;
  name: string;
  nickname?: string;
  pronouns: string;
  role?: string;
  ageRange?: string;
  species?: string;
  communicationStyle?: string;
  accessNeeds?: string;
  triggersToAvoid?: string;
  groundingPreferences?: string;
  safeFoods?: string;
  musicPreferences?: string;
  frontingConfidence?: 'high' | 'medium' | 'low' | 'uncertain';
  color?: string;
  emoji?: string;
  notes?: string;
  visibility: Visibility;
  privateFields?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface FrontEvent {
  id: string;
  alterIds: string[];
  status: FrontStatus;
  startTime: string;
  endTime?: string;
  memoryContinuity: MemoryContinuity;
  trigger?: string;
  symptoms?: string;
  notes?: string;
  location?: string;
}

export interface JournalEntry {
  id: string;
  alterId?: string; // undefined = unknown fronter
  title?: string;
  content: string;
  mood?: MoodLevel;
  type: 'text' | 'mood' | 'sensory' | 'flashback' | 'medical' | 'seizure' | 'victory' | 'memory-reconstruction';
  tags: string[];
  visibility: Visibility;
  createdAt: string;
}

export interface InternalMessage {
  id: string;
  fromAlterId?: string;
  toAlterIds: string[]; // empty = system-wide
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isPinned: boolean;
  isRead: boolean;
  createdAt: string;
}

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface SystemTask {
  id: string;
  title: string;
  description?: string;
  assignedTo: 'system' | 'next-fronter' | string; // alter ID or special values
  isCompleted: boolean;
  dueDate?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  category: 'general' | 'medication' | 'hygiene' | 'meals' | 'hydration' | 'therapy' | 'mobility' | 'community';
  createdAt: string;
}

export interface SafetyPlan {
  id: string;
  type: 'grounding' | 'crisis' | 'shutdown' | 'meltdown' | 'flashback' | 'seizure' | 'medical' | 'hospital-card';
  title: string;
  steps: string[];
  trustedContacts: { name: string; phone?: string; relationship: string }[];
  notes?: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  preferredFronter?: string;
  supportNeeded?: string;
  sensoryPrep?: string;
  recoveryTime?: string;
  transportNotes?: string;
  notes?: string;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  alterId?: string;
  mood: MoodLevel;
  stress: MoodLevel;
  pain: MoodLevel;
  fatigue: MoodLevel;
  dissociation: MoodLevel;
  seizureRisk?: MoodLevel;
  notes?: string;
}

export interface AppSettings {
  highContrast: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  spacing: 'compact' | 'normal' | 'spacious';
  reducedMotion: boolean;
  plainLanguage: boolean;
  soundOff: boolean;
  screenReaderOptimized: boolean;
}
