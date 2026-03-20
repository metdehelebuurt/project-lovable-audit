import { forwardRef } from "react";

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

interface OfferteRegel {
  omschrijving: string;
  offerte_tekst?: string;
  aantal: number;
  prijs_per_stuk: number;
  btw_percentage: number;
  korting_percentage: number;
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
}

interface Props {
  opdracht: OpdrachtData;
  partner: PartnerBranding;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const OrderbevestigingPDF = forwardRef<HTMLDivElement, Props>(({ opdracht, partner }, ref) => {
  const primary = partner.primaire_kleur || "#5B58E1";
  const secondary = partner.secundaire_kleur || "#1a1a2e";
  const regels = opdracht.regels || [];
  const datum = opdracht.bevestiging_verzonden_op || opdracht.created_at;
  const logoUrl = partner.logo_url
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/partner-assets/${partner.logo_url}`
    : null;

  const subtotaal = regels.reduce((s, r) => s + r.aantal * r.prijs_per_stuk * (1 - (r.korting_percentage || 0) / 100), 0);
  const btwBedrag = regels.reduce((s, r) => {
    const sub = r.aantal * r.prijs_per_stuk * (1 - (r.korting_percentage || 0) / 100);
    return s + sub * ((r.btw_percentage || 21) / 100);
  }, 0);

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 print:text-black"
      style={{ fontFamily: "'Rubik', 'Inter', sans-serif", width: "210mm", minHeight: "297mm", margin: "0 auto" }}
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
          {partner.telefoonnummer && <p>{partner.telefoonnummer}</p>}
          {partner.email && <p>{partner.email}</p>}
          {partner.website && <p>{partner.website}</p>}
        </div>
      </div>

      {/* Accent line */}
      <div className="mx-12 h-1 rounded-full" style={{ background: `linear-gradient(to right, ${primary}, ${primary}44)` }} />

      {/* Title */}
      <div className="px-12 pt-8 pb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: secondary }}>
          Orderbevestiging
        </h1>
        <p className="text-sm text-gray-500 mt-1">
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
                Prijs
              </th>
              <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wider" style={{ color: primary }}>
                Subtotaal
              </th>
            </tr>
          </thead>
          <tbody>
            {regels.map((r, i) => {
              const sub = r.aantal * r.prijs_per_stuk * (1 - (r.korting_percentage || 0) / 100);
              return (
                <tr key={i} className={i % 2 === 1 ? "bg-gray-50/50" : ""}>
                  <td className="py-3 px-4">
                    <div className="font-medium">{r.omschrijving}</div>
                    {r.offerte_tekst && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{r.offerte_tekst}</p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">{r.aantal}</td>
                  <td className="py-3 px-4 text-right tabular-nums">{fmt(r.prijs_per_stuk)}</td>
                  <td className="py-3 px-4 text-right tabular-nums font-medium">{fmt(sub)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="px-12 pb-8">
        <div className="ml-auto w-64 space-y-1.5 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-gray-500">Subtotaal excl. BTW</span>
            <span className="font-medium tabular-nums">{fmt(subtotaal)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-gray-500">BTW</span>
            <span className="font-medium tabular-nums">{fmt(btwBedrag)}</span>
          </div>
          <div className="h-px bg-gray-200 my-1" />
          <div className="flex justify-between py-2">
            <span className="font-bold">Totaal incl. BTW</span>
            <span className="font-bold text-lg tabular-nums" style={{ color: primary }}>
              {fmt(opdracht.totaal_bedrag)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-12 py-6 text-center" style={{ backgroundColor: secondary, color: "white" }}>
        <p className="text-sm font-medium">{partner.naam}</p>
        <div className="flex items-center justify-center gap-4 mt-1 text-xs opacity-70">
          {partner.kvk && <span>KVK: {partner.kvk}</span>}
          {partner.btw && <span>BTW: {partner.btw}</span>}
          {partner.email && <span>{partner.email}</span>}
        </div>
      </div>
    </div>
  );
});

OrderbevestigingPDF.displayName = "OrderbevestigingPDF";

export default OrderbevestigingPDF;
