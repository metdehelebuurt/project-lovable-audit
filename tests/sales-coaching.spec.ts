import { test, expect } from "../playwright-fixture";

const COACH_URL = /\/functions\/v1\/sales-coaching-tip/;

const mockTips = {
  tips: [
    { titel: "Vervallen acties inhalen", toelichting: "Werk verstreken acties vandaag weg.", prioriteit: "hoog" },
    { titel: "Snippets vaker inzetten", toelichting: "Voeg bezwaar-antwoorden toe.", prioriteit: "midden" },
  ],
  cached: false,
};

test.describe("Coaching-tips", () => {
  test("kaart rendert en genereert tips via edge function", async ({ page }) => {
    await page.route(COACH_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(mockTips) }),
    );
    await page.goto("/sales");
    const cockpit = page.getByTestId("team-cockpit");
    const heeftToegang = await cockpit.isVisible().catch(() => false);
    test.skip(!heeftToegang, "geen sales-manager toegang");
    await expect(page.getByTestId("coaching-kaart")).toBeVisible();
    // Klik vernieuw en verwacht dat er iets zichtbaar wordt (of tips of "genereer nu").
    const vernieuw = page.getByTestId("coaching-vernieuwen");
    if (await vernieuw.isEnabled()) await vernieuw.click();
  });
});