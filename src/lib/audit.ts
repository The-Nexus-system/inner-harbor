/**
 * Mosaic — Audit Logging
 * 
 * Records sensitive actions to the audit_log table.
 * Append-only by design — entries cannot be modified or deleted.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'password_change'
  | 'password_reset_request'
  | 'data_export'
  | 'safety_plan_access'
  | 'settings_change'
  | 'account_update'
  | 'alter_create'
  | 'alter_update'
  | 'alter_archive'
  | 'journal_create'
  | 'journal_delete';

interface AuditEntry {
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('audit_log').insert([{
      user_id: user.id,
      action: entry.action,
      resource_type: entry.resource_type || null,
      resource_id: entry.resource_id || null,
      metadata: (entry.metadata || {}) as Record<string, unknown>,
    }]);

    if (error) {
      logger.error('Failed to write audit log', { error: error.message, entry });
    }
  } catch (err) {
    logger.error('Audit logging error', { error: String(err) });
  }
}
