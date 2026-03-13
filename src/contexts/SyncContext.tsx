/**
 * Mosaic — Sync Context
 *
 * Tracks online/offline status, pending mutations, last sync time,
 * and provides an offline-tolerant mutation queue that replays
 * when connectivity is restored.
 */

import {
  createContext, useContext, useCallback, useEffect, useRef,
  useState, type ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export type ConflictStrategy = 'last-write-wins' | 'keep-local' | 'keep-remote' | 'ask';

export interface PendingMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  payload: Record<string, unknown>;
  createdAt: string;
  retries: number;
}

export interface SyncState {
  status: SyncStatus;
  isOnline: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
  pendingMutations: PendingMutation[];
  conflictStrategy: ConflictStrategy;
  autoSync: boolean;
  syncIntervalMinutes: number;
  deviceId: string;
}

interface SyncContextValue extends SyncState {
  queueMutation: (mutation: Omit<PendingMutation, 'id' | 'createdAt' | 'retries'>) => void;
  flushQueue: () => Promise<void>;
  setConflictStrategy: (s: ConflictStrategy) => void;
  setAutoSync: (v: boolean) => void;
  setSyncInterval: (mins: number) => void;
  clearQueue: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

// ─── Device ID (persistent) ─────────────────────────────────
function getDeviceId(): string {
  const key = 'mosaic-device-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

// ─── Queue persistence ──────────────────────────────────────
const QUEUE_KEY = 'mosaic-sync-queue';
const SETTINGS_KEY = 'mosaic-sync-settings';

function loadQueue(): PendingMutation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(q: PendingMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

interface SyncSettings {
  conflictStrategy: ConflictStrategy;
  autoSync: boolean;
  syncIntervalMinutes: number;
}

function loadSettings(): SyncSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { conflictStrategy: 'last-write-wins', autoSync: true, syncIntervalMinutes: 5 };
}

function saveSettings(s: SyncSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Provider ───────────────────────────────────────────────
export function SyncProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [queue, setQueue] = useState<PendingMutation[]>(loadQueue);
  const [settings, setSettings] = useState<SyncSettings>(loadSettings);
  const flushingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const deviceId = useRef(getDeviceId()).current;

  // ─── Online/offline detection ──────────────────────────
  useEffect(() => {
    const goOnline = () => { setIsOnline(true); setStatus('synced'); };
    const goOffline = () => { setIsOnline(false); setStatus('offline'); };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // ─── Persist queue ─────────────────────────────────────
  useEffect(() => { saveQueue(queue); }, [queue]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // ─── Queue a mutation ──────────────────────────────────
  const queueMutation = useCallback((m: Omit<PendingMutation, 'id' | 'createdAt' | 'retries'>) => {
    const mutation: PendingMutation = {
      ...m,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      retries: 0,
    };
    setQueue(prev => [...prev, mutation]);

    if (!isOnline) {
      toast.info('You\'re offline. Changes will sync when you reconnect.', { id: 'offline-queue' });
    }
  }, [isOnline]);

  // ─── Flush queue ───────────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (flushingRef.current || queue.length === 0 || !isOnline) return;
    flushingRef.current = true;
    setStatus('syncing');

    const remaining: PendingMutation[] = [];

    for (const mutation of queue) {
      try {
        const { table, operation, payload } = mutation;
        let result;

        switch (operation) {
          case 'insert':
            result = await supabase.from(table).insert(payload as any);
            break;
          case 'update':
            if ('id' in payload) {
              const { id, ...rest } = payload;
              result = await supabase.from(table).update(rest as any).eq('id', id as string);
            }
            break;
          case 'upsert':
            result = await supabase.from(table).upsert(payload as any);
            break;
          case 'delete':
            if ('id' in payload) {
              result = await supabase.from(table).delete().eq('id', payload.id as string);
            }
            break;
        }

        if (result?.error) {
          logger.warn('Sync mutation failed', { mutation: mutation.id, error: result.error.message });
          if (mutation.retries < 3) {
            remaining.push({ ...mutation, retries: mutation.retries + 1 });
          } else {
            logger.error('Sync mutation dropped after retries', { mutation });
            toast.error(`Failed to sync a change to ${table}. It has been discarded.`);
          }
        }
      } catch (err) {
        logger.error('Sync flush error', { mutation: mutation.id, err });
        if (mutation.retries < 3) {
          remaining.push({ ...mutation, retries: mutation.retries + 1 });
        }
      }
    }

    setQueue(remaining);
    setLastSyncedAt(new Date().toISOString());
    setStatus(remaining.length > 0 ? 'error' : 'synced');
    flushingRef.current = false;

    if (remaining.length === 0 && queue.length > 0) {
      toast.success('All pending changes synced successfully.');
    }
  }, [queue, isOnline]);

  // ─── Auto-flush on reconnect ──────────────────────────
  useEffect(() => {
    if (isOnline && queue.length > 0) {
      const timer = setTimeout(() => flushQueue(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queue.length, flushQueue]);

  // ─── Periodic sync ────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (settings.autoSync && settings.syncIntervalMinutes > 0) {
      intervalRef.current = setInterval(() => {
        if (isOnline && queue.length > 0) flushQueue();
      }, settings.syncIntervalMinutes * 60 * 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [settings.autoSync, settings.syncIntervalMinutes, isOnline, queue.length, flushQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    toast.success('Pending sync queue cleared.');
  }, []);

  const value: SyncContextValue = {
    status,
    isOnline,
    lastSyncedAt,
    pendingCount: queue.length,
    pendingMutations: queue,
    conflictStrategy: settings.conflictStrategy,
    autoSync: settings.autoSync,
    syncIntervalMinutes: settings.syncIntervalMinutes,
    deviceId,
    queueMutation,
    flushQueue,
    setConflictStrategy: (s) => setSettings(prev => ({ ...prev, conflictStrategy: s })),
    setAutoSync: (v) => setSettings(prev => ({ ...prev, autoSync: v })),
    setSyncInterval: (mins) => setSettings(prev => ({ ...prev, syncIntervalMinutes: mins })),
    clearQueue,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
