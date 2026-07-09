// Live E2E: maakt per trial_bron een trial aan via de trial-signup edge function
// zodat je kunt bevestigen dat elke pipeline (selfservice / affiliate / sales /
// google_oauth) correct wordt geactiveerd. Verifieer daarna in de DB dat de
// `trial_bron` per partner klopt en dat de bron-tellingen in /sales/trials
// met precies +1 per bron toenemen.
//
// Draaien: `node scripts/e2e/trial-bron-pipelines.mjs`
const URL = "https://xmguipmetciwvzeyxugu.supabase.co/functions/v1/trial-signup";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtZ3VpcG1ldGNpd3Z6ZXl4dWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTQyMTIsImV4cCI6MjA4ODczMDIxMn0.xMdj0s4Zu5_PjeRcqOgDOJ7ovxP5FHhW0OIyLlYHdCY";
const REF = "mijnhuis-nu-7853";
const stamp = Date.now();
const cases = [
  { label: "selfservice", body: { bron: "selfservice" } },
  { label: "affiliate",   body: { ref_code: REF } },
  { label: "sales",       body: { bron: "sales" } },
  { label: "google_oauth",body: { bron: "google_oauth" } },
];
const gemaakt = [];
for (const c of cases) {
  const email = `e2e-bron-${c.label}-${stamp}@example.com`;
  const body = {
    bedrijfsnaam: `E2E ${c.label} ${stamp}`,
    voornaam: "E2E", achternaam: c.label,
    email, password: "TestPass123!",
    toestemming: true,
    ...c.body,
  };
  const r = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON}`, "apikey": ANON },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  console.log(c.label, r.status, JSON.stringify(j).slice(0, 250));
  if (!r.ok) process.exit(1);
  gemaakt.push({ label: c.label, partner_id: j.partner_id, email });
}
console.log("\nGEMAAKT=" + JSON.stringify(gemaakt));
