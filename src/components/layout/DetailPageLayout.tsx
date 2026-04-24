import { type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import WerkstroomStepper from "@/components/werkstroom/WerkstroomStepper";
import type { WerkstroomStap } from "@/components/werkstroom/useWerkstroomKeten";

interface Props {
  /** Stepper-context. Laat weg om de stepper te verbergen. */
  stepper?: { vanaf: WerkstroomStap; id: string; huidig: WerkstroomStap };
  /** Terug-knop URL. Default: history.back() */
  terugUrl?: string;
  /** Titel boven de pagina (h1). */
  titel: ReactNode;
  /** Optionele subregel (klantnaam, nummer, e.d.). */
  subtitel?: ReactNode;
  /** Optionele status-badge naast de titel. */
  status?: ReactNode;
  /** Primaire actieknoppen rechts in de header. */
  acties?: ReactNode;
  /** Hoofdcontent (meestal tabs of cards). */
  children: ReactNode;
  /** Optionele rechter-rail met snelle info/acties (lg+). */
  rail?: ReactNode;
  /** Maximale breedte van de inhoud. */
  maxWidth?: "default" | "wide";
}

/**
 * Gestandaardiseerde detail-layout voor alle entiteit-detailpagina's.
 * Combineert: terug-knop + stepper + titel/status/acties + content + optionele rail.
 */
export default function DetailPageLayout({
  stepper, terugUrl, titel, subtitel, status, acties, children, rail,
  maxWidth = "default",
}: Props) {
  const navigate = useNavigate();
  const handleTerug = () => {
    if (terugUrl) navigate(terugUrl);
    else navigate(-1);
  };

  return (
    <div className={cn("space-y-5", maxWidth === "wide" ? "max-w-7xl" : "max-w-6xl")}>
      {stepper && (
        <WerkstroomStepper vanaf={stepper.vanaf} id={stepper.id} huidig={stepper.huidig} />
      )}
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTerug}
          className="rounded-xl mt-0.5"
          aria-label="Terug"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-foreground truncate">{titel}</h1>
            {status}
          </div>
          {subtitel && (
            <div className="text-muted-foreground text-sm mt-1">{subtitel}</div>
          )}
        </div>
        {acties && <div className="flex items-center gap-2 flex-wrap">{acties}</div>}
      </div>

      {rail ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          <div className="min-w-0 space-y-5">{children}</div>
          <aside className="space-y-4">{rail}</aside>
        </div>
      ) : (
        <div className="space-y-5">{children}</div>
      )}
    </div>
  );
}