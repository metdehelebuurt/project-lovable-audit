import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ZoekForm } from "./ZoekForm";
import { ResultatenTabel } from "./ResultatenTabel";
import { useFirecrawlZoek } from "./useFirecrawlZoek";
import type { ExtractedLead, ZoekFormState } from "./types";

const INITIAL: ZoekFormState = {
  modus: "search",
  branches: ["zonnepanelen"],
  regio: "",
  query: "installateur zonnepanelen",
  url: "",
  limit: 10,
  bestemming: "pool",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function KoudeLeadsZoekDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState<ZoekFormState>(INITIAL);
  const [stap, setStap] = useState<"form" | "resultaten">("form");
  const [leads, setLeads] = useState<ExtractedLead[]>([]);
  const [selectie, setSelectie] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  const zoek = useFirecrawlZoek();

  const reset = () => {
    setForm(INITIAL); setStap("form"); setLeads([]); setSelectie(new Set()); setImporting(false);
  };
  const close = () => { reset(); onOpenChange(false); };

  const doZoek = async () => {
    try {
      const res = await zoek.mutateAsync(form);
      setLeads(res.leads);
      setSelectie(new Set(res.leads.map((_, i) => i)));
      setStap("resultaten");
      if (res.leads.length === 0) {
        toast.info(res.melding ?? "Geen bedrijven gevonden");
      } else {
        toast.success(`${res.leads.length} mogelijke leads gevonden`);
      }
    } catch (e) {
      toast.error("Zoeken mislukt", { description: e instanceof Error ? e.message : "Onbekende fout" });
    }
  };

  const doImport = async () => {
    if (!user) { toast.error("Niet ingelogd"); return; }
    const geselecteerd = Array.from(selectie).map((i) => leads[i]).filter(Boolean);
    if (geselecteerd.length === 0) { toast.error("Selecteer minimaal 1 lead"); return; }
    setImporting(true);
    try {
      const payload = geselecteerd.map((l) => ({
        bedrijfsnaam: l.bedrijfsnaam,
        contactpersoon: null,
        email: l.email,
        telefoon: l.telefoon,
        website: l.website,
        branche: l.branche ?? form.branches[0] ?? null,
        regio: l.plaats ?? form.regio ?? null,
        notities: [
          l.fragment ? `Fragment: ${l.fragment}` : null,
          l.bron_url ? `Bron: ${l.bron_url}` : null,
          `Gevonden via Firecrawl-zoekopdracht`,
        ].filter(Boolean).join("\n"),
        bron: "eigen_import" as const,
        status: "nieuw" as const,
        eigenaar_id: form.bestemming === "pool" ? null : user.id,
        created_by: user.id,
      }));
      const { error } = await supabase.from("affiliate_leads").insert(payload);
      if (error) throw error;
      toast.success(`${payload.length} leads toegevoegd aan ${form.bestemming === "pool" ? "de pool" : "je pijplijn"}`);
      qc.invalidateQueries({ queryKey: ["affiliate-leads"] });
      close();
    } catch (e) {
      toast.error("Import mislukt", { description: e instanceof Error ? e.message : "Onbekende fout" });
    } finally {
      setImporting(false);
    }
  };

  const aantalSelectie = selectie.size;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close(); else onOpenChange(v); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leads zoeken met AI</DialogTitle>
          <DialogDescription>
            Vind nieuwe koude leads via Firecrawl en AI-extractie. De resultaten worden gefilterd op
            Nederlandse bedrijven in de duurzaamheidsbranche.
          </DialogDescription>
        </DialogHeader>

        {stap === "form" && (
          <ZoekForm form={form} setForm={setForm} onZoek={doZoek} isLoading={zoek.isPending} />
        )}

        {stap === "resultaten" && (
          <ResultatenTabel leads={leads} selectie={selectie} setSelectie={setSelectie} />
        )}

        <DialogFooter className="gap-2">
          {stap === "form" ? (
            <Button variant="outline" onClick={close} disabled={zoek.isPending}>Annuleren</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStap("form")} disabled={importing} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Terug
              </Button>
              <Button onClick={doImport} disabled={importing || aantalSelectie === 0} className="gap-2">
                {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                {aantalSelectie} lead{aantalSelectie === 1 ? "" : "s"} toevoegen
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}