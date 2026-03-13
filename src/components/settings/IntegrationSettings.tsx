import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Link2, Rss, Smartphone, Copy, RefreshCw, AlertTriangle, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function IntegrationSettings() {
  const { user } = useAuth();
  const [icsFeedEnabled, setIcsFeedEnabled] = useState(false);
  const [icsFeedToken, setIcsFeedToken] = useState<string | null>(null);
  const [icsFeedFilter, setIcsFeedFilter] = useState("all");
  const [googleStatus, setGoogleStatus] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;
    setLoading(false);

    // Load ICS feed settings from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("ics_feed_enabled, ics_feed_token, ics_feed_filter")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      setIcsFeedEnabled(profile.ics_feed_enabled ?? false);
      setIcsFeedToken(profile.ics_feed_token ?? null);
      setIcsFeedFilter(profile.ics_feed_filter ?? "all");
    }

    // Load Google Calendar account status
    const { data: googleAccount } = await supabase
      .from("calendar_accounts")
      .select("status, account_email")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    if (googleAccount) {
      setGoogleStatus(googleAccount.status);
      setGoogleEmail(googleAccount.account_email);
    }
  };

  const generateFeedToken = () => {
    return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  };

  const toggleIcsFeed = async (enabled: boolean) => {
    if (!user) return;
    const token = enabled && !icsFeedToken ? generateFeedToken() : icsFeedToken;

    const { error } = await supabase
      .from("profiles")
      .update({
        ics_feed_enabled: enabled,
        ics_feed_token: token,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update feed settings");
      return;
    }

    setIcsFeedEnabled(enabled);
    if (token) setIcsFeedToken(token);
    toast.success(enabled ? "ICS feed enabled" : "ICS feed disabled");
  };

  const regenerateFeedToken = async () => {
    if (!user) return;
    const token = generateFeedToken();

    const { error } = await supabase
      .from("profiles")
      .update({ ics_feed_token: token })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to regenerate feed URL");
      return;
    }

    setIcsFeedToken(token);
    toast.success("Feed URL regenerated. Update your calendar subscription with the new URL.");
  };

  const updateFeedFilter = async (filter: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ ics_feed_filter: filter })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update feed filter");
      return;
    }

    setIcsFeedFilter(filter);
  };

  const feedUrl = icsFeedToken
    ? `${window.location.origin}/api/ics-feed/${icsFeedToken}`
    : null;

  const copyFeedUrl = () => {
    if (feedUrl) {
      navigator.clipboard.writeText(feedUrl);
      toast.success("Feed URL copied to clipboard");
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg font-heading">Google Calendar</CardTitle>
          </div>
          <CardDescription>
            Sync events between this app and Google Calendar. You control what syncs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleStatus === "connected" ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> Connected
                </Badge>
                {googleEmail && <span className="text-sm text-muted-foreground">{googleEmail}</span>}
              </div>
              <p className="text-sm text-muted-foreground">
                You can manage which events sync from the Calendar page. Private notes and emergency-only content are never synced.
              </p>
              <Button variant="outline" size="sm" className="gap-2 text-destructive">
                <Link2 className="h-4 w-4" /> Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-dashed p-4 text-center space-y-2">
                <CalendarDays className="h-8 w-8 mx-auto text-muted-foreground" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">
                  Connect your Google account to import and export calendar events.
                </p>
                <p className="text-xs text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 inline mr-1" aria-hidden="true" />
                  Only event titles, dates, and times are shared. Private alter notes, emergency content, and hidden fields are never sent to Google.
                </p>
              </div>
              <Button className="gap-2" disabled>
                <ExternalLink className="h-4 w-4" /> Connect Google Calendar
                <Badge variant="secondary" className="ml-1 text-xs">Coming soon</Badge>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ICS Subscription Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg font-heading">Calendar Subscription (ICS)</CardTitle>
          </div>
          <CardDescription>
            Generate a private URL to subscribe from Apple Calendar, Outlook, or any calendar app. Read-only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="ics-feed-toggle" className="flex-1">
              <span className="font-medium">Enable subscription feed</span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Creates a private URL that calendar apps can subscribe to.
              </p>
            </Label>
            <Switch
              id="ics-feed-toggle"
              checked={icsFeedEnabled}
              onCheckedChange={toggleIcsFeed}
            />
          </div>

          {icsFeedEnabled && feedUrl && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label htmlFor="feed-filter">Events to include</Label>
                <Select value={icsFeedFilter} onValueChange={updateFeedFilter}>
                  <SelectTrigger id="feed-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All events (excluding private)</SelectItem>
                    <SelectItem value="shared">Shared events only</SelectItem>
                    <SelectItem value="ics_eligible">Events marked for ICS sync</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label>Your private feed URL</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted rounded-md p-2 break-all select-all border">
                      {feedUrl}
                    </code>
                    <Button variant="outline" size="icon" onClick={copyFeedUrl} aria-label="Copy feed URL">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 inline mr-1" aria-hidden="true" />
                    Anyone with this URL can see the included events. Keep it private.
                  </p>
                </div>

                <Button variant="outline" size="sm" className="gap-2" onClick={regenerateFeedToken}>
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate URL
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CalDAV — Future */}
      <Card className="opacity-75">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-lg font-heading text-muted-foreground">CalDAV Sync</CardTitle>
            <Badge variant="secondary" className="text-xs">Planned</Badge>
          </div>
          <CardDescription>
            Two-way sync with Apple Calendar, Fastmail, and other CalDAV servers. Coming in a future update.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Siri & Shortcuts — Future */}
      <Card className="opacity-75">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle className="text-lg font-heading text-muted-foreground">Siri & Shortcuts</CardTitle>
            <Badge variant="secondary" className="text-xs">Planned</Badge>
          </div>
          <CardDescription>
            Voice commands and iOS Shortcuts for check-ins, quick switches, appointments, and grounding. Coming with the iOS companion app.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
