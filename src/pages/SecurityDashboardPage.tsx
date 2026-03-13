import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Shield, LogOut, Clock, Monitor, History, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit";

interface LoginEntry {
  id: string;
  login_at: string;
  device_label: string | null;
  user_agent: string | null;
  success: boolean;
  logout_at: string | null;
}

interface AuditEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  login: "Signed in",
  logout: "Signed out",
  password_change: "Changed password",
  password_reset_request: "Requested password reset",
  data_export: "Exported data",
  safety_plan_access: "Viewed safety plan",
  settings_change: "Changed settings",
  account_update: "Updated account",
  alter_create: "Created alter profile",
  alter_update: "Updated alter profile",
  alter_archive: "Archived alter",
  journal_create: "Created journal entry",
  journal_delete: "Deleted journal entry",
  share_create: "Created share link",
  share_revoke: "Revoked share access",
  share_update: "Updated share settings",
  integration_change: "Changed integration",
  ics_regenerate: "Regenerated calendar link",
  session_revoke_all: "Signed out all other sessions",
  permission_change: "Changed permissions",
};

function parseDeviceLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  if (ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")) return "Mobile device";
  if (ua.includes("Tablet") || ua.includes("iPad")) return "Tablet";
  if (ua.includes("Firefox")) return "Firefox browser";
  if (ua.includes("Chrome")) return "Chrome browser";
  if (ua.includes("Safari")) return "Safari browser";
  if (ua.includes("Edge")) return "Edge browser";
  return "Desktop browser";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function SecurityDashboardPage() {
  const { user } = useAuth();
  const [logins, setLogins] = useState<LoginEntry[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [auditPage, setAuditPage] = useState(0);
  const AUDIT_PAGE_SIZE = 20;

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [loginRes, auditRes] = await Promise.all([
      supabase
        .from("login_history")
        .select("id, login_at, device_label, user_agent, success, logout_at")
        .eq("user_id", user.id)
        .order("login_at", { ascending: false })
        .limit(50),
      supabase
        .from("audit_log")
        .select("id, action, resource_type, resource_id, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(auditPage * AUDIT_PAGE_SIZE, (auditPage + 1) * AUDIT_PAGE_SIZE - 1),
    ]);
    if (loginRes.data) setLogins(loginRes.data);
    if (auditRes.data) setAuditLog(auditRes.data as AuditEntry[]);
    setLoading(false);
  }, [user, auditPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRevokeAll = async () => {
    // Sign out all other sessions by signing out globally and re-signing in
    // Supabase supports signOut({ scope: 'others' }) 
    const { error } = await supabase.auth.signOut({ scope: "others" as any });
    if (error) {
      toast.error("Could not sign out other sessions. Please try again.");
    } else {
      await logAuditEvent({ action: "session_revoke_all" as any });
      toast.success("All other sessions have been signed out. Only this device remains active.");
      fetchData();
    }
    setRevokeAllOpen(false);
  };

  const currentSession = logins[0];
  const otherSessions = logins.slice(1);

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" aria-hidden="true" />
          Security &amp; Sessions
        </h1>
        <p className="text-muted-foreground mt-1">
          Review your login history, manage active sessions, and view a record of important actions.
        </p>
      </header>

      {/* Current session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Monitor className="h-5 w-5" aria-hidden="true" />
            Current session
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading session information…</p>
          ) : currentSession ? (
            <div className="space-y-1">
              <p className="font-medium">
                {currentSession.device_label || parseDeviceLabel(currentSession.user_agent)}
              </p>
              <p className="text-sm text-muted-foreground">
                Signed in {timeAgo(currentSession.login_at)}
              </p>
              <Badge variant="outline" className="text-xs mt-1">Active now</Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No session information available.</p>
          )}
        </CardContent>
      </Card>

      {/* Sign out other sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <LogOut className="h-5 w-5" aria-hidden="true" />
            Other sessions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            If you suspect someone else has access to your account, you can sign out all other devices.
            This will not affect your current session.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {otherSessions.length > 0 ? (
            <div className="space-y-2">
              {otherSessions.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">
                      {entry.device_label || parseDeviceLabel(entry.user_agent)}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(entry.login_at)}</p>
                  </div>
                  {!entry.logout_at && (
                    <Badge variant="secondary" className="text-xs">May be active</Badge>
                  )}
                  {entry.logout_at && (
                    <Badge variant="outline" className="text-xs">Signed out</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No other recent sessions found.</p>
          )}

          <Button
            variant="outline"
            onClick={() => setRevokeAllOpen(true)}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out all other sessions
          </Button>
        </CardContent>
      </Card>

      {/* Recent login history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Clock className="h-5 w-5" aria-hidden="true" />
            Recent login history
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A record of recent sign-in attempts to your account.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading…</p>
          ) : logins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No login history recorded yet.</p>
          ) : (
            <div role="list" aria-label="Login history">
              {logins.slice(0, 20).map((entry) => (
                <div key={entry.id} role="listitem" className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {entry.device_label || parseDeviceLabel(entry.user_agent)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.login_at).toLocaleString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "numeric", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {entry.success ? (
                    <Badge variant="outline" className="text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700">
                      Successful
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                      Failed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Audit trail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <History className="h-5 w-5" aria-hidden="true" />
            Activity log
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A record of important actions taken in your account. This log cannot be edited or deleted.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground" role="status">Loading activity log…</p>
          ) : auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-0" role="list" aria-label="Activity log">
              {auditLog.map((entry) => (
                <div key={entry.id} role="listitem" className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </p>
                    {entry.resource_type && (
                      <p className="text-xs text-muted-foreground">
                        {entry.resource_type}{entry.resource_id ? ` • ${entry.resource_id.slice(0, 8)}…` : ""}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0" dateTime={entry.created_at}>
                    {timeAgo(entry.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}

          {auditLog.length >= AUDIT_PAGE_SIZE && (
            <div className="flex justify-between mt-4 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={auditPage === 0}
                onClick={() => setAuditPage(p => p - 1)}
              >
                Newer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuditPage(p => p + 1)}
              >
                Older
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security tips */}
      <Card className="border-l-4 border-l-amber-400/60">
        <CardContent className="p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Security reminders</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use a strong, unique password for this account</li>
              <li>Review your login history regularly for unfamiliar activity</li>
              <li>Sign out of shared or public devices after use</li>
              <li>Review and revoke support portal shares you no longer need</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="Sign out all other sessions?"
        description="This will sign out every session except the one you are using right now. Anyone else currently using your account on another device will need to sign in again. Your current session will not be affected."
        confirmLabel="Sign out others"
        destructive={false}
        onConfirm={handleRevokeAll}
      />
    </div>
  );
}
