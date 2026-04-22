import { Button } from "@/components/ui/button";
import { ArrowLeft, LifeBuoy, Smartphone, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InstallatieStatusBadge from "./InstallatieStatusBadge";
import type { Installatie } from "./api/installatieApi";
import type { InstallatieStatus } from "./status";

interface Props {
  installatie: Installatie;
  onMaakOplevering?: () => void;
}

export default function InstallatieHeader({ installatie, onMaakOplevering }: Props) {
  const navigate = useNavigate();
  const showOpleverButton = ["gereed", "in_uitvoering"].includes(installatie.status);

  return (
    <div className="flex items-start gap-3">
      <Button variant="ghost" size="icon" onClick={() => navigate("/installaties")} className="rounded-xl mt-1">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-semibold text-foreground">
            {installatie.consument_naam ?? "Installatie"}
          </h1>
          <InstallatieStatusBadge status={installatie.status as InstallatieStatus} />
          {installatie.installatienummer && (
            <span className="text-sm text-muted-foreground font-mono">{installatie.installatienummer}</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {installatie.werkadres ?? installatie.klant_adres ?? "Geen adres"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => navigate(`/installaties/${installatie.id}/werk`)}>
          <Smartphone className="h-4 w-4" /> Werkscherm
        </Button>
        {showOpleverButton && onMaakOplevering && (
          <Button size="sm" className="rounded-xl gap-1.5" onClick={onMaakOplevering}>
            <ShieldCheck className="h-4 w-4" /> Opleverrapport
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => {
          const params = new URLSearchParams({ bron: "installatie", installatie_id: installatie.id });
          if (installatie.lead_id) params.set("lead_id", installatie.lead_id);
          if (installatie.consument_id) params.set("klant_id", installatie.consument_id);
          navigate(`/helpdesk/tickets/nieuw?${params.toString()}`);
        }}>
          <LifeBuoy className="h-4 w-4" /> Ticket
        </Button>
      </div>
    </div>
  );
}