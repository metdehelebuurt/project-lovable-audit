import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, RefreshCw, AlertTriangle, Receipt } from "lucide-react";
import { formatCurrency } from "@/types/offerte";
import type { OfferteConversieResult } from "@/lib/factuurFromOfferte";

interface Props {
  context: OfferteConversieResult;
  onResync: () => void;
  syncing?: boolean;
}

const resolutionLabel: Record<string, string> = {
  lead: "Klant gevonden via lead",
  email: "Klant gevonden via e-mail",
  naam_postcode: "Klant gevonden via naam + postcode",
  eenmalig: "Eenmalige relatie automatisch ingevuld",
  geen: "Geen klantgegevens gevonden",
};

const FactuurContextCard = ({ context, onResync, syncing }: Props) => {
  const navigate = useNavigate();
  const { offerte, bestaandeFacturen, reedsGefactureerd, openstaand, resolutionMethod } = context;

  const niesConcept = bestaandeFacturen.filter(f => f.status !== "concept");
  const totaalOfferte = Number(offerte.totaal_bedrag) || 0;
  const isVolledigGefactureerd = reedsGefactureerd > 0 && openstaand <= 0.01;
  const isGedeeltelijkGefactureerd = reedsGefactureerd > 0 && !isVolledigGefactureerd;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-primary/5">
      <CardContent className="py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-pill">
                  📄 Vanuit offerte {offerte.offertenummer}
                </Badge>
                <Badge variant="outline" className="rounded-pill text-xs">
                  {resolutionLabel[resolutionMethod]}
                </Badge>
                {isVolledigGefactureerd && (
                  <Badge className="rounded-pill bg-success-light text-success">Volledig gefactureerd</Badge>
                )}
                {isGedeeltelijkGefactureerd && (
                  <Badge className="rounded-pill bg-warning/10 text-warning-foreground">Gedeeltelijk gefactureerd</Badge>
                )}
              </div>
              <p className="text-sm text-foreground">
                <strong>{offerte.klant_naam}</strong>
                {offerte.klant_email && <span className="text-muted-foreground"> · {offerte.klant_email}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                Offertetotaal: <strong className="text-foreground">{formatCurrency(totaalOfferte)}</strong>
                {reedsGefactureerd > 0 && (
                  <> · Reeds gefactureerd: <strong className="text-foreground">{formatCurrency(reedsGefactureerd)}</strong> · Openstaand: <strong className="text-foreground">{formatCurrency(openstaand)}</strong></>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-pill gap-1" onClick={() => navigate(`/offertes/${offerte.id}`)}>
              <ExternalLink className="h-3.5 w-3.5" /> Open offerte
            </Button>
            <Button variant="outline" size="sm" className="rounded-pill gap-1" onClick={onResync} disabled={syncing}>
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} /> Opnieuw synchroniseren
            </Button>
          </div>
        </div>

        {niesConcept.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
              <AlertTriangle className="h-4 w-4" />
              Er {niesConcept.length === 1 ? "bestaat al een factuur" : `bestaan al ${niesConcept.length} facturen`} voor deze offerte
            </div>
            <div className="space-y-1">
              {niesConcept.map(f => (
                <div key={f.id} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <Receipt className="h-3 w-3" />
                    <strong>{f.documentnummer}</strong>
                    <span className="text-muted-foreground">· {formatCurrency(f.totaal_bedrag)}</span>
                    <span className="text-muted-foreground">· {f.status}</span>
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => navigate(`/financieel/${f.id}`)}>
                    Bekijken
                  </Button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Maak een nieuwe factuur aan voor een termijn (aanbetaling/restant), of bewerk een bestaande.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FactuurContextCard;