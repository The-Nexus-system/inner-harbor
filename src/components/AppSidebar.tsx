import { 
  LayoutDashboard, Users, ArrowRightLeft, BookOpen, MessageSquare, 
  CheckSquare, CalendarDays, Shield, Settings 
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useSystem } from "@/contexts/SystemContext";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "System", url: "/system", icon: Users },
  { title: "Front", url: "/front", icon: ArrowRightLeft },
  { title: "Journal", url: "/journal", icon: BookOpen },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Safety", url: "/safety", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentFront, getAlter } = useSystem();

  const currentAlter = currentFront?.alterIds?.[0] ? getAlter(currentFront.alterIds[0]) : null;

  return (
    <Sidebar collapsible="icon" aria-label="Main navigation">
      <SidebarContent>
        {/* System identity */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="space-y-1">
              <h2 className="font-heading text-sm font-semibold text-sidebar-foreground">Mosaic</h2>
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
      </SidebarContent>
    </Sidebar>
  );
}
