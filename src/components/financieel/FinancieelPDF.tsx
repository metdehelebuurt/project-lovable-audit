import { formatCurrency, type OfferteRegel, regelSubtotaal } from "@/types/offerte";

interface Props {
  doc: {
    documentnummer: string;
    type: string;
    status: string;
    factuurdatum: string;
    vervaldatum?: string;
    regels: OfferteRegel[];
    subtotaal: number;
    btw_bedrag: number;
    totaal_bedrag: number;
    korting_totaal: number;
    notities?: string;
    betalingstermijn_dagen: number;
  };
  klant?: {
    voornaam?: string;
    achternaam?: string;
    bedrijfsnaam?: string;
    email?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
  } | null;
  leverancier?: {
    naam?: string;
    email?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    btw_nummer?: string;
    kvk_nummer?: string;
  } | null;
  partner?: {
    naam?: string;
    adres?: string;
    postcode?: string;
    plaats?: string;
    email?: string;
    telefoonnummer?: string;
    kvk?: string;
    btw?: string;
    logo_url?: string;
    primaire_kleur?: string;
  } | null;
}

const typeLabels: Record<string, string> = {
  verkoopfactuur: "FACTUUR",
  creditnota: "CREDITNOTA",
  inkoopfactuur: "INKOOPFACTUUR",
  inkooporder: "INKOOPORDER",
  pakbon: "PAKBON",
};

export function FinancieelPDF({ doc, klant, leverancier, partner }: Props) {
  const regels = doc.regels || [];
  const relatie = klant
    ? { naam: klant.bedrijfsnaam || `${klant.voornaam || ""} ${klant.achternaam || ""}`.trim(), ...klant }
    : leverancier
    ? { naam: leverancier.naam || "", ...leverancier }
    : null;

  const primaryColor = partner?.primaire_kleur || "#1a56db";

  return (
    <div className="bg-white text-black p-10 max-w-[210mm] mx-auto text-sm font-sans print:p-0" style={{ minHeight: "297mm" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          {partner?.logo_url ? (
            <img src={partner.logo_url} alt="Logo" className="h-12 mb-3 object-contain" />
          ) : (
            <h2 className="text-xl font-bold" style={{ color: primaryColor }}>{partner?.naam || "Bedrijfsnaam"}</h2>
          )}
          <div className="text-xs text-gray-500 space-y-0.5 mt-2">
            {partner?.adres && <p>{partner.adres}</p>}
            {partner?.postcode && partner?.plaats && <p>{partner.postcode} {partner.plaats}</p>}
            {partner?.email && <p>{partner.email}</p>}
            {partner?.telefoonnummer && <p>{partner.telefoonnummer}</p>}
            {partner?.kvk && <p>KvK: {partner.kvk}</p>}
            {partner?.btw && <p>BTW: {partner.btw}</p>}
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: primaryColor }}>
            {typeLabels[doc.type] || "DOCUMENT"}
          </h1>
          <p className="text-lg font-mono mt-1">{doc.documentnummer}</p>
          <div className="text-xs text-gray-500 mt-3 space-y-0.5">
            <p>Datum: {new Date(doc.factuurdatum).toLocaleDateString("nl-NL")}</p>
            {doc.vervaldatum && <p>Vervaldatum: {new Date(doc.vervaldatum).toLocaleDateString("nl-NL")}</p>}
          </div>
        </div>
      </div>

      {/* Relatie */}
      {relatie && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
            {klant ? "Factuuradres" : "Leverancier"}
          </p>
          <p className="font-semibold">{relatie.naam}</p>
          {relatie.adres && <p>{relatie.adres}</p>}
          {relatie.postcode && relatie.plaats && <p>{relatie.postcode} {relatie.plaats}</p>}
          {relatie.email && <p>{relatie.email}</p>}
        </div>
      )}

      {/* Regels tabel */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2" style={{ borderColor: primaryColor }}>
            <th className="text-left py-2 font-semibold">Omschrijving</th>
            <th className="text-right py-2 font-semibold w-16">Aantal</th>
            <th className="text-right py-2 font-semibold w-24">Prijs</th>
            <th className="text-right py-2 font-semibold w-16">BTW</th>
            <th className="text-right py-2 font-semibold w-24">Totaal</th>
          </tr>
        </thead>
        <tbody>
          {regels.map((r, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2">{r.omschrijving}</td>
              <td className="py-2 text-right">{r.aantal}</td>
              <td className="py-2 text-right">{formatCurrency(r.prijs_per_stuk)}</td>
              <td className="py-2 text-right">{r.btw_percentage}%</td>
              <td className="py-2 text-right">{formatCurrency(regelSubtotaal(r))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totalen */}
      <div className="flex justify-end mb-10">
        <div className="w-64 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotaal</span>
            <span>{formatCurrency(doc.subtotaal)}</span>
          </div>
          {doc.korting_totaal > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Korting</span>
              <span>-{formatCurrency(doc.korting_totaal)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">BTW</span>
            <span>{formatCurrency(doc.btw_bedrag)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg border-t-2 pt-2" style={{ borderColor: primaryColor }}>
            <span>Totaal</span>
            <span>{formatCurrency(doc.totaal_bedrag)}</span>
          </div>
        </div>
      </div>

      {/* Betalingsinfo */}
      {doc.type !== "pakbon" && (
        <div className="text-xs text-gray-500 border-t pt-4 space-y-1">
          <p>Betalingstermijn: {doc.betalingstermijn_dagen} dagen</p>
          {doc.notities && <p>Opmerking: {doc.notities}</p>}
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-10 left-10 right-10 text-center text-xs text-gray-400 border-t pt-3">
        {partner?.naam} {partner?.kvk ? `• KvK ${partner.kvk}` : ""} {partner?.btw ? `• BTW ${partner.btw}` : ""}
      </div>
    </div>
  );
}
