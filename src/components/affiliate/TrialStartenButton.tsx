import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import { TrialStartenDialog } from "./TrialStartenDialog";
import type { AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

interface Props {
  lead: AffiliateLead;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function TrialStartenButton({ lead, size = "default", variant = "default", className }: Props) {
  const [open, setOpen] = useState(false);
  const al = (lead as unknown as { gewonnen_partner_id?: string | null }).gewonnen_partner_id;
  if (al) return null;
  if (!lead.email || !lead.bedrijfsnaam) return null;
  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
        <Rocket className="h-4 w-4 mr-2" /> Trial starten
      </Button>
      <TrialStartenDialog open={open} onOpenChange={setOpen} lead={lead} />
    </>
  );
}