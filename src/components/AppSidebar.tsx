import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, ArrowRightLeft, BookOpen, MessageSquare, 
  CheckSquare, CalendarDays, Shield, Settings, LogOut, Leaf, Lightbulb, Clock, Zap, Camera, Pill, UserCheck, Eye, MessageCircle
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSystem } from "@/contexts/SystemContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";


const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "System", url: "/system", icon: Users },
  { title: "Front", url: "/front", icon: ArrowRightLeft },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Medications", url: "/medications", icon: Pill },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Safety", url: "/safety", icon: Shield },
  { title: "Grounding", url: "/grounding", icon: Leaf },
  { title: "Insights", url: "/insights", icon: Lightbulb },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Quick Actions", url: "/quick-actions", icon: Zap },
  { title: "Snapshots", url: "/snapshots", icon: Camera },
  { title: "Support", url: "/support", icon: UserCheck },
  { title: "Sensory", url: "/sensory", icon: Eye },
  { title: "Communicate", url: "/communication", icon: MessageCircle },
  { title: "Security", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

interface ProfileData {
  system_name: string | null;
  avatar_url: string | null;
  display_name: string | null;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentFront, getAlter } = useSystem();
  const { user, signOut } = useAuth();

  const currentAlter = currentFront?.alterIds?.[0] ? getAlter(currentFront.alterIds[0]) : null;

  const [profile, setProfile] = useState<ProfileData>({ system_name: null, avatar_url: null, display_name: null });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("system_name, avatar_url, display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setProfile(data);
      });
  }, [user]);

  // Subscribe to profile changes so sidebar updates after settings save
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sidebar-profile")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload) => {
        const p = payload.new as any;
        setProfile({
          system_name: p.system_name ?? null,
          avatar_url: p.avatar_url ?? null,
          display_name: p.display_name ?? null,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const initials = (profile.display_name || "U").slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      <SidebarContent>
        {/* System identity */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-sidebar-border flex-shrink-0">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-xs font-heading bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <h2 className="font-heading text-sm font-semibold text-sidebar-foreground truncate">
                  {profile.system_name || "Mosaic"}
                </h2>
                {currentAlter && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    <span
                      className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: currentAlter.color || 'hsl(var(--primary))' }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{currentAlter.emoji} {currentAlter.name} is fronting</span>
                  </p>
                )}
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <Avatar className="h-8 w-8 border border-sidebar-border">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt="Avatar" />
                ) : null}
                <AvatarFallback className="text-xs font-heading bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50 tap-target flex items-center"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign out */}
        <div className="mt-auto p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start tap-target text-muted-foreground hover:text-foreground"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
