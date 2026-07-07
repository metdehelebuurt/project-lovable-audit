import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Mail, Phone, Building2, Send, AlertTriangle, MessageSquarePlus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import TemperatuurBadge from "@/components/sales/TemperatuurBadge";
import BronBadge from "@/components/sales/BronBadge";
import ContactmomentDialog from "@/components/sales/ContactmomentDialog";
import LeadScorePill from "@/components/sales/LeadScorePill";
import { TEMP_COLOR, type Temperatuur } from "@/lib/sales/temperatuur";
import { useMyPipeline } from "@/hooks/sales/usePipelineConfig";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface Props {
  lead: SalesLead;
  onClick: () => void;
  onToewijzen?: () => void;
}

export default function LeadKaart({ lead, onClick, onToewijzen }: Props) {
  const temperatuur = (lead.temperatuur ?? "koud") as Temperatuur;
  const deadline = lead.volgende_actie_op ? new Date(lead.volgende_actie_op) : null;
  const teLaat = deadline ? deadline.getTime() < Date.now() : false;
  const [logOpen, setLogOpen] = useState(false);
  const { data: pipeline } = useMyPipeline();
  const fase = pipeline?.find((f) => f.fase_key === (lead.fase_slug ?? "nieuw"));
  const slaDagen = fase?.sla_dagen ?? null;

  const dagenStil = lead.updated_at
    ? Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
    : 0;
  const grensAlert = slaDagen ?? 21;
  const grensWarn = slaDagen ? Math.ceil(slaDagen / 2) : 10;
  const agingNiveau: "ok" | "warn" | "alert" =
    dagenStil >= grensAlert ? "alert" : dagenStil >= grensWarn ? "warn" : "ok";

  return (
    <>
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={`group relative p-3 pl-4 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${
        teLaat ? "border-rose-300" : agingNiveau === "alert" ? "border-rose-200" : agingNiveau === "warn" ? "border-amber-200" : ""
      }`}
    >
      {/* Warmte-strip aan de linkerkant — één duidelijk systeem */}
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-1 ${TEMP_COLOR[temperatuur].split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted"}`}
      />
      {/* Titelregel */}
      <div className="flex items-start gap-2">
        <Building2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate leading-tight">{lead.bedrijfsnaam}</div>
          {lead.contactpersoon && (
            <div className="text-xs text-muted-foreground truncate">{lead.contactpersoon}</div>
          )}
        </div>
        <TemperatuurBadge temperatuur={temperatuur} showLabel />
      </div>

      {/* Compacte meta-regel: icoontjes + locatie/branche + score */}
      <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1">
          <Mail className={`h-3 w-3 ${lead.email ? "text-foreground/60" : "opacity-25"}`} />
          <Phone className={`h-3 w-3 ${lead.telefoon ? "text-foreground/60" : "opacity-25"}`} />
        </div>
        <span className="truncate flex-1">
          {[lead.plaats, lead.branche].filter(Boolean).join(" · ") || "—"}
        </span>
        <LeadScorePill lead={lead} showLabel={false} />
      </div>

      {(lead.bron_id || lead.bron) && (
        <div className="mt-2 flex flex-wrap gap-1">
          <BronBadge bronId={lead.bron_id} fallbackLabel={lead.bron ?? null} />
        </div>
      )}

      {/* Onderbalk: status + deadline */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t text-[11px]">
        <span className="text-muted-foreground">
          {lead.eigenaar_id ? "Toegewezen" : "Platform"}
        </span>
        {deadline ? (
          <span className={`inline-flex items-center gap-1 ${teLaat ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>
            {teLaat && <AlertTriangle className="h-3 w-3" />}
            {deadline.toLocaleDateString("nl-NL", { day: "2-digit", month: "short" })}
          </span>
        ) : agingNiveau !== "ok" ? (
          <span className={agingNiveau === "alert" ? "text-rose-600" : "text-amber-600"}>
            {dagenStil}d stil
          </span>
        ) : null}
      </div>

      {/* Acties: kebab rechtsboven, alleen on hover */}
      {onToewijzen && (
        <div
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-background/80 backdrop-blur"
                aria-label="Acties"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLogOpen(true)}>
                <MessageSquarePlus className="h-3.5 w-3.5 mr-2" /> Contactmoment loggen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToewijzen}>
                <Send className="h-3.5 w-3.5 mr-2" />
                {lead.eigenaar_id ? "Opnieuw toewijzen" : "Toewijzen aan affiliate"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Card>
    <ContactmomentDialog
      leadId={lead.id}
      bedrijfsnaam={lead.bedrijfsnaam ?? undefined}
      open={logOpen}
      onOpenChange={setLogOpen}
    />
    </>
  );
}