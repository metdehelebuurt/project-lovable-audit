import { useState, type FormEvent } from "react";
import { useContactBericht } from "@/hooks/website/useContactBericht";
import {
  foutStyle, inputStyle, labelStyle, meldingStyle, primaryButtonStyle,
} from "@/website/components/forms/formStyles";

const SOORTEN = [
  "Accountant of boekhouder",
  "Branchecoach of adviseur",
  "Leverancier of distributeur",
  "Branchevereniging of opleider",
  "Marketeer of webbouwer",
  "Anders",
];

export function AffiliateForm() {
  const [naam, setNaam] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [soort, setSoort] = useState("");
  const [bericht, setBericht] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const versturen = useContactBericht();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (naam.trim().length < 2) return setFout("Vul je naam in.");
    if (!email.includes("@")) return setFout("Vul een geldig e-mailadres in.");
    try {
      await versturen.mutateAsync({
        naam,
        bedrijfsnaam: bedrijfsnaam || null,
        email,
        telefoon: telefoon || null,
        onderwerp: `Partnerprogramma${soort ? ` \u2014 ${soort}` : ""}`,
        bericht: bericht.trim() || "Aanmelding partnerprogramma via de website.",
      });
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  if (versturen.isSuccess) {
    return (
      <p style={{ margin: 0, fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.6" }}>
        Bedankt voor je aanmelding. We nemen binnen één werkdag contact met je op via {email}.
      </p>
    );
  }

  return (
    <form style={{ display: "flex", flexDirection: "column", gap: "18px" }} onSubmit={onSubmit} noValidate>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="aff-naam" style={labelStyle}>
            Naam <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input id="aff-naam" required placeholder="Voor- en achternaam" style={inputStyle}
            value={naam} onChange={(e) => setNaam(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="aff-bedrijf" style={labelStyle}>Bedrijfsnaam</label>
          <input id="aff-bedrijf" placeholder="Bedrijfsnaam" style={inputStyle}
            value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="aff-email" style={labelStyle}>
            E-mailadres <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input id="aff-email" type="email" required placeholder="naam@bedrijf.nl" style={inputStyle}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="aff-telefoon" style={labelStyle}>Telefoonnummer</label>
          <input id="aff-telefoon" type="tel" placeholder="06-12345678" style={inputStyle}
            value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="aff-soort" style={labelStyle}>Wat voor partij ben je?</label>
        <select id="aff-soort" style={inputStyle} value={soort} onChange={(e) => setSoort(e.target.value)}>
          <option value="">Kies…</option>
          {SOORTEN.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="aff-bericht" style={labelStyle}>Vertel kort over je netwerk</label>
        <textarea id="aff-bericht" rows={4}
          placeholder="Met wat voor installatiebedrijven werk je, en hoeveel ongeveer?"
          style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical", lineHeight: "1.5" }}
          value={bericht} onChange={(e) => setBericht(e.target.value)} />
      </div>
      <button type="submit" className="mh-btn" style={primaryButtonStyle} disabled={versturen.isPending}>
        {versturen.isPending ? "Versturen..." : "Aanmelden als partner"}
      </button>
      <p aria-live="polite" style={fout ? foutStyle : meldingStyle}>
        {fout ?? "We nemen binnen één werkdag contact met je op."}
      </p>
    </form>
  );
}
