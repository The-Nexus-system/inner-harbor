import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <header className="h-14 flex items-center border-b border-border px-4 bg-card" role="banner">
            <SidebarTrigger className="tap-target" aria-label="Toggle navigation menu" />
            <span className="ml-3 font-heading text-lg font-semibold text-foreground">Mosaic</span>
          </header>
          <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto" role="main">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
