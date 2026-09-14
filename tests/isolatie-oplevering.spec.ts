import { test, expect } from "../playwright-fixture";

/**
 * E2E test voor de isolatie-oplevering.
 *
 * Borgt dat er naast het elektra-rapport (NEN 1010) ook een isolatierapport
 * gestart kan worden en dat de aanmaakroute het juiste rapporttype meekrijgt.
 */

const RAPPORTEN_URL = /\/rest\/v1\/opleverrapporten(\?|$)/;

test.describe("Opleveringen — isolatierapport", () => {
  test("Knop 'Nieuw rapport (isolatie)' navigeert met type=isolatie", async ({ page }) => {
    await page.route(RAPPORTEN_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "application/json" }, body: "[]" }),
    );

    await page.goto("/opleveringen");

    const elektraKnop = page.getByRole("button", { name: /Nieuw rapport \(elektra\)/i });
    const isolatieKnop = page.getByRole("button", { name: /Nieuw rapport \(isolatie\)/i });
    await expect(elektraKnop).toBeVisible();
    await expect(isolatieKnop).toBeVisible();

    await isolatieKnop.click();
    await expect(page).toHaveURL(/\/opleveringen\/nieuw\?type=isolatie/);
  });
});
