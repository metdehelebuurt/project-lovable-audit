import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinancieelPDF } from "@/components/financieel/FinancieelPDF";
import { renderElementToPdfBlob } from "@/lib/pdfFromElement";

/**
 * Headless render van een factuur naar een PDF blob.
 * Mount FinancieelPDF in een verborgen off-screen container, wacht op assets,
 * genereert PDF via html2canvas + jsPDF en cleant alles weer op.
 */

export interface RenderedFactuurPdf {
  blob: Blob;
  dataUrl: string;
}

async function fetchFactuurContext(factuurId: string) {
  const { data: doc, error } = await supabase
    .from("financiele_documenten")
    .select(
      "*, klanten(voornaam, achternaam, bedrijfsnaam, email, adres, postcode, plaats, telefoon), leveranciers(naam, email, adres, postcode, plaats, telefoon, btw_nummer, kvk_nummer), offertes(offertenummer)",
    )
    .eq("id", factuurId)
    .single();
  if (error || !doc) throw new Error(error?.message || "Factuur niet gevonden");

  const { data: partner } = await supabase
    .from("partners")
    .select(
      "naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, iban, iban_tnv, bic, logo_url, primaire_kleur",
    )
    .eq("id", doc.partner_id)
    .single();

  let installatie = null;
  if (doc.installatie_id) {
    const { data } = await supabase
      .from("installaties")
      .select("consument_naam, geplande_startdatum, geplande_einddatum, status")
      .eq("id", doc.installatie_id)
      .single();
    installatie = data;
  }

  const eenmalig = doc.eenmalige_relatie as Record<string, string> | null;
  const klant =
    doc.klanten ??
    (eenmalig
      ? {
          voornaam: eenmalig.naam,
          achternaam: "",
          bedrijfsnaam: eenmalig.naam,
          email: eenmalig.email,
          adres: eenmalig.adres,
          postcode: eenmalig.postcode,
          plaats: eenmalig.plaats,
          telefoon: eenmalig.telefoon,
        }
      : null);

  return {
    doc: { ...doc, offerte_nummer: (doc as any).offertes?.offertenummer } as any,
    klant: klant as any,
    leverancier: doc.leveranciers as any,
    partner,
    installatie,
  };
}

async function waitForAssets(container: HTMLElement) {
  if (typeof document !== "undefined" && (document as Document & { fonts?: FontFaceSet }).fonts) {
    try {
      await (document as Document & { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* ignore */
    }
  }
  const images = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
  // korte tick zodat layout settled is
  await new Promise((r) => setTimeout(r, 50));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

export async function renderFactuurPdf(factuurId: string): Promise<RenderedFactuurPdf> {
  const ctx = await fetchFactuurContext(factuurId);

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-10000px;top:0;width:210mm;background:#fff;z-index:-1;pointer-events:none;";
  container.className = "pdf-print-root";
  document.body.appendChild(container);

  let root: Root | null = null;
  try {
    root = createRoot(container);
    root.render(
      createElement(FinancieelPDF, {
        doc: ctx.doc,
        klant: ctx.klant,
        leverancier: ctx.leverancier,
        partner: ctx.partner,
        installatie: ctx.installatie,
      }),
    );
    // Wacht tot React heeft gerenderd
    await new Promise((r) => setTimeout(r, 100));
    await waitForAssets(container);

    const blob = await renderElementToPdfBlob(container);
    const dataUrl = await blobToDataUrl(blob);
    return { blob, dataUrl };
  } finally {
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    container.remove();
  }
}
