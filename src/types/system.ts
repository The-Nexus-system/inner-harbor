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

export type InterfaceMode = 'standard' | 'simplified' | 'minimal';

export type PermissionScope =
  | 'edit_safety_plans'
  | 'edit_system_agreements'
  | 'modify_integrations'
  | 'manage_calendar'
  | 'modify_alter_profiles'
  | 'manage_settings'
  | 'manage_support_portal';

export interface AlterPermission {
  id: string;
  alterId: string;
  scope: PermissionScope;
  granted: boolean;
}

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
  interfaceMode: InterfaceMode;
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
  alterId?: string;
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
  toAlterIds: string[];
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
  assignedTo: 'system' | 'next-fronter' | string;
  isCompleted: boolean;
  dueDate?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  reminderMinutes?: number;
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
  reminderMinutes?: number;
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

export interface HandoffNote {
  id: string;
  frontEventId?: string;
  currentActivity?: string;
  unfinishedTasks?: string;
  emotionalState?: string;
  importantReminders?: string;
  warnings?: string;
  createdAt: string;
}

export interface ContextSnapshot {
  id: string;
  snapshotTime: string;
  frontAlterIds: string[];
  frontStatus?: string;
  activeTasks: Array<{ id: string; title: string }>;
  calendarContext: Array<{ id: string; title: string; time?: string }>;
  mood?: number;
  stress?: number;
  energy?: number;
  notes?: string;
  location?: string;
  createdAt: string;
}

export type DashboardSection =
  | 'front' | 'tasks' | 'messages' | 'journal' | 'calendar'
  | 'safety' | 'checkin' | 'notes' | 'insights' | 'summary' | 'trends' | 'handoff' | 'capacity' | 'medications'
  | 'sensory' | 'communication';

export interface CapacityEntry {
  id: string;
  label: string;
  cost: number;
  time: string;
}

export interface CapacityBudget {
  id: string;
  budgetDate: string;
  totalSpoons: number;
  entries: CapacityEntry[];
  notes?: string;
  createdAt: string;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  icon: string;
  color?: string;
  visibleSections: DashboardSection[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export type ThemeColor = 'sage' | 'ocean' | 'lavender' | 'rose' | 'amber' | 'forest' | 'custom';

export interface AppSettings {
  highContrast: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  spacing: 'compact' | 'normal' | 'spacious';
  reducedMotion: boolean;
  plainLanguage: boolean;
  soundOff: boolean;
  screenReaderOptimized: boolean;
  themeColor: ThemeColor;
  customThemeHsl?: string;
  autoSwitchInterface: boolean;
}

// Feature Group F: Support Portal
export type SupportContactRole = 'caregiver' | 'therapist' | 'doctor' | 'family' | 'friend' | 'other';
export type SharedSection = 'safety' | 'calendar' | 'tasks' | 'medications' | 'checkin';

export interface SupportContact {
  id: string;
  name: string;
  role: SupportContactRole;
  email?: string;
  phone?: string;
  notes?: string;
  shareToken: string;
  sharedSections: SharedSection[];
  isActive: boolean;
  lastAccessedAt?: string;
  createdAt: string;
}

// Feature Group G: Medication Tracking
export type MedicationFrequency = 'daily' | 'twice-daily' | 'weekly' | 'as-needed' | 'custom';
export type MedicationLogStatus = 'taken' | 'skipped' | 'late' | 'missed';

export interface Medication {
  id: string;
  name: string;
  dosage?: string;
  frequency: MedicationFrequency;
  scheduleTimes: string[];
  prescriber?: string;
  pharmacy?: string;
  purpose?: string;
  sideEffects?: string;
  notes?: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  status: MedicationLogStatus;
  scheduledTime?: string;
  takenAt: string;
  notes?: string;
  createdAt: string;
}
