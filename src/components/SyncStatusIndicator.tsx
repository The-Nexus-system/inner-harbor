import { useSync, type SyncStatus } from '@/contexts/SyncContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Cloud, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<SyncStatus, {
  icon: typeof Cloud; label: string; color: string; pulse: boolean;
}> = {
  synced: { icon: Cloud, label: 'Synced', color: 'text-emerald-500', pulse: false },
  syncing: { icon: RefreshCw, label: 'Syncing…', color: 'text-primary', pulse: true },
  offline: { icon: CloudOff, label: 'Offline', color: 'text-amber-500', pulse: false },
  error: { icon: AlertTriangle, label: 'Sync issue', color: 'text-destructive', pulse: false },
};

export function SyncStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { status, pendingCount, lastSyncedAt, isOnline } = useSync();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const lastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  const tooltipText = [
    config.label,
    `Last sync: ${lastSync}`,
    pendingCount > 0 ? `${pendingCount} pending change${pendingCount > 1 ? 's' : ''}` : null,
    !isOnline ? 'Changes will sync when you reconnect' : null,
  ].filter(Boolean).join('\n');

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className={cn('relative flex items-center gap-1 p-1 rounded-md hover:bg-muted/50 transition-colors', config.color)}
            aria-label={tooltipText}
          >
            <Icon className={cn('h-4 w-4', config.pulse && 'animate-spin')} aria-hidden="true" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="whitespace-pre-line text-xs">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex items-center gap-1.5 text-xs', config.color)} role="status">
          <Icon className={cn('h-3.5 w-3.5', config.pulse && 'animate-spin')} aria-hidden="true" />
          <span>{config.label}</span>
          {pendingCount > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 px-1 tabular-nums">
              {pendingCount}
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="whitespace-pre-line text-xs">
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}
