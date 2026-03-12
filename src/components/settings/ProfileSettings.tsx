import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [systemName, setSystemName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, system_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setSystemName(data.system_name ?? "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const trimmedDisplay = displayName.trim().slice(0, 100);
    const trimmedSystem = systemName.trim().slice(0, 100);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: trimmedDisplay || null,
          system_name: trimmedSystem || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-heading">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-heading">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            placeholder="How you'd like to be called"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="system-name">System name</Label>
          <Input
            id="system-name"
            placeholder="Your system's name (optional)"
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            A name for your system, shown in the sidebar and greetings.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </CardContent>
    </Card>
  );
}
