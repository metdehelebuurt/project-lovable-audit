import { useState, type FormEvent } from "react";
import { useDemoAanvraag } from "@/hooks/website/useDemoAanvraag";
import {
  chipStyle, foutStyle, inputStyle, labelStyle, meldingStyle, primaryButtonStyle,
} from "@/website/components/forms/formStyles";

type Voorkeur = "Deze week" | "Volgende week" | "Maakt niet uit";

const VOORKEUREN: Voorkeur[] = ["Deze week", "Volgende week", "Maakt niet uit"];

/** Eerstvolgende werkdag om 10:00, eventueel een week later. */
function voorstelMoment(voorkeur: Voorkeur): string {
  const datum = new Date();
  datum.setHours(10, 0, 0, 0);
  datum.setDate(datum.getDate() + (voorkeur === "Volgende week" ? 8 : 1));
  while (datum.getDay() === 0 || datum.getDay() === 6) {
    datum.setDate(datum.getDate() + 1);
  }
  return datum.toISOString();
}

export function KennismakingForm() {
  const [naam, setNaam] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [email, setEmail] = useState("");
  const [voorkeur, setVoorkeur] = useState<Voorkeur>("Deze week");
  const [bericht, setBericht] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const aanvraag = useDemoAanvraag();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (naam.trim().length < 2) return setFout("Vul je naam in.");
    if (telefoon.trim().length < 6) return setFout("Vul je telefoonnummer in.");
    if (!email.includes("@")) return setFout("Vul een geldig e-mailadres in.");
    try {
      await aanvraag.mutateAsync({
        bedrijfsnaam: bedrijfsnaam.trim() || naam,
        contactpersoon: naam,
        email,
        telefoon,
        gewenst_moment: voorstelMoment(voorkeur),
        bericht: [`Kennismaking aangevraagd. Voorkeur: ${voorkeur}.`, bericht].filter(Boolean).join(" "),
      });
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  if (aanvraag.isSuccess) {
    return (
      <p style={{ margin: 0, fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.6" }}>
        Bedankt, je aanvraag staat genoteerd. We bellen binnen één werkdag op {telefoon} om een moment af te spreken.
      </p>
    );
  }

  return (
    <form style={{ display: "flex", flexDirection: "column", gap: "16px" }} onSubmit={onSubmit} noValidate>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="km-naam" style={labelStyle}>
            Naam <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input id="km-naam" required style={inputStyle} value={naam} onChange={(e) => setNaam(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="km-bedrijf" style={labelStyle}>Bedrijfsnaam</label>
          <input id="km-bedrijf" style={inputStyle} value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="km-telefoon" style={labelStyle}>
            Telefoonnummer <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input id="km-telefoon" type="tel" required style={inputStyle} value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="km-email" style={labelStyle}>
            E-mailadres <span style={{ color: "var(--color-primary)" }}>*</span>
          </label>
          <input id="km-email" type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "9px" }}>
          Wanneer komt het uit?
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {VOORKEUREN.map((optie) => (
            <button
              key={optie}
              type="button"
              aria-pressed={voorkeur === optie}
              style={chipStyle(voorkeur === optie)}
              onClick={() => setVoorkeur(optie)}
            >
              {optie}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="km-bericht" style={labelStyle}>Waar loop je nu tegenaan?</label>
        <textarea
          id="km-bericht" rows={4}
          placeholder="Bijvoorbeeld: offertes kosten te veel tijd, of leads blijven liggen."
          style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical" }}
          value={bericht} onChange={(e) => setBericht(e.target.value)}
        />
      </div>
      <button type="submit" className="mh-btn" style={primaryButtonStyle} disabled={aanvraag.isPending}>
        {aanvraag.isPending ? "Versturen..." : "Plan mijn kennismaking"}
      </button>
      <p aria-live="polite" style={fout ? foutStyle : meldingStyle}>
        {fout ?? "Vrijblijvend · AVG-conform · data in de EU"}
      </p>
    </form>
  );
}
