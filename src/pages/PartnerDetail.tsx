import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, FileText, Handshake } from "lucide-react";
import { PromotePartnerToAffiliateButton } from "@/components/affiliate/PromotePartnerToAffiliateButton";
import type { Database } from "@/integrations/supabase/types";

type Partner = Database["public"]["Tables"]["partners"]["Row"];
type PartnerStatus = Database["public"]["Enums"]["partner_status"];

const statusLabels: Record<PartnerStatus, string> = {
  in_review: "In review",
  actief: "Actief",
  inactief: "Inactief",
  geblokkeerd: "Geblokkeerd",
};

const statusColors: Record<PartnerStatus, string> = {
  in_review: "bg-warning-light text-warning-foreground",
  actief: "bg-success-light text-success",
  inactief: "bg-muted text-muted-foreground",
  geblokkeerd: "bg-error-light text-error",
};

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("partners").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Laden...</div>;
  if (!partner) return <div className="p-6">Partner niet gevonden.</div>;

  const contact = [partner.contactpersoon_voornaam, partner.contactpersoon_achternaam].filter(Boolean).join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/partners")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Terug
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{partner.naam}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge className={statusColors[partner.status]}>{statusLabels[partner.status]}</Badge>
              {partner.abonnement_type && (
                <Badge variant="outline" className="capitalize">{partner.abonnement_type}</Badge>
              )}
              {partner.is_affiliate && (
                <Badge className="bg-primary/10 text-primary border-0 gap-1">
                  <Handshake className="h-3 w-3" /> Affiliate
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <PromotePartnerToAffiliateButton
            partnerId={partner.id}
            partnerNaam={partner.naam}
            isAffiliate={!!partner.is_affiliate}
            size="default"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Bedrijfsgegevens</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Bedrijfsnaam" value={partner.naam} />
            <Field label="KvK-nummer" value={partner.kvk} />
            <Field label="BTW-nummer" value={partner.btw} />
            <Field label="Website" value={partner.website} />
            <Field label="E-mail" value={partner.email} />
            <Field label="Telefoon" value={partner.telefoonnummer} />
            <Field label="Adres" value={partner.adres} />
            <Field label="Postcode" value={partner.postcode} />
            <Field label="Plaats" value={partner.plaats} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Contactpersoon</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Naam" value={contact} />
            <Field label="Functie" value={partner.contactpersoon_functie} />
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{partner.contactpersoon_email || "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{partner.contactpersoon_telefoon || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Contract & licentie</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Field label="Contract type" value={partner.contract_type} />
            <Field label="Abonnement" value={partner.abonnement_type} />
            <Field label="Max adviseurs" value={partner.licentie_adviseurs} />
            <Field label="Max installateurs" value={partner.licentie_installateurs} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> Notities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-foreground">
              {partner.notities || <span className="text-muted-foreground">Geen notities</span>}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}