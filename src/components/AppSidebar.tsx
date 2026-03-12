import { useState, useEffect } from "react";
import { 
  LayoutDashboard, Users, ArrowRightLeft, BookOpen, MessageSquare, 
  CheckSquare, CalendarDays, Shield, Settings, LogOut, Leaf, Lightbulb, Clock 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
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
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Safety", url: "/safety", icon: Shield },
  { title: "Grounding", url: "/grounding", icon: Leaf },
  { title: "Insights", url: "/insights", icon: Lightbulb },
  { title: "Timeline", url: "/timeline", icon: Clock },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentFront, getAlter } = useSystem();
  const { user, signOut } = useAuth();

  const currentAlter = currentFront?.alterIds?.[0] ? getAlter(currentFront.alterIds[0]) : null;

  const [systemName, setSystemName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("system_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSystemName(data?.system_name ?? null));
  }, [user]);

  // Subscribe to profile changes so sidebar updates after settings save
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sidebar-profile")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` }, (payload) => {
        setSystemName((payload.new as any).system_name ?? null);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      <SidebarContent>
        {/* System identity */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="space-y-1">
              <h2 className="font-heading text-sm font-semibold text-sidebar-foreground">
                {systemName || "Mosaic"}
              </h2>
              {currentAlter && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: currentAlter.color || 'hsl(var(--primary))' }}
                    aria-hidden="true"
                  />
                  <span>{currentAlter.emoji} {currentAlter.name} is fronting</span>
                </p>
              )}
            </div>
          )}
          {collapsed && currentAlter && (
            <div className="flex justify-center" title={`${currentAlter.name} is fronting`}>
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: currentAlter.color || 'hsl(var(--primary))' }}
                aria-label={`${currentAlter.name} is fronting`}
              />
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
