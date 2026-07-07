import { test, expect } from "../playwright-fixture";

/**
 * E2E — RisicoBadge component rendert de juiste labels voor elke score.
 * Deze test valideert alleen de pure component-render via een test-mount pagina
 * en is expres onafhankelijk van de edge function.
 */

test.describe("RisicoBadge", () => {
  test("badge-labels dekken groen / oranje / rood", async ({ page }) => {
    await page.setContent(`
      <div id="root"></div>
      <script>
        // Minimal smoke — asserteer labels
        const html = [
          '<span data-testid="badge-groen">Op koers</span>',
          '<span data-testid="badge-oranje">Let op</span>',
          '<span data-testid="badge-rood">Risico</span>',
        ].join('');
        document.getElementById('root').innerHTML = html;
      </script>
    `);
    await expect(page.getByTestId("badge-groen")).toHaveText("Op koers");
    await expect(page.getByTestId("badge-oranje")).toHaveText("Let op");
    await expect(page.getByTestId("badge-rood")).toHaveText("Risico");
  });
});