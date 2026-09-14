import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createRapport, findExistingRapportenVoorOpdracht, logAudit } from "@/components/oplever/api/opleverApi";
import { buildOpleverPrefillFromInstallatie } from "@/components/oplever/api/opleverPrefill";
import { toast } from "@/hooks/use-toast";
import type { Opleverrapport } from "@/components/oplever/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import OpleverStatusBadge from "@/components/oplever/StatusBadge";

interface PendingCreate {
  partner_id: string;
  installateur_id: string;
  installatie_id: string | null;
  klant_id: string | null;
  opdracht_id: string | null;
  scope_omschrijving: string | null;
  opleverdatum: string | null;
  batterij_spec?: Opleverrapport["batterij_spec"];
  omvormer_spec?: Opleverrapport["omvormer_spec"];
  backup_box_spec?: Opleverrapport["backup_box_spec"];
  extra_velden?: Opleverrapport["extra_velden"];
  rapport_type: Opleverrapport["rapport_type"];
}

export default function OpleverNieuw() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(true);
  const [bestaande, setBestaande] = useState<Opleverrapport[]>([]);
  const [pending, setPending] = useState<PendingCreate | null>(null);
  const [duplicaatReden, setDuplicaatReden] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [forceerDuplicaat, setForceerDuplicaat] = useState(false);

  useEffect(() => {
    if (!profile?.id || !profile?.partner_id) return;
    (async () => {
      try {
        const installatieId = params.get("installatie");
        const prefill = installatieId
          ? await buildOpleverPrefillFromInstallatie(installatieId).catch(() => null)
          : null;

        const partnerId = profile.partner_id as string;
        const opdrachtId = prefill?.opdracht_id ?? null;
        const klantId = prefill?.klant_id ?? params.get("klant");

        const payload: PendingCreate = {
          partner_id: partnerId,
          installateur_id: profile.id,
          installatie_id: installatieId,
          klant_id: klantId,
          opdracht_id: opdrachtId,
          scope_omschrijving: prefill?.scope_omschrijving ?? null,
          opleverdatum: prefill?.opleverdatum ?? new Date().toISOString().slice(0, 10),
          batterij_spec: prefill?.batterij_spec,
          omvormer_spec: prefill?.omvormer_spec,
          backup_box_spec: prefill?.backup_box_spec,
          extra_velden: prefill?.extra_velden,
        };

        // Check bestaande rapporten voor dezelfde verkooporder/installatie
        const bestaandeRapporten = await findExistingRapportenVoorOpdracht(
          partnerId,
          opdrachtId,
          installatieId,
        );

        if (bestaandeRapporten.length > 0) {
          setBestaande(bestaandeRapporten);
          setPending(payload);
          setShowDialog(true);
          setBusy(false);
          return;
        }

        const id = await createRapport(payload);
        nav(`/opleveringen/${id}`, { replace: true });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Aanmaken mislukt";
        toast({ title: "Mislukt", description: msg, variant: "destructive" });
        nav("/opleveringen", { replace: true });
      } finally {
        setBusy(false);
      }
    })();
  }, [profile?.id, profile?.partner_id, params, nav]);

  const openBestaand = (id: string) => {
    nav(`/opleveringen/${id}`, { replace: true });
  };

  const bevestigDuplicaat = async () => {
    if (!pending) return;
    if (!duplicaatReden.trim()) {
      toast({ title: "Reden verplicht", description: "Geef een reden voor het duplicaat.", variant: "destructive" });
      return;
    }
    try {
      setBusy(true);
      const id = await createRapport(pending);
      // Persist duplicaat metadata + audit
      const origineel = bestaande[0];
      await logAudit(id, pending.partner_id, pending.installateur_id, "duplicaat_aangemaakt", {
        origineel_id: origineel?.id,
        origineel_rapportnummer: origineel?.rapportnummer,
        reden: duplicaatReden,
      });
      // Beste-effort update van duplicaat velden (kolommen zijn zojuist toegevoegd)
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase
        .from("opleverrapporten" as never)
        .update({ duplicaat_van_id: origineel?.id ?? null, duplicaat_reden: duplicaatReden } as never)
        .eq("id", id);
      nav(`/opleveringen/${id}`, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Aanmaken mislukt";
      toast({ title: "Mislukt", description: msg, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <>
      <div className="p-8 text-center text-muted-foreground">
        {busy ? "Opleverrapport voorbereiden en klant-, order- en productgegevens invullen…" : ""}
      </div>
      <AlertDialog open={showDialog} onOpenChange={(open) => {
        if (!open) {
          nav("/opleveringen", { replace: true });
        }
        setShowDialog(open);
      }}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Er bestaat al een opleverrapport voor deze verkooporder</AlertDialogTitle>
            <AlertDialogDescription>
              Om te voorkomen dat gegevens verspreid raken werken we het liefst in één rapport per verkooporder.
              Kies een bestaand rapport om verder te werken, of maak alsnog een nieuw rapport aan met een reden.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2 max-h-56 overflow-auto rounded border p-2">
            {bestaande.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded hover:bg-muted/50 p-2">
                <div className="min-w-0">
                  <div className="font-mono text-sm truncate">{r.rapportnummer}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.opleverdatum ?? "—"} · <OpleverStatusBadge status={r.status} />
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => openBestaand(r.id)}>Openen</Button>
              </div>
            ))}
          </div>

          {forceerDuplicaat && (
            <div className="space-y-2">
              <Label htmlFor="duplicaat-reden">Reden voor extra rapport (verplicht)</Label>
              <Textarea
                id="duplicaat-reden"
                value={duplicaatReden}
                onChange={(e) => setDuplicaatReden(e.target.value)}
                placeholder="Bijv. tweede fase installatie, herkeuring na wijzigingen…"
                rows={3}
              />
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            {!forceerDuplicaat ? (
              <Button variant="outline" onClick={() => setForceerDuplicaat(true)}>Toch nieuw aanmaken</Button>
            ) : (
              <AlertDialogAction onClick={bevestigDuplicaat}>Bevestig nieuw rapport</AlertDialogAction>
            )}
            {bestaande[0] && !forceerDuplicaat && (
              <Button onClick={() => openBestaand(bestaande[0].id)}>Meest recente openen</Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
