import { useMemo, useState } from "react";
import { useDemoAanvraag } from "@/hooks/website/useDemoAanvraag";
import { genereerDemoDagen, slotNaarIso } from "@/website/components/forms/demoSlots";
import {
  cardStyle, foutStyle, inputStyle, labelStyle, meldingStyle,
  primaryButtonStyle, secondaryButtonStyle, slotStyle, stapBadgeStyle,
} from "@/website/components/forms/formStyles";

interface Slot {
  iso: string;
  label: string;
}

export function DemoForm() {
  const dagen = useMemo(() => genereerDemoDagen(), []);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [stap, setStap] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [contactpersoon, setContactpersoon] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [bericht, setBericht] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const aanvraag = useDemoAanvraag();

  const naarStap2 = () => {
    if (!slot) return setFout("Kies eerst een moment dat jou uitkomt.");
    if (!email.includes("@")) return setFout("Vul een geldig zakelijk e-mailadres in.");
    setFout(null);
    setStap(2);
  };

  const versturen = async (e: React.FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (bedrijfsnaam.trim().length < 2) return setFout("Vul je bedrijfsnaam in (minimaal 2 tekens).");
    if (contactpersoon.trim().length < 2) return setFout("Vul je naam in (minimaal 2 tekens).");
    if (!slot) return setFout("Kies eerst een moment dat jou uitkomt.");
    try {
      await aanvraag.mutateAsync({
        bedrijfsnaam: bedrijfsnaam.trim(),
        contactpersoon: contactpersoon.trim(),
        email: email.trim(),
        telefoon: telefoon.trim() || null,
        gewenst_moment: slot.iso,
        bericht: bericht.trim() || null,
      });
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  if (aanvraag.isSuccess) {
    return (
      <div style={cardStyle}>
        <h2 style={{ margin: "0px 0px 10px", fontSize: "22px" }}>Demo staat genoteerd</h2>
        <p style={{ margin: 0, fontSize: "15px", color: "var(--text-body)" }}>
          We hebben je aanvraag voor {slot?.label} ontvangen. Je krijgt een bevestiging op {email}.
        </p>
      </div>
    );
  }

  return (
    <form style={cardStyle} onSubmit={versturen} noValidate>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", gap: "10px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "22px", color: "var(--text-heading)" }}>
          Plan een gratis demo
        </span>
        <span style={stapBadgeStyle}>Stap {stap} van 2</span>
      </div>

      {stap === 1 ? (
        <>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "10px" }}>
            Kies een moment dat jou uitkomt
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {dagen.map((dag) => (
              <div key={dag.label}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "8px", textTransform: "capitalize" }}>
                  {dag.label}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {dag.tijden.map((tijd) => {
                    const iso = slotNaarIso(dag.datum, tijd);
                    return (
                      <button
                        key={tijd}
                        type="button"
                        aria-pressed={slot?.iso === iso}
                        style={slotStyle(slot?.iso === iso)}
                        onClick={() => setSlot({ iso, label: `${dag.label} om ${tijd}` })}
                      >
                        {tijd}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "18px" }}>
            <label htmlFor="demo-email" style={labelStyle}>
              Zakelijk e-mailadres <span style={{ color: "var(--color-primary)" }}>*</span>
            </label>
            <input
              id="demo-email" type="email" required placeholder="jij@bedrijf.nl" style={inputStyle}
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button type="button" className="mh-btn" style={primaryButtonStyle} onClick={naarStap2}>
            Verder
          </button>
        </>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "14px", color: "var(--text-body)" }}>
              Gekozen moment: <strong>{slot?.label}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="demo-bedrijf" style={labelStyle}>
                Bedrijfsnaam <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                id="demo-bedrijf" required placeholder="Installatiebedrijf B.V." style={inputStyle}
                value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="demo-naam" style={labelStyle}>
                Naam <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                id="demo-naam" required placeholder="Voor- en achternaam" style={inputStyle}
                value={contactpersoon} onChange={(e) => setContactpersoon(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="demo-telefoon" style={labelStyle}>Telefoonnummer</label>
              <input
                id="demo-telefoon" type="tel" placeholder="06-12345678" style={inputStyle}
                value={telefoon} onChange={(e) => setTelefoon(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="demo-bericht" style={labelStyle}>Waar wil je het vooral over hebben?</label>
              <textarea
                id="demo-bericht" rows={3} style={{ ...inputStyle, height: "auto", padding: "10px 14px" }}
                value={bericht} onChange={(e) => setBericht(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "18px" }}>
            <button type="button" style={secondaryButtonStyle} onClick={() => setStap(1)}>Terug</button>
            <button type="submit" className="mh-btn" style={primaryButtonStyle} disabled={aanvraag.isPending}>
              {aanvraag.isPending ? "Versturen..." : "Demo bevestigen"}
            </button>
          </div>
        </>
      )}

      <p aria-live="polite" style={fout ? foutStyle : meldingStyle}>
        {fout ?? (stap === 1 ? "Je gegevens zijn veilig · AVG-conform · data in de EU" : "")}
      </p>
    </form>
  );
}
