const ROL_LABELS: Record<string, string> = {
  superadmin: "Platformbeheerder",
  partner_admin: "Organisatiebeheerder",
  backoffice: "Backoffice",
  partner_staff: "Medewerker",
  adviseur: "Energieadviseur",
  installateur: "Installateur",
  consument: "Consument",
  affiliate: "Affiliate",
};

function dagdeel(): string {
  const u = new Date().getHours();
  if (u < 6) return "Goedenacht";
  if (u < 12) return "Goedemorgen";
  if (u < 18) return "Goedemiddag";
  return "Goedenavond";
}

function vandaagFormatted(): string {
  const d = new Date();
  return d.toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export function VandaagBegroeting({
  voornaam, rol,
}: { voornaam?: string | null; rol: string }) {
  return (
    <header className="space-y-1">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        {vandaagFormatted()}
      </p>
      <h1 className="text-2xl md:text-3xl font-semibold text-foreground">
        {dagdeel()}{voornaam ? `, ${voornaam}` : ""}
      </h1>
      <p className="text-sm text-muted-foreground">
        {ROL_LABELS[rol] ?? "Welkom"} · jouw overzicht voor vandaag
      </p>
    </header>
  );
}