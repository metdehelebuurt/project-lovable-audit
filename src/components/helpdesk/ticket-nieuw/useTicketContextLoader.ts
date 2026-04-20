import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { KlantMatch } from "@/components/helpdesk/KlantZoekDuplicaat";
import type { TicketContext, TicketBron } from "./TicketContextCard";

type Params = {
  bron: TicketBron;
  klantIdParam: string | null;
  opdrachtId: string | null;
  installatieId: string | null;
  factuurId: string | null;
};

export type AutoFill = {
  productCategorie: string;
  productMerk: string;
  productType: string;
  installatiejaar: string;
};

const KLANT_FIELDS = "id, voornaam, achternaam, email, telefoon, adres, postcode, plaats";

/**
 * Laadt context (klant + producten + autofill) op basis van URL-parameters.
 * Productcategorie/merk/model worden opgehaald uit de producten-tabel via product_id,
 * niet via stringsplit op omschrijving (dat gaf "Alpha" ipv "thuisbatterij").
 */
export function useTicketContextLoader(p: Params) {
  const [klant, setKlantState] = useState<KlantMatch | null>(null);
  const [klantManuallySet, setKlantManuallySet] = useState(false);
  const [autoFill, setAutoFill] = useState<AutoFill | null>(null);
  const [context, setContext] = useState<TicketContext>({ bron: p.bron, loading: false });

  const setKlant = (k: KlantMatch | null) => {
    setKlantState(k);
    setKlantManuallySet(true);
  };

  // Klant uit klant_id-param
  useEffect(() => {
    if (!p.klantIdParam || klant) return;
    supabase.from("klanten").select(KLANT_FIELDS).eq("id", p.klantIdParam).maybeSingle()
      .then(({ data }) => { if (data) setKlantState(data as KlantMatch); });
  }, [p.klantIdParam, klant]);

  // Opdracht-context
  useEffect(() => {
    if (!p.opdrachtId) return;
    let cancelled = false;
    setContext((c) => ({ ...c, loading: true }));

    (async () => {
      const { data: opd } = await supabase.from("opdrachten")
        .select("id, lead_id, regels, klant_naam")
        .eq("id", p.opdrachtId).maybeSingle();
      if (cancelled || !opd) { setContext((c) => ({ ...c, loading: false })); return; }

      const regels = (opd.regels ?? []) as Array<{ product_id?: string; omschrijving?: string }>;
      const productIds = regels.map((r) => r.product_id).filter(Boolean) as string[];

      let producten: Array<{ id: string; categorie: string | null; merk: string | null; model: string | null }> = [];
      if (productIds.length > 0) {
        const { data: prods } = await supabase.from("producten")
          .select("id, categorie, merk, model").in("id", productIds);
        producten = prods ?? [];
      }

      const productenMeta = regels.map((r) => {
        const prod = producten.find((p) => p.id === r.product_id);
        return {
          omschrijving: r.omschrijving ?? "Onbekend product",
          categorie: prod?.categorie ?? null,
          merk: prod?.merk ?? null,
          model: prod?.model ?? null,
        };
      });

      const eersteMetCategorie = productenMeta.find((m) => m.categorie) ?? productenMeta[0];
      if (eersteMetCategorie) {
        setAutoFill({
          productCategorie: eersteMetCategorie.categorie ?? "",
          productMerk: eersteMetCategorie.merk ?? "",
          productType: eersteMetCategorie.model ?? "",
          installatiejaar: "",
        });
      }

      setContext({
        bron: "order",
        opdrachtId: opd.id,
        opdrachtNummer: opd.id.slice(0, 8).toUpperCase(),
        producten: productenMeta,
        loading: false,
      });

      // Klant via lead koppelen indien nog niet ingesteld
      if (!klantManuallySet && !klant && opd.lead_id && !p.klantIdParam) {
        const { data: k } = await supabase.from("klanten")
          .select(KLANT_FIELDS).eq("lead_id", opd.lead_id).maybeSingle();
        if (k && !cancelled) setKlantState(k as KlantMatch);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.opdrachtId]);

  // Installatie-context
  useEffect(() => {
    if (!p.installatieId || p.opdrachtId) return;
    let cancelled = false;
    setContext((c) => ({ ...c, loading: true }));

    (async () => {
      const { data } = await supabase.from("installaties")
        .select("id, geplande_startdatum, consument_id").eq("id", p.installatieId).maybeSingle();
      if (cancelled || !data) { setContext((c) => ({ ...c, loading: false })); return; }

      const jaar = data.geplande_startdatum ? new Date(data.geplande_startdatum).getFullYear().toString() : "";
      if (jaar) setAutoFill((af) => ({ ...(af ?? { productCategorie: "", productMerk: "", productType: "", installatiejaar: "" }), installatiejaar: jaar }));

      setContext({
        bron: "installatie",
        installatieId: data.id,
        installatieNummer: data.id.slice(0, 8).toUpperCase(),
        loading: false,
      });
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.installatieId]);

  // Factuur-context
  useEffect(() => {
    if (!p.factuurId || p.opdrachtId || p.installatieId) return;
    let cancelled = false;
    setContext((c) => ({ ...c, loading: true }));

    (async () => {
      const { data } = await supabase.from("financiele_documenten")
        .select("id, documentnummer, klant_id").eq("id", p.factuurId).maybeSingle();
      if (cancelled || !data) { setContext((c) => ({ ...c, loading: false })); return; }

      setContext({
        bron: "factuur",
        factuurId: data.id,
        factuurNummer: data.documentnummer,
        loading: false,
      });

      if (!klantManuallySet && !klant && data.klant_id) {
        const { data: k } = await supabase.from("klanten")
          .select(KLANT_FIELDS).eq("id", data.klant_id).maybeSingle();
        if (k && !cancelled) setKlantState(k as KlantMatch);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.factuurId]);

  return { klant, setKlant, autoFill, context };
}