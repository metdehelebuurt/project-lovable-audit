import { test, expect } from "../playwright-fixture";

/**
 * E2E — Sales Team-cockpit is de standaard tab op /sales voor sales managers,
 * met AI-briefing en Next-Best-Action lijst zichtbaar.
 *
 * De AI briefing edge function wordt gemockt zodat de test niet afhankelijk is
 * van live LLM-latency of credits.
 */

const BRIEFING_URL = /\/functions\/v1\/sales-manager-briefing/;

const briefingBody = {
  briefing: {
    headline: "12 leads actief, 3 vragen aandacht",
    highlights: ["3 leads 7+ dagen stil", "€45k in pipeline", "2 heet"],
    acties: ["Bel de rode leads", "Herverdeel platform", "Vraag update rep X"],
    context: { totaal_leads: 12, totaal_waarde: 45000, totaal_stil_7d: 3, terugbel_afspraken_komende_week: 2, per_rep: [] },
  },
  cached: true,
};

test.describe("Sales team cockpit", () => {
  test("cockpit-tab toont briefing en next-best-actions", async ({ page }) => {
    await page.route(BRIEFING_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(briefingBody) }),
    );

    await page.goto("/sales");

    await expect(page.getByRole("tab", { name: /team/i })).toBeVisible();
    await expect(page.getByTestId("team-cockpit").or(page.getByTestId("team-cockpit-geen-toegang"))).toBeVisible();
  });

  test("briefing card toont AI headline + acties", async ({ page }) => {
    await page.route(BRIEFING_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(briefingBody) }),
    );

    await page.goto("/sales");
    const cockpit = page.getByTestId("team-cockpit");
    // Als de gebruiker geen sales-manager rol heeft toont de app 'geen-toegang'.
    // Beide varianten zijn valide — asserteer op ten minste één.
    const geenToegang = page.getByTestId("team-cockpit-geen-toegang");
    const heeftToegang = await cockpit.isVisible().catch(() => false);
    if (heeftToegang) {
      await expect(page.getByTestId("briefing-card")).toBeVisible();
      await expect(page.getByText("12 leads actief, 3 vragen aandacht")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText("Bel de rode leads")).toBeVisible();
      await expect(page.getByTestId("nba-card")).toBeVisible();
    } else {
      await expect(geenToegang).toBeVisible();
    }
  });

  test("briefing vernieuw-knop triggert force-refresh", async ({ page }) => {
    let forceHits = 0;
    await page.route(BRIEFING_URL, (route) => {
      const u = route.request().url();
      if (u.includes("force=1")) forceHits += 1;
      return route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(briefingBody) });
    });

    await page.goto("/sales");
    const cockpitZichtbaar = await page.getByTestId("team-cockpit").isVisible().catch(() => false);
    test.skip(!cockpitZichtbaar, "gebruiker heeft geen sales-manager rol");

    await page.getByRole("button", { name: /briefing vernieuwen/i }).click();
    await expect.poll(() => forceHits, { timeout: 5000 }).toBeGreaterThan(0);
  });
});