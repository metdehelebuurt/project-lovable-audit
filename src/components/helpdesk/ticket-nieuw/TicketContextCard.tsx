import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, Package, FileText, Wrench, Receipt, Loader2 } from "lucide-react";

export type TicketBron = "order" | "installatie" | "factuur" | "klant" | "direct";

export type TicketContext = {
  bron: TicketBron;
  opdrachtId?: string | null;
  opdrachtNummer?: string | null;
  installatieId?: string | null;
  installatieNummer?: string | null;
  factuurId?: string | null;
  factuurNummer?: string | null;
  producten?: Array<{ omschrijving: string; categorie?: string | null; merk?: string | null; model?: string | null }>;
  loading?: boolean;
};

const BRON_LABEL: Record<TicketBron, { label: string; icon: typeof Link2 }> = {
  order: { label: "Vanuit opdracht", icon: Wrench },
  installatie: { label: "Vanuit installatie", icon: Package },
  factuur: { label: "Vanuit factuur", icon: Receipt },
  klant: { label: "Vanuit klant", icon: FileText },
  direct: { label: "Direct aangemaakt", icon: Link2 },
};

export function TicketContextCard({ context }: { context: TicketContext }) {
  if (context.bron === "direct" && !context.loading) return null;

  const meta = BRON_LABEL[context.bron];
  const Icon = meta.icon;

  const refLabel = context.opdrachtNummer
    ? `Opdracht ${context.opdrachtNummer}`
    : context.installatieNummer
      ? `Installatie ${context.installatieNummer}`
      : context.factuurNummer
        ? `Factuur ${context.factuurNummer}`
        : context.opdrachtId
          ? "Opdracht"
          : context.installatieId
            ? "Installatie"
            : context.factuurId
              ? "Factuur"
              : null;

  return (
    <Card className="p-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="font-medium">{meta.label}</Badge>
            {refLabel && <span className="text-sm font-medium">{refLabel}</span>}
            {context.loading && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> context laden…
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Dit ticket wordt automatisch gekoppeld aan deze {meta.label.toLowerCase().replace("vanuit ", "")} en is daar later terug te vinden.
          </p>

          {context.producten && context.producten.length > 0 && (
            <div className="rounded-md border bg-background/60 p-2 mt-2 space-y-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Gekoppelde producten
              </div>
              <ul className="space-y-1">
                {context.producten.map((p, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <Package className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{p.omschrijving}</div>
                      {(p.categorie || p.merk || p.model) && (
                        <div className="text-xs text-muted-foreground truncate">
                          {[p.categorie, p.merk, p.model].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}