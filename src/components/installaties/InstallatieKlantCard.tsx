import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, ExternalLink, Navigation, HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Installatie } from "./api/installatieApi";

interface MonteurInfo {
  voornaam: string | null;
  achternaam: string | null;
  telefoon: string | null;
  email: string | null;
}

export default function InstallatieKlantCard({ installatie }: { installatie: Installatie }) {
  const [monteur, setMonteur] = useState<MonteurInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!installatie.installateur_id) {
      setMonteur(null);
      return;
    }
    supabase
      .from("users")
      .select("voornaam, achternaam, telefoon, email")
      .eq("id", installatie.installateur_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setMonteur(data as MonteurInfo | null);
      });
    return () => { cancelled = true; };
  }, [installatie.installateur_id]);

  const klantAdresVolledig = [installatie.klant_adres, installatie.klant_postcode, installatie.klant_plaats].filter(Boolean).join(" ");
  const heeftAfwijkendWerkadres = installatie.werkadres && installatie.werkadres.trim() !== (installatie.klant_adres ?? "").trim();
  const mapsUrl = (adres: string) => `https://maps.google.com/?q=${encodeURIComponent(adres)}`;

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Klant</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="font-medium text-foreground">{installatie.consument_naam ?? "Onbekend"}</div>
        {installatie.klant_email && (
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${installatie.klant_email}`} className="hover:underline">{installatie.klant_email}</a></div>
        )}
        {installatie.klant_telefoon && (
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${installatie.klant_telefoon}`} className="hover:underline">{installatie.klant_telefoon}</a></div>
        )}
        {(installatie.klant_adres || installatie.klant_postcode) && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{installatie.klant_adres}, {installatie.klant_postcode} {installatie.klant_plaats}</span>
          </div>
        )}
        {heeftAfwijkendWerkadres && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Werkadres (afwijkend)</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-warning mt-0.5" />
              <span>{installatie.werkadres}</span>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl gap-1.5">
              <a href={mapsUrl(installatie.werkadres!)} target="_blank" rel="noreferrer">
                <Navigation className="h-3.5 w-3.5" /> Open in Maps
              </a>
            </Button>
          </div>
        )}
        {!heeftAfwijkendWerkadres && klantAdresVolledig && (
          <Button variant="outline" size="sm" asChild className="rounded-xl gap-1.5">
            <a href={mapsUrl(klantAdresVolledig)} target="_blank" rel="noreferrer">
              <Navigation className="h-3.5 w-3.5" /> Open in Maps
            </a>
          </Button>
        )}
        {monteur && (
          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <HardHat className="h-3.5 w-3.5" /> Toegewezen monteur
            </p>
            <div className="font-medium">{[monteur.voornaam, monteur.achternaam].filter(Boolean).join(" ") || "Onbekend"}</div>
            {monteur.telefoon && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <a href={`tel:${monteur.telefoon}`} className="hover:underline">{monteur.telefoon}</a></div>
            )}
            {monteur.email && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <a href={`mailto:${monteur.email}`} className="hover:underline">{monteur.email}</a></div>
            )}
          </div>
        )}
        {installatie.klant_id && (
          <Button variant="outline" size="sm" asChild className="rounded-xl gap-1.5 mt-2">
            <Link to={`/klanten/${installatie.klant_id}`}>
              <ExternalLink className="h-3.5 w-3.5" /> Klantkaart openen
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}