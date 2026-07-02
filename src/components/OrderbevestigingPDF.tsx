import { forwardRef, Fragment } from "react";
import { useProductMetaMap } from "@/hooks/producten/useProductMetaMap";

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
  iban?: string | null;
  iban_tnv?: string | null;
  bic?: string | null;
}

interface OfferteRegel {
  product_id?: string;
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
  korting_bedrag: number;
  korting_type: "percentage" | "bedrag";
}

interface OpdrachtData {
  id: string;
  klant_naam: string;
  klant_email: string | null;
  klant_telefoon: string | null;
  klant_adres: string | null;
  klant_postcode: string | null;
  klant_plaats: string | null;
  regels: OfferteRegel[];
  totaal_bedrag: number;
  created_at: string;
  bevestiging_verzonden_op: string | null;
  status: string;
  opdrachtnummer?: string;
  betalingstermijn_dagen?: number;
  geschatte_leverdatum?: string | null;
}

interface Props {
  opdracht: OpdrachtData;
  partner: PartnerBranding;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

/** Group VAT by percentage for legal compliance */
function buildBtwOverzicht(regels: OfferteRegel[]) {
  const map: Record<number, { grondslag: number; bedrag: number }> = {};
  for (const r of regels) {
    const pct = r.btw_percentage ?? 21;
    if (!map[pct]) map[pct] = { grondslag: 0, bedrag: 0 };
    const sub = regelSub(r);
    map[pct].grondslag += sub;
    map[pct].bedrag += sub * (pct / 100);
  }
  return Object.entries(map)
    .map(([pct, v]) => ({ percentage: Number(pct), ...v }))
    .sort((a, b) => b.percentage - a.percentage);
}

const regelSub = (r: OfferteRegel) => {
  const bruto = r.aantal * r.prijs_per_stuk;
  if (r.korting_type === "bedrag") return bruto - (r.korting_bedrag || 0);
  return bruto * (1 - (r.korting_percentage || 0) / 100);
};

const OrderbevestigingPDF = forwardRef<HTMLDivElement, Props>(({ opdracht, partner }, ref) => {
  const primary = partner.primaire_kleur || "#5B58E1";
  const secondary = partner.secundaire_kleur || "#1a1a2e";
  const regels = opdracht.regels || [];
  const productIds = Array.from(new Set(regels.map((r) => r.product_id).filter((id): id is string => !!id)));
  const { data: metaMap = {} } = useProductMetaMap(productIds);
  const datum = opdracht.bevestiging_verzonden_op || opdracht.created_at;
  // logo_url kan al een volledige URL zijn (nieuwere uploads) of een storage path (legacy).
  const rawLogo = partner.logo_url;
  const logoUrl = rawLogo
    ? /^https?:\/\//i.test(rawLogo)
      ? rawLogo
      : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${rawLogo}`
    : null;

  const subtotaal = regels.reduce((s, r) => s + regelSub(r), 0);
  const btwOverzicht = buildBtwOverzicht(regels);
  const btwTotaal = btwOverzicht.reduce((s, b) => s + b.bedrag, 0);
  const ordernummer = opdracht.opdrachtnummer || opdracht.id.substring(0, 8).toUpperCase();
  const betalingstermijn = opdracht.betalingstermijn_dagen || 14;

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 print:text-black"
      style={{ fontFamily: "'Rubik', 'Inter', sans-serif", width: "210mm", minHeight: "297mm", margin: "0 auto", position: "relative" }}
    >
      {/* Header */}
      <div className="px-12 pt-10 pb-6 flex items-start justify-between">
        <div>
          {logoUrl ? (
            <img src={logoUrl} alt={partner.naam} className="h-12 mb-3 object-contain" crossOrigin="anonymous" />
          ) : (
            <div className="text-2xl font-bold mb-3" style={{ color: primary }}>{partner.naam}</div>
          )}
          {partner.bedrijfsslogan && (
            <p className="text-xs text-gray-500 italic">{partner.bedrijfsslogan}</p>
          )}
        </div>
        <div className="text-right text-xs text-gray-500 space-y-0.5">
          {partner.adres && <p>{partner.adres}</p>}
          {(partner.postcode || partner.plaats) && <p>{partner.postcode} {partner.plaats}</p>}
          {partner.telefoonnummer && <p>Tel: {partner.telefoonnummer}</p>}
          {partner.email && <p>{partner.email}</p>}
          {partner.kvk && <p>KvK: {partner.kvk}</p>}
          {partner.btw && <p>BTW-nr: {partner.btw}</p>}
          {partner.website && <p>{partner.website}</p>}
        </div>
      </div>

      {/* Accent line */}
      <div className="mx-12 h-1 rounded-full" style={{ background: `linear-gradient(to right, ${primary}, ${primary}44)` }} />

      {/* Title + ordernummer */}
      <div className="px-12 pt-8 pb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: secondary }}>
          Orderbevestiging
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ordernummer: <span className="font-mono font-semibold text-gray-700">{ordernummer}</span>
        </p>
        <p className="text-sm text-gray-500">
          Datum: {new Date(datum).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Client info */}
      <div className="px-12 pb-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Klantgegevens</p>
            <p className="font-semibold text-sm">{opdracht.klant_naam}</p>
            {opdracht.klant_adres && <p className="text-sm text-gray-600">{opdracht.klant_adres}</p>}
            {(opdracht.klant_postcode || opdracht.klant_plaats) && (
              <p className="text-sm text-gray-600">{opdracht.klant_postcode} {opdracht.klant_plaats}</p>
            )}
            {opdracht.klant_email && <p className="text-sm text-gray-600 mt-2">{opdracht.klant_email}</p>}
            {opdracht.klant_telefoon && <p className="text-sm text-gray-600">{opdracht.klant_telefoon}</p>}
          </div>
          <div className="p-5 rounded-xl border border-gray-100 bg-gray-50/50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ordergegevens</p>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="font-medium capitalize">{opdracht.status.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Orderdatum</span>
                <span className="font-medium">{new Date(opdracht.created_at).toLocaleDateString("nl-NL")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Betalingstermijn</span>
                <span className="font-medium">{betalingstermijn} dagen</span>
              </div>
              {opdracht.geschatte_leverdatum && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Geschatte levering</span>
                  <span className="font-medium">{new Date(opdracht.geschatte_leverdatum).toLocaleDateString("nl-NL")}</span>
                </div>
              )}
              {opdracht.bevestiging_verzonden_op && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Bevestigd op</span>
                  <span className="font-medium">{new Date(opdracht.bevestiging_verzonden_op).toLocaleDateString("nl-NL")}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products table */}
      <div className="px-12 pb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ backgroundColor: primary + "10" }}>
              <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                Omschrijving
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                Aantal
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                Prijs excl.
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                BTW
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                Subtotaal
              </th>
            </tr>
          </thead>
          <tbody>
            {regels.map((r, i) => {
              const sub = regelSub(r);
              const meta = r.product_id ? metaMap[r.product_id] : undefined;
              const comps = meta?.is_assemblage ? meta.componenten : [];
              return (
                <Fragment key={i}>
                <tr className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                  <td className="py-3 px-4">
                    <div className="font-medium">
                      {r.omschrijving}
                      {r.btw_percentage === 0 && (
                        <span className="text-xs text-red-600 ml-2 italic">BTW verlegd</span>
                      )}
                    </div>
                    {r.offerte_tekst && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.offerte_tekst}</p>
                    )}
                    {comps.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500">
                        {comps.map((c) => (
                          <li key={c.component_id}>↳ {c.aantal * r.aantal}× {[c.merk, c.naam].filter(Boolean).join(" ")}{c.heeft_serienummer ? " · SN" : ""}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{r.aantal}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{fmt(r.prijs_per_stuk)}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{r.btw_percentage}%</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">{fmt(sub)}</td>
                </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals with BTW per tarief */}
      <div className="px-12 pb-8">
        <div className="ml-auto w-72 space-y-1.5 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Subtotaal excl. BTW</span>
            <span className="font-medium tabular-nums">{fmt(subtotaal)}</span>
          </div>
          {/* BTW per tarief (Art. 35a Wet OB) */}
          {btwOverzicht.map((b) => (
            <div key={b.percentage} className="flex justify-between py-1">
              <span className="text-gray-500">
                {b.percentage === 0 ? "BTW verlegd (0%)" : `BTW ${b.percentage}% over ${fmt(b.grondslag)}`}
              </span>
              <span className="font-medium tabular-nums">{fmt(b.bedrag)}</span>
            </div>
          ))}
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between py-2">
            <span className="font-bold">Totaal incl. BTW</span>
            <span className="font-bold text-lg tabular-nums" style={{ color: primary }}>
              {fmt(opdracht.totaal_bedrag)}
            </span>
          </div>
        </div>
      </div>

      {/* Betalingsgegevens */}
      {partner.iban && (
        <div className="mx-12 mb-8 p-4 rounded-lg border border-gray-100 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Betalingsgegevens</p>
          <div className="flex gap-8 text-sm">
            <div><span className="text-gray-500">T.n.v.:</span> {partner.iban_tnv || partner.naam}</div>
            <div><span className="text-gray-500">IBAN:</span> <strong>{partner.iban}</strong></div>
            {partner.bic && <div><span className="text-gray-500">BIC:</span> <strong>{partner.bic}</strong></div>}
            <div><span className="text-gray-500">Kenmerk:</span> <strong>{ordernummer}</strong></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-12 py-6 text-center"
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: secondary, color: "white" }}
      >
        <p className="text-sm font-medium">{partner.naam}</p>
        <div className="flex items-center justify-center gap-4 mt-1 text-xs opacity-70 flex-wrap">
          {partner.kvk && <span>KvK: {partner.kvk}</span>}
          {partner.btw && <span>BTW: {partner.btw}</span>}
          {partner.iban && <span>IBAN: {partner.iban}</span>}
          {partner.email && <span>{partner.email}</span>}
        </div>
      </div>
    </div>
  );
});

OrderbevestigingPDF.displayName = "OrderbevestigingPDF";

export default OrderbevestigingPDF;
