import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAffiliateGebruikers, useSalesManagerGebruikers, useDoorzetten } from "@/hooks/sales/useDoorzetten";
import type { SalesLead } from "@/hooks/sales/useSalesLeads";
import { TEMPERATUREN, TEMP_LABEL, TEMP_ICON, TEMP_COLOR, TEMP_SUGGESTIE, type Temperatuur } from "@/lib/sales/temperatuur";
import { useLeadBronnen } from "@/hooks/sales/useLeadBronnen";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: SalesLead | null;
}

export default function DoorzetDialog({ open, onOpenChange, lead }: Props) {
  const [modus, setModus] = useState<"direct" | "pool" | "sales_manager">("direct");
  const [affiliateId, setAffiliateId] = useState<string>("");
  const [salesManagerId, setSalesManagerId] = useState<string>("");
  const [notitie, setNotitie] = useState("");
  const [temperatuur, setTemperatuur] = useState<Temperatuur>("lauw");
  const [snelheid, setSnelheid] = useState<string>("none");
  const [bronId, setBronId] = useState<string>("");
  const { data: affiliates, isLoading } = useAffiliateGebruikers();
  const { data: salesManagers, isLoading: smLoading } = useSalesManagerGebruikers();
  const { data: bronnen } = useLeadBronnen();
  const doorzetten = useDoorzetten();

  const onSubmit = async () => {
    if (!lead) return;
    const targetId =
      modus === "direct" ? affiliateId :
      modus === "sales_manager" ? salesManagerId :
      null;
    if ((modus === "direct" || modus === "sales_manager") && !targetId) return;
    const volgende = snelheidNaarTimestamp(snelheid);
    if (bronId && bronId !== (lead.bron_id ?? "")) {
      await supabase.from("affiliate_leads").update({ bron_id: bronId }).eq("id", lead.id);
    }
    await doorzetten.mutateAsync({
      lead_id: lead.id,
      affiliate_id: targetId,
      notitie: notitie.trim() || undefined,
      temperatuur,
      volgende_actie_op: volgende,
    });
    setNotitie("");
    setAffiliateId("");
    setSalesManagerId("");
    setSnelheid("none");
    setBronId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lead doorzetten naar affiliate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted/40 p-3 text-sm">
            <div className="font-medium">{lead?.bedrijfsnaam}</div>
            {lead?.contactpersoon && <div className="text-muted-foreground">{lead.contactpersoon}</div>}
          </div>

          <div className="space-y-2">
            <Label>Hoe heet is deze lead?</Label>
            <div className="grid grid-cols-4 gap-2">
              {TEMPERATUREN.map((t) => {
                const Icon = TEMP_ICON[t];
                const actief = temperatuur === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemperatuur(t)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition",
                      actief ? `${TEMP_COLOR[t]} ring-2 ring-offset-1` : "hover:bg-muted",
                    )}
                    aria-pressed={actief}
                  >
                    <Icon className="h-5 w-5" />
                    {TEMP_LABEL[t]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{TEMP_SUGGESTIE[temperatuur]}</p>
          </div>

          <RadioGroup value={modus} onValueChange={(v) => setModus(v as "direct" | "pool" | "sales_manager")}>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="direct" id="modus-direct" className="mt-1" />
              <Label htmlFor="modus-direct" className="font-normal">
                <span className="font-medium">Direct toewijzen aan affiliate</span>
                <p className="text-xs text-muted-foreground">Verschijnt meteen in hun dashboard.</p>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="sales_manager" id="modus-sm" className="mt-1" />
              <Label htmlFor="modus-sm" className="font-normal">
                <span className="font-medium">Toewijzen aan sales manager</span>
                <p className="text-xs text-muted-foreground">Sales manager pakt de lead zelf op of verdeelt hem verder.</p>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem value="pool" id="modus-pool" className="mt-1" />
              <Label htmlFor="modus-pool" className="font-normal">
                <span className="font-medium">In de affiliate-pool plaatsen</span>
                <p className="text-xs text-muted-foreground">Eerste affiliate die claimt krijgt de lead.</p>
              </Label>
            </div>
          </RadioGroup>
          {modus === "direct" && (
            <div className="space-y-1.5">
              <Label>Affiliate</Label>
              <Select value={affiliateId} onValueChange={setAffiliateId}>
                <SelectTrigger><SelectValue placeholder={isLoading ? "Laden..." : "Kies affiliate"} /></SelectTrigger>
                <SelectContent>
                  {(affiliates ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.naam} — {a.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {modus === "sales_manager" && (
            <div className="space-y-1.5">
              <Label>Sales manager</Label>
              <Select value={salesManagerId} onValueChange={setSalesManagerId}>
                <SelectTrigger><SelectValue placeholder={smLoading ? "Laden..." : "Kies sales manager"} /></SelectTrigger>
                <SelectContent>
                  {(salesManagers ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.naam} — {a.email}</SelectItem>
                  ))}
                  {!smLoading && (salesManagers ?? []).length === 0 && (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">Geen actieve sales managers</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Volgende actie binnen</Label>
            <Select value={snelheid} onValueChange={setSnelheid}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geen deadline</SelectItem>
                <SelectItem value="today">Vandaag</SelectItem>
                <SelectItem value="24h">Binnen 24 uur</SelectItem>
                <SelectItem value="3d">Binnen 3 dagen</SelectItem>
                <SelectItem value="week">Deze week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Bron (optioneel bijwerken)</Label>
            <Select value={bronId || (lead?.bron_id ?? "")} onValueChange={setBronId}>
              <SelectTrigger><SelectValue placeholder="Behoud huidige bron" /></SelectTrigger>
              <SelectContent>
                {(bronnen ?? []).filter((b) => b.actief).map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Notitie meesturen (optioneel)</Label>
            <Textarea
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={TEMP_SUGGESTIE[temperatuur]}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuleren</Button>
          <Button
            onClick={onSubmit}
            disabled={
              doorzetten.isPending ||
              (modus === "direct" && !affiliateId) ||
              (modus === "sales_manager" && !salesManagerId)
            }
          >
            {doorzetten.isPending ? "Bezig…" : "Doorzetten"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function snelheidNaarTimestamp(snelheid: string): string | null {
  const now = new Date();
  switch (snelheid) {
    case "today": now.setHours(23, 59, 0, 0); return now.toISOString();
    case "24h":   now.setHours(now.getHours() + 24); return now.toISOString();
    case "3d":    now.setDate(now.getDate() + 3); return now.toISOString();
    case "week":  now.setDate(now.getDate() + 7); return now.toISOString();
    default:      return null;
  }
}