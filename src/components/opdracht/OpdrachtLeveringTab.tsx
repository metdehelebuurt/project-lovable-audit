import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ExternalLink, Truck, Mail } from "lucide-react";
import { useZendingen, useDeleteZending, type OpdrachtZending } from "@/hooks/logistiek/useZendingen";
import ZendingDialog from "./ZendingDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  opdrachtId: string;
  partnerId: string;
  klantEmail?: string | null;
  klantNaam?: string | null;
}

const STATUS_KLEUR: Record<string, string> = {
  gepland: "bg-muted text-foreground",
  onderweg: "bg-warning/15 text-warning-foreground",
  geleverd: "bg-success-light text-success",
  geannuleerd: "bg-error-light text-error",
};

const STATUS_LABEL: Record<string, string> = {
  gepland: "Gepland",
  onderweg: "Onderweg",
  geleverd: "Geleverd",
  geannuleerd: "Geannuleerd",
};

const VERVOERDER_LABEL: Record<string, string> = {
  postnl: "PostNL",
  dhl: "DHL",
  dpd: "DPD",
  ups: "UPS",
  gls: "GLS",
  eigen_bezorging: "Eigen bezorging",
  anders: "Anders",
};

const OpdrachtLeveringTab = ({ opdrachtId, partnerId, klantEmail, klantNaam }: Props) => {
  const { data: zendingen = [], isLoading } = useZendingen(opdrachtId);
  const deleteMut = useDeleteZending(opdrachtId);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OpdrachtZending | null>(null);
  const [notifying, setNotifying] = useState<string | null>(null);

  const handleNotify = async (z: OpdrachtZending) => {
    if (!klantEmail) {
      toast.error("Klant heeft geen e-mailadres");
      return;
    }
    setNotifying(z.id);
    const html = `
      <p>Beste ${klantNaam ?? "klant"},</p>
      <p>Uw bestelling is ${z.status === "geleverd" ? "afgeleverd" : "onderweg"}.</p>
      <p><strong>Vervoerder:</strong> ${VERVOERDER_LABEL[z.vervoerder] ?? z.vervoerder}<br/>
      ${z.trackingnummer ? `<strong>Trackingnummer:</strong> ${z.trackingnummer}<br/>` : ""}
      ${z.tracking_url ? `<a href="${z.tracking_url}">Volg uw zending</a>` : ""}</p>
      ${z.verwachte_leverdatum ? `<p>Verwachte levering: ${new Date(z.verwachte_leverdatum).toLocaleDateString("nl-NL")}</p>` : ""}
    `;
    const { error } = await supabase.functions.invoke("email-api-send", {
      body: {
        partner_id: partnerId,
        to: klantEmail,
        subject: `Update over uw levering`,
        html,
      },
    });
    setNotifying(null);
    if (error) toast.error("Verzenden mislukt: " + error.message);
    else toast.success("Klant geïnformeerd via e-mail");
  };

  return (
    <Card className="rounded-2xl border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" /> Levering & verzending
        </CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Zending toevoegen
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : zendingen.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen zendingen geregistreerd voor deze order.</p>
        ) : (
          <div className="space-y-3">
            {zendingen.map((z) => (
              <div key={z.id} className="border rounded-lg p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={STATUS_KLEUR[z.status]}>{STATUS_LABEL[z.status]}</Badge>
                    <span className="font-medium">{VERVOERDER_LABEL[z.vervoerder] ?? z.vervoerder}</span>
                    {z.trackingnummer && (
                      <span className="text-sm text-muted-foreground">#{z.trackingnummer}</span>
                    )}
                    {z.tracking_url && (
                      <a href={z.tracking_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                        Volgen <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-x-2">
                    {z.verzenddatum && <span>Verzonden: {new Date(z.verzenddatum).toLocaleDateString("nl-NL")}</span>}
                    {z.verwachte_leverdatum && <span>· Verwacht: {new Date(z.verwachte_leverdatum).toLocaleDateString("nl-NL")}</span>}
                    {z.afleverdatum && <span>· Geleverd: {new Date(z.afleverdatum).toLocaleString("nl-NL")}</span>}
                    {z.ontvangen_door && <span>· Door: {z.ontvangen_door}</span>}
                  </div>
                  {z.notitie && <p className="text-xs mt-1">{z.notitie}</p>}
                </div>
                <div className="flex gap-1">
                  {(z.status === "onderweg" || z.status === "geleverd") && klantEmail && (
                    <Button size="sm" variant="ghost" onClick={() => handleNotify(z)} disabled={notifying === z.id} title="Klant informeren">
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(z); setOpen(true); }} aria-label="Bewerk">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    if (confirm("Zending verwijderen?")) deleteMut.mutate(z.id);
                  }} aria-label="Verwijder">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ZendingDialog
        open={open}
        onOpenChange={setOpen}
        opdrachtId={opdrachtId}
        partnerId={partnerId}
        zending={editing}
      />
    </Card>
  );
};

export default OpdrachtLeveringTab;