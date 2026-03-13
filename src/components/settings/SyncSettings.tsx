import { useSync, type ConflictStrategy } from '@/contexts/SyncContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { Cloud, Trash2, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const CONFLICT_LABELS: Record<ConflictStrategy, { label: string; desc: string }> = {
  'last-write-wins': { label: 'Last write wins', desc: 'Most recent change is kept automatically' },
  'keep-local': { label: 'Keep local', desc: 'Your device\'s version is always preferred' },
  'keep-remote': { label: 'Keep remote', desc: 'The server version is always preferred' },
  'ask': { label: 'Ask me', desc: 'You\'ll be prompted to choose when conflicts occur' },
};

const INTERVAL_OPTIONS = [
  { value: '1', label: '1 minute' },
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
];

export default function SyncSettings() {
  const {
    status, isOnline, lastSyncedAt, pendingCount, pendingMutations,
    conflictStrategy, autoSync, syncIntervalMinutes, deviceId,
    setConflictStrategy, setAutoSync, setSyncInterval,
    flushQueue, clearQueue,
  } = useSync();

  const lastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString()
    : 'Not yet synced';

  return (
    <div className="space-y-4">
      {/* Status overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Cloud className="h-4 w-4" aria-hidden="true" />
            Sync status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Connection</span>
            <SyncStatusIndicator />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Last synced</span>
            <span className="text-sm tabular-nums">{lastSync}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending changes</span>
            <Badge variant={pendingCount > 0 ? 'default' : 'secondary'} className="tabular-nums">
              {pendingCount}
            </Badge>
          </div>

          {pendingCount > 0 && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => flushQueue()}>
                <RefreshCw className="h-3.5 w-3.5" /> Sync now
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-destructive" onClick={clearQueue}>
                <Trash2 className="h-3.5 w-3.5" /> Discard queue
              </Button>
            </div>
          )}

          {pendingCount > 0 && (
            <details className="pt-1">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                View pending mutations ({pendingCount})
              </summary>
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {pendingMutations.map(m => (
                  <div key={m.id} className="text-xs bg-muted rounded px-2 py-1 flex items-center justify-between">
                    <span className="font-mono">{m.operation} → {m.table}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {m.retries > 0 && ` (retry ${m.retries})`}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      {/* Sync behavior */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Sync behavior</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-sync</Label>
              <p className="text-xs text-muted-foreground">Automatically sync pending changes on a schedule</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          {autoSync && (
            <div className="flex items-center justify-between">
              <Label className="text-sm">Sync interval</Label>
              <Select
                value={String(syncIntervalMinutes)}
                onValueChange={(v) => setSyncInterval(Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm font-medium">Conflict resolution</Label>
            <p className="text-xs text-muted-foreground">
              How to handle conflicts when the same record is changed on multiple devices.
            </p>
            <div className="space-y-1.5 pt-1">
              {(Object.entries(CONFLICT_LABELS) as [ConflictStrategy, { label: string; desc: string }][]).map(([key, { label, desc }]) => (
                <label
                  key={key}
                  className={`flex items-start gap-2.5 p-2.5 rounded-md border cursor-pointer tap-target transition-colors ${
                    conflictStrategy === key ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="conflict-strategy"
                    value={key}
                    checked={conflictStrategy === key}
                    onChange={() => setConflictStrategy(key)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            This device
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Device ID</span>
            <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded select-all">
              {deviceId.slice(0, 8)}
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Browser</span>
            <span className="text-sm">{getBrowserName()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Platform</span>
            <span className="text-sm">{navigator.platform || 'Unknown'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
}
