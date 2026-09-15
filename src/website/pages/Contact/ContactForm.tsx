import { useState, type FormEvent } from "react";
import { useContactBericht } from "@/hooks/website/useContactBericht";
import {
  foutStyle, inputStyle, labelStyle, meldingStyle, primaryButtonStyle,
} from "@/website/components/forms/formStyles";

const ONDERWERPEN = ["Demo aanvragen", "Vraag over prijzen", "Technische vraag", "Iets anders"];

const veld = (label: string, verplicht: boolean) => (
  <>
    {label}
    {verplicht ? <span style={{ color: "var(--color-primary)" }}> *</span> : null}
  </>
);

export function ContactForm() {
  const [naam, setNaam] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [email, setEmail] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [onderwerp, setOnderwerp] = useState("");
  const [bericht, setBericht] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const versturen = useContactBericht();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (naam.trim().length < 2) return setFout("Vul je naam in.");
    if (!email.includes("@")) return setFout("Vul een geldig e-mailadres in.");
    if (bericht.trim().length < 5) return setFout("Vertel kort waar je vraag over gaat.");
    try {
      await versturen.mutateAsync({
        naam,
        bedrijfsnaam: bedrijfsnaam || null,
        email,
        telefoon: telefoon || null,
        onderwerp: onderwerp || null,
        bericht,
      });
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  if (versturen.isSuccess) {
    return (
      <p style={{ margin: 0, fontSize: "15.5px", color: "var(--text-body)", lineHeight: "1.6" }}>
        Bedankt, je bericht is verstuurd. We reageren binnen één werkdag op {email}.
      </p>
    );
  }

  return (
    <form
      style={{ display: "flex", flexDirection: "column", gap: "16px", flex: "1 1 0%" }}
      onSubmit={onSubmit}
      noValidate
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="contact-naam" style={labelStyle}>{veld("Naam", true)}</label>
          <input id="contact-naam" required style={inputStyle} value={naam} onChange={(e) => setNaam(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="contact-bedrijf" style={labelStyle}>{veld("Bedrijfsnaam", false)}</label>
          <input id="contact-bedrijf" style={inputStyle} value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="contact-email" style={labelStyle}>{veld("E-mailadres", true)}</label>
          <input id="contact-email" type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label htmlFor="contact-telefoon" style={labelStyle}>{veld("Telefoonnummer", false)}</label>
          <input id="contact-telefoon" type="tel" style={inputStyle} value={telefoon} onChange={(e) => setTelefoon(e.target.value)} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="contact-onderwerp" style={labelStyle}>{veld("Onderwerp", false)}</label>
        <select id="contact-onderwerp" style={inputStyle} value={onderwerp} onChange={(e) => setOnderwerp(e.target.value)}>
          <option value="">Kies…</option>
          {ONDERWERPEN.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <label htmlFor="contact-bericht" style={labelStyle}>{veld("Je bericht", true)}</label>
        <textarea
          id="contact-bericht" rows={6} required
          style={{ ...inputStyle, height: "auto", padding: "12px 14px", resize: "vertical" }}
          value={bericht} onChange={(e) => setBericht(e.target.value)}
        />
      </div>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        <button type="submit" className="mh-btn" style={primaryButtonStyle} disabled={versturen.isPending}>
          {versturen.isPending ? "Versturen..." : "Verstuur bericht"}
        </button>
        <p aria-live="polite" style={fout ? foutStyle : meldingStyle}>
          {fout ?? "Je gegevens zijn veilig · AVG-conform · data in de EU"}
        </p>
      </div>
    </form>
  );
}
