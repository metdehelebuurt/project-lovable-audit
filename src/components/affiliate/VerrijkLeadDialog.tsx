import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, ArrowRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useVerrijkLead, type VerrijkSuggesties } from "@/hooks/affiliate/useVerrijkLead";
import { useUpdateAffiliateLead, type AffiliateLead } from "@/hooks/affiliate/useAffiliateLeads";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: AffiliateLead;
};

type VeldKey = keyof VerrijkSuggesties;

const VELDEN: { key: VeldKey; label: string; doelKolom: string }[] = [
  { key: "email", label: "E-mail", doelKolom: "email" },
  { key: "telefoon", label: "Telefoon", doelKolom: "telefoon" },
  { key: "website", label: "Website", doelKolom: "website" },
  { key: "contactpersoon", label: "Contactpersoon", doelKolom: "contactpersoon" },
  { key: "adres", label: "Adres", doelKolom: "adres" },
  { key: "postcode", label: "Postcode", doelKolom: "postcode" },
  { key: "plaats", label: "Plaats", doelKolom: "plaats" },
  { key: "branche", label: "Branche", doelKolom: "branche" },
  { key: "samenvatting", label: "AI-samenvatting", doelKolom: "ai_bedrijf_samenvatting" },
];

export function VerrijkLeadDialog({ open, onOpenChange, lead }: Props) {
  const verrijk = useVerrijkLead();
  const update = useUpdateAffiliateLead();
  const [suggesties, setSuggesties] = useState<VerrijkSuggesties | null>(null);
  const [bronUrls, setBronUrls] = useState<string[]>([]);
  const [gekozen, setGekozen] = useState<Set<VeldKey>>(new Set());
  const [melding, setMelding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setSuggesties(null);
      setBronUrls([]);
      setGekozen(new Set());
      setMelding(null);
    }
  }, [open]);

  const start = async () => {
    setMelding(null);
    try {
      const res = await verrijk.mutateAsync(lead.id);
      setSuggesties(res.suggesties);
      setBronUrls((res.bron_urls ?? []).filter((u): u is string => !!u));
      if (res.melding) setMelding(res.melding);
      if (res.suggesties) {
        // Voorvink velden die nu leeg zijn én een suggestie hebben
        const auto = new Set<VeldKey>();
        for (const v of VELDEN) {
          const huidig = (lead as Record<string, unknown>)[v.doelKolom];
          if (!huidig && res.suggesties[v.key]) auto.add(v.key);
        }
        setGekozen(auto);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Verrijken mislukt");
    }
  };

  const toggle = (k: VeldKey) => {
    setGekozen((prev) => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const toepassen = async () => {
    if (!suggesties || gekozen.size === 0) return;
    const patch: Record<string, string> = {};
    for (const v of VELDEN) {
      if (gekozen.has(v.key) && suggesties[v.key]) {
        patch[v.doelKolom] = suggesties[v.key] as string;
      }
    }
    if (Object.keys(patch).length === 0) {
      onOpenChange(false);
      return;
    }
    try {
      await update.mutateAsync({ id: lead.id, patch });
      toast.success(`${Object.keys(patch).length} veld(en) bijgewerkt`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Opslaan mislukt");
    }
  };

  const beschikbareVelden = VELDEN.filter((v) => suggesties && suggesties[v.key]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Lead verrijken — {lead.bedrijfsnaam}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            We zoeken op het web naar ontbrekende contactgegevens en bedrijfsinfo. Je kiest zelf wat we overnemen.
          </p>
        </DialogHeader>

        {!suggesties && !verrijk.isPending && (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Klik hieronder om het web te doorzoeken op basis van bedrijfsnaam{lead.website ? " en website" : ""}.
            </p>
            <Button onClick={start}>
              <Sparkles className="h-4 w-4 mr-2" /> Verrijken starten
            </Button>
            {melding && <p className="text-xs text-amber-700">{melding}</p>}
          </div>
        )}

        {verrijk.isPending && (
          <div className="py-10 text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Web doorzoeken en gegevens extraheren…</p>
          </div>
        )}

        {suggesties && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto">
            {beschikbareVelden.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Geen nieuwe gegevens gevonden in de bronnen.
              </p>
            ) : (
              beschikbareVelden.map((v) => {
                const huidig = ((lead as Record<string, unknown>)[v.doelKolom] as string | null) ?? null;
                const gevonden = suggesties[v.key] as string;
                const isHetzelfde = huidig?.trim().toLowerCase() === gevonden.trim().toLowerCase();
                return (
                  <div
                    key={v.key}
                    className={`rounded-md border p-3 ${gekozen.has(v.key) ? "border-primary/50 bg-primary/5" : "border-border"}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={gekozen.has(v.key)}
                        onCheckedChange={() => toggle(v.key)}
                        disabled={isHetzelfde}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {v.label}
                          </span>
                          {isHetzelfde && (
                            <span className="text-[10px] text-muted-foreground">al actueel</span>
                          )}
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
                          <span className="text-muted-foreground truncate" title={huidig ?? ""}>
                            {huidig || <em className="opacity-60">leeg</em>}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium break-words">{gevonden}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {suggesties.samenvatting && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                  Wat doet dit bedrijf?
                </p>
                <p>{suggesties.samenvatting}</p>
              </div>
            )}

            {bronUrls.length > 0 && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p className="font-medium mb-1">Bronnen:</p>
                <ul className="space-y-0.5">
                  {bronUrls.slice(0, 5).map((u, i) => (
                    <li key={i}>
                      <a
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:underline truncate max-w-full"
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">{u}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {suggesties && (
            <Button variant="ghost" onClick={start} disabled={verrijk.isPending}>
              Opnieuw zoeken
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Sluiten
          </Button>
          {suggesties && beschikbareVelden.length > 0 && (
            <Button onClick={toepassen} disabled={gekozen.size === 0 || update.isPending}>
              {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Toepassen ({gekozen.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VerrijkLeadDialog;