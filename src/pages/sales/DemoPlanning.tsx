import { DemoOverzicht } from "@/components/affiliate/DemoOverzicht";
import { CalendarDays } from "lucide-react";

/**
 * Dedicated pagina voor de sales manager met het volledige demo- en trial-planning
 * overzicht. Hergebruikt de bestaande DemoOverzicht component.
 */
export default function DemoPlanning() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold">Demoplanning</h1>
          <p className="text-sm text-muted-foreground">
            Alle geplande demo- en trial-afspraken op één overzicht.
          </p>
        </div>
      </header>
      <DemoOverzicht />
    </div>
  );
}