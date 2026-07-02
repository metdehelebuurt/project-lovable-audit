import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createRapport } from "@/components/oplever/api/opleverApi";
import { buildOpleverPrefillFromInstallatie } from "@/components/oplever/api/opleverPrefill";
import { toast } from "@/hooks/use-toast";

export default function OpleverNieuw() {
  const { profile } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!profile?.id || !profile?.partner_id) return;
    (async () => {
      try {
        const installatieId = params.get("installatie");
        const prefill = installatieId
          ? await buildOpleverPrefillFromInstallatie(installatieId).catch(() => null)
          : null;

        const id = await createRapport({
          partner_id: profile.partner_id as string,
          installateur_id: profile.id,
          installatie_id: installatieId,
          klant_id: prefill?.klant_id ?? params.get("klant"),
          opdracht_id: prefill?.opdracht_id ?? null,
          scope_omschrijving: prefill?.scope_omschrijving ?? null,
          opleverdatum: prefill?.opleverdatum ?? new Date().toISOString().slice(0, 10),
          batterij_spec: prefill?.batterij_spec,
          omvormer_spec: prefill?.omvormer_spec,
          backup_box_spec: prefill?.backup_box_spec,
          extra_velden: prefill?.extra_velden,
        });
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

  return (
    <div className="p-8 text-center text-muted-foreground">
      {busy ? "Opleverrapport voorbereiden en klant-, order- en productgegevens invullen…" : ""}
    </div>
  );
}
