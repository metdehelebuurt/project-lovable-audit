import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Mail, MessageCircle, ExternalLink, Loader2, Zap, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type SchouwCategorie = Database["public"]["Enums"]["schouw_categorie"];

const CATEGORIES: { key: SchouwCategorie; label: string }[] = [
  { key: "zonnepanelen", label: "Zonnepanelen" },
  { key: "warmtepomp", label: "Warmtepomp" },
  { key: "isolatie_dak", label: "Isolatie dak" },
  { key: "isolatie_muur", label: "Isolatie muur" },
  { key: "isolatie_vloer", label: "Isolatie vloer" },
  { key: "hr_glas", label: "HR++ glas" },
  { key: "ventilatie", label: "Ventilatie" },
  { key: "thuisbatterij", label: "Thuisbatterij" },
];

const generateSchouwNummer = () => `SCH-${Date.now().toString(36).toUpperCase()}`;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  leadId: string | null | undefined;
  partnerId: string | undefined;
  adviseurId: string | undefined;
  consumentNaam?: string | null;
  klantEmail?: string | null;
  klantTelefoon?: string | null;
}

/**
 * Snelle self-service schouw: hergebruikt bestaande open self-service schouw voor deze lead
 * of maakt er één aan. Toont meteen de link met kopieer/e-mail/WhatsApp acties.
 */
export default function QuickSelfServiceSchouwDialog({
  open, onOpenChange, leadId, partnerId, adviseurId,
  consumentNaam, klantEmail, klantTelefoon,
}: Props) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [categorie, setCategorie] = useState<SchouwCategorie>("zonnepanelen");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canShareSelfService = !!profile?.rol && profile.rol !== "installateur";

  const { data: bestaand, isLoading, refetch } = useQuery({
    queryKey: ["snelle-schouw-self-service", leadId],
    enabled: !!leadId && open && canShareSelfService,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schouwen")
        .select("id, schouw_nummer, categorie, self_service_token, is_self_service, self_service_completed_at, status")
        .eq("lead_id", leadId!)
        .eq("is_self_service", true)
        .is("self_service_completed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => { if (!open) { setCopied(false); } }, [open]);

  const aanmaken = async () => {
    if (!canShareSelfService) {
      toast.error("Geen toegang om een klantlink te delen");
      return;
    }
    if (!leadId || !partnerId || !adviseurId) {
      toast.error("Lead, partner of adviseur ontbreekt");
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from("schouwen").insert({
        categorie,
        geplande_datum: new Date().toISOString().slice(0, 10),
        consument_naam: consumentNaam ?? null,
        klant_email: klantEmail ?? null,
        lead_id: leadId,
        partner_id: partnerId,
        adviseur_id: adviseurId,
        schouw_nummer: generateSchouwNummer(),
        is_self_service: true,
        status: "gepland",
      } as any);
      if (error) throw error;
      toast.success("Self-service schouw aangemaakt");
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["klant-schouwen"] });
      queryClient.invalidateQueries({ queryKey: ["lead-schouwen"] });
    } catch (err: any) {
      toast.error("Aanmaken mislukt", { description: err.message });
    } finally {
      setCreating(false);
    }
  };

  const url = bestaand?.self_service_token
    ? `${window.location.origin}/public/schouw/${bestaand.self_service_token}`
    : "";

  const kopieer = async () => {
    if (!canShareSelfService) return;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link gekopieerd");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const mailBody = encodeURIComponent(
    `Hallo${consumentNaam ? " " + consumentNaam : ""},\n\n` +
    `Wij bereiden uw installatie voor. Wilt u via onderstaande link een paar foto's van uw woning aanleveren? ` +
    `Het kost maar een paar minuten en helpt ons enorm.\n\n${url}\n\nMet vriendelijke groet,`
  );
  const mailSubject = encodeURIComponent("Foto's aanleveren voor uw installatie");
  const waText = encodeURIComponent(
    `Hallo${consumentNaam ? " " + consumentNaam : ""}, kunt u via deze link enkele foto's van uw woning aanleveren? ${url}`
  );
  const waTel = (klantTelefoon || "").replace(/[^\d+]/g, "");

  if (!profile?.rol || !canShareSelfService) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Snelle schouw door klant
          </DialogTitle>
          <DialogDescription>
            Stuur de klant een beveiligde link waarmee zij zelf foto's van meterkast, omvormerlocatie en AC-traject kunnen uploaden.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Laden…
          </div>
        ) : bestaand ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
              <div className="text-sm">
                <span className="font-medium">{bestaand.schouw_nummer}</span>
                <span className="text-muted-foreground"> • {bestaand.categorie}</span>
              </div>
              <Badge variant="secondary">Actief</Badge>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Unieke link</Label>
              <div className="flex gap-2 mt-1">
                <Input value={url} readOnly className="rounded-xl font-mono text-xs" />
                <Button onClick={kopieer} variant="outline" className="rounded-xl gap-1.5 shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Gekopieerd" : "Kopieer"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={!klantEmail}>
                <a href={klantEmail ? `mailto:${klantEmail}?subject=${mailSubject}&body=${mailBody}` : undefined}>
                  <Mail className="h-4 w-4" /> E-mail
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={!waTel}>
                <a href={waTel ? `https://wa.me/${waTel.replace(/^\+/, "")}?text=${waText}` : undefined} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl gap-1.5">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" /> Open
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tip: na voltooiing verschijnen de foto's automatisch onder de schouw en krijg je een melding.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat" className="text-sm">Categorie</Label>
              <Select value={categorie} onValueChange={(v) => setCategorie(v as SchouwCategorie)}>
                <SelectTrigger id="cat" className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Er bestaat nog geen open self-service schouw voor deze klant. Klik op aanmaken om er één te starten en de link te delen.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Sluiten</Button>
          {!bestaand && !isLoading && (
            <Button onClick={aanmaken} disabled={creating || !leadId} className="rounded-xl gap-1.5">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Self-service schouw aanmaken
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}