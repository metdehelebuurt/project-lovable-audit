import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";
import { HelpAssistantWidget } from "@/components/help/HelpAssistantWidget";
import { TourProvider } from "@/components/tour/TourProvider";
import { CommandPalette } from "@/components/command/CommandPalette";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { Outlet } from "react-router-dom";
import { BlokkadeGate } from "@/components/BlokkadeGate";

export function AppLayout() {
  return (
    <BlokkadeGate>
    <SidebarProvider>
      <TourProvider>
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
      </TourProvider>
    </SidebarProvider>
  );
}
