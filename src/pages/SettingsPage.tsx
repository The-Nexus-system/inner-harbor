import AppearanceSettings from "@/components/settings/AppearanceSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import InsightSettings from "@/components/settings/InsightSettings";
import AccessibilitySettings from "@/components/settings/AccessibilitySettings";
import DataExportSettings from "@/components/settings/DataExportSettings";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize how the app looks, feels, and behaves. Your comfort matters.</p>
      </header>

      <AppearanceSettings />
      <NotificationSettings />
      <InsightSettings />
      <AccessibilitySettings />
      <DataExportSettings />
    </div>
  );
}
