import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  klantId: string | null;
}

type Klant = {
  id: string;
  voornaam: string | null;
  achternaam: string | null;
  email: string | null;
  telefoon: string | null;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
};

export default function KlantContactStrook({ klantId }: Props) {
  const { data: klant } = useQuery({
    queryKey: ["klant-contact", klantId],
    enabled: !!klantId,
    queryFn: async () => {
      const { data } = await supabase
        .from("klanten")
        .select("id, voornaam, achternaam, email, telefoon, adres, postcode, plaats")
        .eq("id", klantId!)
        .maybeSingle();
      return data as Klant | null;
    },
  });

  if (!klantId || !klant) return null;

  const naam = [klant.voornaam, klant.achternaam].filter(Boolean).join(" ").trim() || "Naamloze klant";
  const adresRegel = [klant.adres, [klant.postcode, klant.plaats].filter(Boolean).join(" ")].filter(Boolean).join(" · ");

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold truncate">{naam}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
            {klant.telefoon && (
              <a href={`tel:${klant.telefoon}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Phone className="h-3.5 w-3.5" />{klant.telefoon}
              </a>
            )}
            {klant.email && (
              <a href={`mailto:${klant.email}`} className="inline-flex items-center gap-1.5 hover:text-foreground truncate">
                <Mail className="h-3.5 w-3.5" />{klant.email}
              </a>
            )}
            {adresRegel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />{adresRegel}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {klant.telefoon && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`tel:${klant.telefoon}`}><Phone className="h-3.5 w-3.5" />Bellen</a>
            </Button>
          )}
          {klant.email && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <a href={`mailto:${klant.email}`}><Mail className="h-3.5 w-3.5" />Mailen</a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to={`/klanten/${klant.id}`}><ExternalLink className="h-3.5 w-3.5" />Klantkaart</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}