import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Camera, X } from "lucide-react";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProfileSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [systemName, setSystemName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, system_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setSystemName(data.system_name ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, [user]);

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or GIF image");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be under 2MB");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error("Failed to upload avatar");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (updateError) {
      toast.error("Failed to save avatar URL");
    } else {
      setAvatarUrl(publicUrl);
      toast.success("Avatar updated");
    }
    setUploading(false);
  };

  const removeAvatar = async () => {
    if (!user) return;
    setUploading(true);

    // Remove from storage (best-effort, may not exist with exact name)
    await supabase.storage.from("avatars").remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`, `${user.id}/avatar.gif`]);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, avatar_url: null, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      toast.error("Failed to remove avatar");
    } else {
      setAvatarUrl(null);
      toast.success("Avatar removed");
    }
    setUploading(false);
  };

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

  const initials = (displayName || "U").slice(0, 2).toUpperCase();

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
        {/* Avatar */}
        <div className="space-y-2">
          <Label>Avatar</Label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-border">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Your avatar" />
                ) : null}
                <AvatarFallback className="text-lg font-heading bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Change avatar"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading…" : "Upload photo"}
              </Button>
              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAvatar}
                  disabled={uploading}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-1 h-3 w-3" />
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">JPG, PNG, WebP, or GIF. Max 2MB.</p>
        </div>

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
