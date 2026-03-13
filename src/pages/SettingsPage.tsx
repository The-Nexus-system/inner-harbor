import ProfileSettings from "@/components/settings/ProfileSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import InsightSettings from "@/components/settings/InsightSettings";
import AccessibilitySettings from "@/components/settings/AccessibilitySettings";
import DataExportSettings from "@/components/settings/DataExportSettings";
import IntegrationSettings from "@/components/settings/IntegrationSettings";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize how the app looks, feels, and behaves. Your comfort matters.</p>
      </header>

      <ProfileSettings />
      <AppearanceSettings />
      <NotificationSettings />
      <InsightSettings />
      <AccessibilitySettings />

      <Separator />
      <div>
        <h2 className="text-xl font-heading font-semibold mb-1">Integrations</h2>
        <p className="text-sm text-muted-foreground mb-4">Connect external calendars and prepare for future voice shortcuts.</p>
        <IntegrationSettings />
      </div>

      <Separator />
      <DataExportSettings />
    </div>
  );
}
