import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrialAanmelding } from "@/hooks/website/useTrialAanmelding";
import {
  cardStyle, chipStyle, foutStyle, inputStyle, labelStyle, meldingStyle,
  primaryButtonStyle, secondaryButtonStyle, stapBadgeStyle,
} from "@/website/components/forms/formStyles";

const BRANCHES = ["Zonnepanelen", "Warmtepompen", "Laadpalen", "Isolatie", "Thuisbatterijen"];

export function TrialForm() {
  const navigate = useNavigate();
  const [stap, setStap] = useState<1 | 2>(1);
  const [bedrijfsnaam, setBedrijfsnaam] = useState("");
  const [email, setEmail] = useState("");
  const [branche, setBranche] = useState(BRANCHES[0]);
  const [voornaam, setVoornaam] = useState("");
  const [achternaam, setAchternaam] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [wachtwoord, setWachtwoord] = useState("");
  const [fout, setFout] = useState<string | null>(null);
  const aanmelding = useTrialAanmelding();

  const naarStap2 = () => {
    if (bedrijfsnaam.trim().length < 2) return setFout("Vul je bedrijfsnaam in.");
    if (!email.includes("@")) return setFout("Vul een geldig zakelijk e-mailadres in.");
    setFout(null);
    setStap(2);
  };

  const versturen = async (e: React.FormEvent) => {
    e.preventDefault();
    setFout(null);
    if (wachtwoord.length < 8) return setFout("Kies een wachtwoord van minimaal 8 tekens.");
    try {
      const res = await aanmelding.mutateAsync({
        bedrijfsnaam, voornaam, achternaam, email, branche,
        telefoon: telefoon || null,
        password: wachtwoord,
      });
      navigate(res.ingelogd ? "/onboarding" : "/login");
    } catch (err) {
      setFout(err instanceof Error ? err.message : "Er ging iets mis.");
    }
  };

  return (
    <form style={cardStyle} onSubmit={versturen} noValidate>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", gap: "10px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "22px", color: "var(--text-heading)" }}>
          Maak je account
        </span>
        <span style={stapBadgeStyle}>Stap {stap} van 2</span>
      </div>
      <p style={{ margin: "0px 0px 18px", fontSize: "14.5px", color: "var(--text-muted)" }}>
        Twee minuten werk. Geen creditcard nodig.
      </p>
      <div style={{ height: "4px", borderRadius: "99px", background: "var(--neutral-100)", marginBottom: "20px" }}>
        <div style={{ height: "4px", borderRadius: "99px", width: stap === 1 ? "50%" : "100%", background: "var(--color-primary)" }} />
      </div>

      {stap === 1 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="trial-bedrijf" style={labelStyle}>
              Bedrijfsnaam <span style={{ color: "var(--color-primary)" }}>*</span>
            </label>
            <input
              id="trial-bedrijf" required placeholder="Installatiebedrijf B.V." style={inputStyle}
              value={bedrijfsnaam} onChange={(e) => setBedrijfsnaam(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="trial-email" style={labelStyle}>
              Zakelijk e-mailadres <span style={{ color: "var(--color-primary)" }}>*</span>
            </label>
            <input
              id="trial-email" type="email" required placeholder="jij@bedrijf.nl" style={inputStyle}
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", marginBottom: "9px" }}>
              Wat installeer je vooral?
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {BRANCHES.map((b) => (
                <button
                  key={b} type="button" className="mh-tab" aria-pressed={branche === b}
                  style={chipStyle(branche === b)} onClick={() => setBranche(b)}
                >
                  {b}
                </button>
              ))}
            </div>
            <p style={{ margin: "9px 0px 0px", fontSize: "13px", color: "var(--text-muted)" }}>
              Hiermee zetten we de juiste schouw, offerte en opleverdocumenten voor je klaar.
            </p>
          </div>
          <button type="button" className="mh-btn" style={primaryButtonStyle} onClick={naarStap2}>
            Verder
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
              <label htmlFor="trial-voornaam" style={labelStyle}>
                Voornaam <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                id="trial-voornaam" required style={inputStyle}
                value={voornaam} onChange={(e) => setVoornaam(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
              <label htmlFor="trial-achternaam" style={labelStyle}>
                Achternaam <span style={{ color: "var(--color-primary)" }}>*</span>
              </label>
              <input
                id="trial-achternaam" required style={inputStyle}
                value={achternaam} onChange={(e) => setAchternaam(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="trial-telefoon" style={labelStyle}>Telefoonnummer</label>
            <input
              id="trial-telefoon" type="tel" placeholder="06-12345678" style={inputStyle}
              value={telefoon} onChange={(e) => setTelefoon(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label htmlFor="trial-wachtwoord" style={labelStyle}>
              Wachtwoord <span style={{ color: "var(--color-primary)" }}>*</span>
            </label>
            <input
              id="trial-wachtwoord" type="password" required minLength={8} style={inputStyle}
              value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)}
            />
            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>Minimaal 8 tekens.</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button type="button" style={secondaryButtonStyle} onClick={() => setStap(1)}>Terug</button>
            <button type="submit" className="mh-btn" style={primaryButtonStyle} disabled={aanmelding.isPending}>
              {aanmelding.isPending ? "Account aanmaken..." : "Start 14 dagen gratis"}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
            Door verder te gaan ga je akkoord met de voorwaarden en het privacybeleid.
          </p>
        </div>
      )}

      <p aria-live="polite" style={fout ? foutStyle : meldingStyle}>
        {fout ?? "Je gegevens zijn veilig · AVG-conform · data in de EU"}
      </p>
    </form>
  );
}
