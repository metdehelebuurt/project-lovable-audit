import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, MapPin, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Installatie } from "./api/installatieApi";

export default function InstallatieKlantCard({ installatie }: { installatie: Installatie }) {
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