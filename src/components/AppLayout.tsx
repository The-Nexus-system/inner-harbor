import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useSystem } from "@/contexts/SystemContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { activeInterfaceMode } = useSystem();

  return (
    <SidebarProvider>
      <div className={cn("min-h-screen flex w-full", activeInterfaceMode !== 'standard' && 'simplified-mode')}>
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <header className="h-14 flex items-center border-b border-border px-4 bg-card" role="banner">
            <SidebarTrigger className="tap-target" aria-label="Toggle navigation menu" />
            <span className="ml-3 font-heading text-lg font-semibold text-foreground">Mosaic</span>
            {activeInterfaceMode !== 'standard' && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {activeInterfaceMode === 'simplified' ? '🌱 Simplified' : '🌿 Minimal'}
              </Badge>
            )}
          </header>
          <main
            id="main-content"
            className={cn(
              "flex-1 p-4 md:p-6 lg:p-8 overflow-auto",
              activeInterfaceMode === 'simplified' && 'text-lg',
              activeInterfaceMode === 'minimal' && 'text-xl p-6 md:p-8 lg:p-10',
            )}
            role="main"
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
