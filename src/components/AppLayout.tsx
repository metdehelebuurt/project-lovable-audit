import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { HelpAssistantWidget } from "@/components/help/HelpAssistantWidget";
import { CommandPalette } from "@/components/command/CommandPalette";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <AppHeader />
          <main className="flex-1 min-w-0 p-3 md:p-8 pb-24 md:pb-8 bg-background overflow-x-hidden overflow-y-auto">
            <Outlet />
          </main>
        </div>
        <CommandPalette />
        <HelpAssistantWidget />
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
