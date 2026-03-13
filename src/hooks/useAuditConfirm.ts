/**
 * Hook for sensitive action confirmation with audit logging.
 * Wraps an action in a confirmation dialog and logs it to the audit trail.
 */
import { useState, useCallback } from "react";
import { logAuditEvent, type AuditAction } from "@/lib/audit";

interface SensitiveAction {
  title: string;
  description: string;
  confirmLabel?: string;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  onConfirm: () => void | Promise<void>;
}

export function useAuditConfirm() {
  const [pending, setPending] = useState<SensitiveAction | null>(null);

  const requestConfirmation = useCallback((action: SensitiveAction) => {
    setPending(action);
  }, []);

  const confirm = useCallback(async () => {
    if (!pending) return;
    await logAuditEvent({
      action: pending.action,
      resource_type: pending.resourceType,
      resource_id: pending.resourceId,
      metadata: pending.metadata,
    });
    await pending.onConfirm();
    setPending(null);
  }, [pending]);

  const cancel = useCallback(() => {
    setPending(null);
  }, []);

  return {
    pending,
    isOpen: !!pending,
    requestConfirmation,
    confirm,
    cancel,
    dialogProps: pending
      ? {
          open: true,
          onOpenChange: (open: boolean) => { if (!open) cancel(); },
          title: pending.title,
          description: pending.description,
          confirmLabel: pending.confirmLabel || "Continue",
          destructive: false,
          onConfirm: confirm,
        }
      : null,
  };
}
