import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Check, FileText, Loader2, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

interface OfferteRegel {
  omschrijving: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

export default function OffertePublic() {
  const { token } = useParams<{ token: string }>();
  const [offerte, setOfferte] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptDialog, setAcceptDialog] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("offerte-public-view", {
          body: { share_token: token },
        });

        if (fnErr || data?.error) {
          setError(data?.error || fnErr?.message || "Deze offertelink is ongeldig of verlopen.");
          setLoading(false);
          return;
        }

        setOfferte(data.offerte);
        if (data.partner) setPartner(data.partner);
      } catch {
        setError("Er is een fout opgetreden bij het laden van de offerte.");
      }
      setLoading(false);
    })();
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("offerte-accept", {
        body: { share_token: token },
      });
      if (fnErr || data?.error) {
        toast.error(data?.error || fnErr?.message || "Er is een fout opgetreden");
      } else {
        setOfferte((prev: any) => ({ ...prev, status: "geaccepteerd", accepted_at: new Date().toISOString() }));
        toast.success("Offerte geaccepteerd!");
        setAcceptDialog(false);
      }
    } catch {
      toast.error("Er is een fout opgetreden");
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !offerte) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full rounded-2xl">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold text-foreground">{error || "Offerte niet gevonden"}</h2>
            <p className="text-sm text-muted-foreground">Neem contact op met uw adviseur voor een nieuwe link.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const regels: OfferteRegel[] = Array.isArray(offerte.regels) ? offerte.regels : [];
  const pc = partner?.primaire_kleur || "#5B58E1";
  const sc = partner?.secundaire_kleur || "#1a1a2e";
  const logoUrl = partner?.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;
  const isAccepted = offerte.status === "geaccepteerd";
  const isExpired = offerte.status === "verlopen" || (offerte.geldig_tot && new Date(offerte.geldig_tot) < new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header band */}
      <div style={{ backgroundColor: sc, padding: "24px 0" }}>
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          {logoUrl ? (
            <img src={logoUrl} alt={partner?.naam || ""} style={{ height: 36, objectFit: "contain" }} />
          ) : (
            <span className="text-white font-bold text-lg">{partner?.naam || "Offerte"}</span>
          )}
          {isAccepted && <Badge className="bg-green-500/20 text-green-200 border-green-500/30">✓ Geaccepteerd</Badge>}
          {isExpired && !isAccepted && <Badge className="bg-red-500/20 text-red-200 border-red-500/30">Verlopen</Badge>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Uw offerte</h1>
          <p className="text-muted-foreground mt-1">
            {offerte.offertenummer} • Opgesteld op {formatDate(offerte.created_at)}
          </p>
        </div>

        {/* Client info */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: pc }}>Opgesteld voor</p>
              <p className="font-semibold text-foreground">{offerte.klant_naam}</p>
              {offerte.klant_adres && <p className="text-sm text-muted-foreground">{offerte.klant_adres}</p>}
              {(offerte.klant_postcode || offerte.klant_plaats) && (
                <p className="text-sm text-muted-foreground">{offerte.klant_postcode} {offerte.klant_plaats}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: pc }}>Details</p>
              <p className="text-sm text-muted-foreground">Geldig tot: <strong className="text-foreground">{formatDate(offerte.geldig_tot)}</strong></p>
              {offerte.betalingsvoorwaarden && (
                <p className="text-sm text-muted-foreground mt-1">Betaling: {offerte.betalingsvoorwaarden}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Intro */}
        {offerte.introductie_tekst && (
          <Card className="rounded-2xl border-0 shadow-sm" style={{ borderLeft: `4px solid ${pc}` }}>
            <CardContent className="pt-6">
              <p className="text-sm text-foreground leading-relaxed">{offerte.introductie_tekst}</p>
            </CardContent>
          </Card>
        )}

        {/* Regels */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" style={{ color: pc }} /> Offertebedrag
            </h3>
            <div className="space-y-2">
              {regels.map((r, i) => {
                const sub = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
                return (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{r.omschrijving}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.aantal}× {formatCurrency(r.prijs_per_stuk)}
                        {r.korting_percentage > 0 ? ` (-${r.korting_percentage}%)` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(sub)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t-2" style={{ borderColor: pc }}>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotaal excl. BTW</span><span>{formatCurrency(offerte.subtotaal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>BTW</span><span>{formatCurrency(offerte.btw_bedrag)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground mt-2">
                <span>Totaal incl. BTW</span><span>{formatCurrency(offerte.totaal_bedrag)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garantie / voorwaarden */}
        {(offerte.garantie_voorwaarden || offerte.installatie_termijn) && (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="pt-6 space-y-3">
              {offerte.garantie_voorwaarden && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: pc }}>Garantie</p>
                  <p className="text-sm text-muted-foreground">{offerte.garantie_voorwaarden}</p>
                </div>
              )}
              {offerte.installatie_termijn && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: pc }}>Installatietermijn</p>
                  <p className="text-sm text-muted-foreground">{offerte.installatie_termijn}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Accept bar */}
        {!isAccepted && !isExpired && offerte.status !== "afgewezen" && (
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t py-4 -mx-6 px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Totaal: {formatCurrency(offerte.totaal_bedrag)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Geldig tot {formatDate(offerte.geldig_tot)}
                </p>
              </div>
              <Button
                onClick={() => setAcceptDialog(true)}
                className="rounded-pill gap-2"
                style={{ backgroundColor: pc }}
              >
                <Check className="h-4 w-4" /> Offerte accepteren
              </Button>
            </div>
          </div>
        )}

        {isAccepted && (
          <Card className="rounded-2xl border-0 shadow-sm bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6 text-center">
              <Check className="h-10 w-10 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800 dark:text-green-300">Offerte geaccepteerd</p>
              {offerte.accepted_at && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Op {formatDate(offerte.accepted_at)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 pb-4 space-y-1">
          {partner && (
            <>
              <p className="font-medium">{partner.naam}</p>
              <p>{[partner.adres, partner.postcode, partner.plaats].filter(Boolean).join(" • ")}</p>
              <p>{[partner.email, partner.telefoonnummer, partner.website].filter(Boolean).join(" • ")}</p>
              {(partner.kvk || partner.btw) && <p>{[partner.kvk ? `KvK: ${partner.kvk}` : "", partner.btw ? `BTW: ${partner.btw}` : ""].filter(Boolean).join(" • ")}</p>}
            </>
          )}
        </div>
      </div>

      {/* Accept confirmation dialog */}
      <Dialog open={acceptDialog} onOpenChange={setAcceptDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Offerte accepteren</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Weet u zeker dat u offerte <strong>{offerte?.offertenummer}</strong> wilt accepteren
            voor een bedrag van <strong>{formatCurrency(offerte?.totaal_bedrag || 0)}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            Door te accepteren gaat u akkoord met de voorwaarden in deze offerte.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcceptDialog(false)} className="rounded-pill">Annuleren</Button>
            <Button onClick={handleAccept} disabled={accepting} className="rounded-pill gap-2" style={{ backgroundColor: pc }}>
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Bevestig acceptatie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
