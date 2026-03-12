import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type Offerte = Database["public"]["Tables"]["offertes"]["Row"];

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
}

interface PartnerBranding {
  naam: string;
  adres: string | null;
  postcode: string | null;
  plaats: string | null;
  email: string | null;
  telefoonnummer: string | null;
  kvk: string | null;
  btw: string | null;
  website: string | null;
  logo_url: string | null;
  primaire_kleur: string;
  secundaire_kleur: string;
  bedrijfsslogan: string | null;
}

interface SchouwData {
  schouw_nummer: string;
  categorie: string;
  geplande_datum: string;
  status: string;
  consument_naam: string | null;
  gegevens: Json | null;
  notities: string | null;
}

const CONFIG = {
  gemiddelde_stroomprijs_kwh: 0.40,
  teruglever_vergoeding_kwh: 0.07,
  dynamisch_contract_winst_factor: 0.15,
  batterij_prijs_per_kwh: 500,
  batterij_rendement: 0.90,
  zelfconsumptie_zonder_batterij: 0.30,
  zelfconsumptie_met_batterij: 0.70,
  levensduur_jaren: 15,
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

export default function OffertePDFPreview() {
  const { id } = useParams<{ id: string }>();
  const [offerte, setOfferte] = useState<Offerte | null>(null);
  const [partner, setPartner] = useState<PartnerBranding | null>(null);
  const [schouw, setSchouw] = useState<SchouwData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data: o } = await supabase.from("offertes").select("*").eq("id", id).single();
      if (!o) { setLoading(false); return; }
      setOfferte(o);

      const { data: p } = await supabase.from("partners").select("naam, adres, postcode, plaats, email, telefoonnummer, kvk, btw, website, logo_url, primaire_kleur, secundaire_kleur, bedrijfsslogan").eq("id", o.partner_id).single();
      if (p) setPartner(p as PartnerBranding);

      if (o.include_schouw && o.schouw_id) {
        const { data: s } = await supabase.from("schouwen").select("schouw_nummer, categorie, geplande_datum, status, consument_naam, gegevens, notities").eq("id", o.schouw_id).single();
        if (s) setSchouw(s as SchouwData);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-8 text-center">Laden...</div>;
  if (!offerte || !partner) return <div className="p-8 text-center">Offerte niet gevonden</div>;

  const regels = Array.isArray(offerte.regels) ? (offerte.regels as unknown as OfferteRegel[]) : [];
  const primaryColor = partner.primaire_kleur || "#5B58E1";
  const secondaryColor = partner.secundaire_kleur || "#1a1a2e";

  // Energieadvies berekening vanuit schouw gegevens
  let energieadvies: { capaciteit: number; besparing: number; terugverdientijd: number; investering: number } | null = null;
  if (offerte.include_energieadvies && schouw?.gegevens) {
    const g = schouw.gegevens as any;
    const wp = Number(g.zonnepanelen_wp) || 0;
    const verbruik = Number(g.jaarverbruik) || 0;
    if (wp > 0 && verbruik > 0) {
      const jaarOpwekking = wp * 0.85 / 1000;
      const dagelijksOverschot = (jaarOpwekking * (1 - CONFIG.zelfconsumptie_zonder_batterij)) / 365;
      const capaciteit = Math.min(Math.ceil(dagelijksOverschot), 20);
      const extraZelf = jaarOpwekking * (CONFIG.zelfconsumptie_met_batterij - CONFIG.zelfconsumptie_zonder_batterij) * CONFIG.batterij_rendement;
      const prijsverschil = CONFIG.gemiddelde_stroomprijs_kwh - CONFIG.teruglever_vergoeding_kwh;
      const besparing = Math.round(extraZelf * prijsverschil);
      const investering = capaciteit * CONFIG.batterij_prijs_per_kwh;
      const terugverdientijd = besparing > 0 ? Math.round((investering / besparing) * 10) / 10 : 0;
      if (capaciteit >= 1) {
        energieadvies = { capaciteit, besparing, terugverdientijd, investering };
      }
    }
  }

  const logoUrl = partner.logo_url
    ? (partner.logo_url.startsWith("http") ? partner.logo_url : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`)
    : null;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Print button */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 rounded-full text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          PDF downloaden / Afdrukken
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow-lg"
        >
          Terug
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto bg-white min-h-screen" style={{ fontFamily: "'Rubik', sans-serif" }}>
        {/* Header */}
        <div className="px-10 pt-10 pb-6" style={{ borderBottom: `3px solid ${primaryColor}` }}>
          <div className="flex justify-between items-start">
            <div>
              {logoUrl && (
                <img src={logoUrl} alt={partner.naam} className="h-14 mb-3 object-contain" />
              )}
              <h1 className="text-2xl font-bold" style={{ color: secondaryColor }}>{partner.naam}</h1>
              {partner.bedrijfsslogan && (
                <p className="text-sm mt-1" style={{ color: primaryColor }}>{partner.bedrijfsslogan}</p>
              )}
            </div>
            <div className="text-right text-xs" style={{ color: "#666" }}>
              {partner.adres && <p>{partner.adres}</p>}
              {(partner.postcode || partner.plaats) && <p>{partner.postcode} {partner.plaats}</p>}
              {partner.email && <p>{partner.email}</p>}
              {partner.telefoonnummer && <p>{partner.telefoonnummer}</p>}
              {partner.kvk && <p>KvK: {partner.kvk}</p>}
              {partner.btw && <p>BTW: {partner.btw}</p>}
            </div>
          </div>
        </div>

        {/* Offerte info */}
        <div className="px-10 py-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-xl font-bold mb-4" style={{ color: secondaryColor }}>OFFERTE</h2>
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Offertenummer:</span> <strong>{offerte.offertenummer}</strong></p>
                <p><span className="text-gray-500">Datum:</span> {formatDate(offerte.created_at)}</p>
                <p><span className="text-gray-500">Geldig tot:</span> {formatDate(offerte.geldig_tot)}</p>
              </div>
            </div>
            <div className="text-sm p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}08`, border: `1px solid ${primaryColor}20` }}>
              <p className="font-semibold mb-2" style={{ color: secondaryColor }}>Klantgegevens</p>
              <p className="font-medium">{offerte.klant_naam}</p>
              {offerte.klant_adres && <p>{offerte.klant_adres}</p>}
              {(offerte.klant_postcode || offerte.klant_plaats) && <p>{offerte.klant_postcode} {offerte.klant_plaats}</p>}
              <p>{offerte.klant_email}</p>
              {offerte.klant_telefoon && <p>{offerte.klant_telefoon}</p>}
            </div>
          </div>

          {/* Regels tabel */}
          <table className="w-full text-sm mb-6" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th className="text-left text-white py-2.5 px-3 font-medium">#</th>
                <th className="text-left text-white py-2.5 px-3 font-medium">Omschrijving</th>
                <th className="text-right text-white py-2.5 px-3 font-medium">Aantal</th>
                <th className="text-right text-white py-2.5 px-3 font-medium">Prijs excl.</th>
                <th className="text-right text-white py-2.5 px-3 font-medium">Korting</th>
                <th className="text-right text-white py-2.5 px-3 font-medium">Subtotaal</th>
              </tr>
            </thead>
            <tbody>
              {regels.map((r, i) => {
                const sub = r.aantal * r.prijs_per_stuk * (1 - r.korting_percentage / 100);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #eee", backgroundColor: i % 2 === 0 ? "#fff" : "#f9f9fb" }}>
                    <td className="py-2.5 px-3 text-gray-400">{i + 1}</td>
                    <td className="py-2.5 px-3">{r.omschrijving}</td>
                    <td className="py-2.5 px-3 text-right">{r.aantal}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(r.prijs_per_stuk)}</td>
                    <td className="py-2.5 px-3 text-right">{r.korting_percentage > 0 ? `${r.korting_percentage}%` : "—"}</td>
                    <td className="py-2.5 px-3 text-right font-medium">{formatCurrency(sub)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totalen */}
          <div className="flex justify-end mb-8">
            <div className="w-64 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotaal excl. BTW</span>
                <span>{formatCurrency(offerte.subtotaal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BTW</span>
                <span>{formatCurrency(offerte.btw_bedrag)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2" style={{ borderTop: `2px solid ${primaryColor}`, color: secondaryColor }}>
                <span>Totaal incl. BTW</span>
                <span>{formatCurrency(offerte.totaal_bedrag)}</span>
              </div>
            </div>
          </div>

          {/* Schouwgegevens (optioneel) */}
          {offerte.include_schouw && schouw && (
            <div className="mb-8 p-5 rounded-lg" style={{ backgroundColor: `${primaryColor}06`, border: `1px solid ${primaryColor}15` }}>
              <h3 className="font-bold text-base mb-3" style={{ color: secondaryColor }}>Schouwrapport</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Schouwnummer:</span> {schouw.schouw_nummer}</p>
                <p><span className="text-gray-500">Categorie:</span> {schouw.categorie}</p>
                <p><span className="text-gray-500">Datum:</span> {formatDate(schouw.geplande_datum)}</p>
                <p><span className="text-gray-500">Status:</span> {schouw.status}</p>
              </div>
              {schouw.gegevens && typeof schouw.gegevens === "object" && (
                <div className="mt-3 text-sm">
                  <p className="font-medium text-gray-600 mb-1">Technische gegevens:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(schouw.gegevens as Record<string, any>).map(([key, val]) => (
                      <p key={key}><span className="text-gray-500">{key.replace(/_/g, " ")}:</span> {String(val)}</p>
                    ))}
                  </div>
                </div>
              )}
              {schouw.notities && (
                <div className="mt-3 text-sm">
                  <p className="font-medium text-gray-600 mb-1">Opmerkingen:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{schouw.notities}</p>
                </div>
              )}
            </div>
          )}

          {/* Energieadvies (optioneel) */}
          {energieadvies && (
            <div className="mb-8 p-5 rounded-lg" style={{ backgroundColor: `${primaryColor}06`, border: `1px solid ${primaryColor}15` }}>
              <h3 className="font-bold text-base mb-3" style={{ color: secondaryColor }}>Energieadvies — Thuisbatterij</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Aanbevolen capaciteit:</span> <strong>{energieadvies.capaciteit} kWh</strong></p>
                <p><span className="text-gray-500">Geschatte investering:</span> <strong>{formatCurrency(energieadvies.investering)}</strong></p>
                <p><span className="text-gray-500">Jaarlijkse besparing:</span> <strong>{formatCurrency(energieadvies.besparing)}</strong></p>
                <p><span className="text-gray-500">Terugverdientijd:</span> <strong>{energieadvies.terugverdientijd} jaar</strong></p>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Dit advies is indicatief en gebaseerd op de opgegeven schouwgegevens. Werkelijke resultaten kunnen afwijken.
              </p>
            </div>
          )}

          {/* Notities */}
          {offerte.notities && (
            <div className="mb-8 text-sm">
              <h3 className="font-bold text-base mb-2" style={{ color: secondaryColor }}>Opmerkingen</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{offerte.notities}</p>
            </div>
          )}

          {/* Betalingsvoorwaarden */}
          {offerte.betalingsvoorwaarden && (
            <div className="mb-8 text-sm">
              <h3 className="font-bold text-base mb-2" style={{ color: secondaryColor }}>Betalingsvoorwaarden</h3>
              <p className="text-gray-700">{offerte.betalingsvoorwaarden}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-4 mt-auto text-xs text-center" style={{ borderTop: `2px solid ${primaryColor}`, color: "#999" }}>
          <p>{partner.naam} {partner.kvk ? `• KvK ${partner.kvk}` : ""} {partner.btw ? `• BTW ${partner.btw}` : ""}</p>
          {partner.website && <p>{partner.website}</p>}
        </div>
      </div>
    </>
  );
}
