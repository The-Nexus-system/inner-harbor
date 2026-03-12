import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff } from "lucide-react";

export default function NotificationSettings() {
  const { isSupported, permission, isSubscribed, isLoading, enableNotifications, disableNotifications } = useNotifications();

  const handleToggle = async (enabled: boolean) => {
    if (enabled) await enableNotifications();
    else await disableNotifications();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notifications
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get reminded about upcoming tasks and calendar events.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BellOff className="h-4 w-4" />
            <p>Push notifications are not supported in this browser. Try installing the app or using a different browser.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between tap-target">
              <div>
                <Label htmlFor="push-notifications">Push notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSubscribed
                    ? 'You will receive reminders for tasks and events.'
                    : permission === 'denied'
                      ? 'Notifications are blocked. Please enable them in your browser settings.'
                      : 'Enable to receive task and calendar reminders.'}
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handleToggle}
                disabled={isLoading || permission === 'denied'}
              />
            </div>
            {isSubscribed && (
              <p className="text-xs text-muted-foreground">
                Set reminder times when creating or editing tasks and calendar events.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
