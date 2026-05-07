import { test, expect } from "../playwright-fixture";

/**
 * E2E test voor Webtools-aanmaakflow.
 *
 * Regressie-bug: bij het klikken op "Configureer & Embed" voor een specifieke
 * calculator-template (bv. Thuisbatterij) bleef de WidgetConfigurator-state
 * hangen op "contactformulier". Deze test borgt dat een aangemaakte widget
 * altijd het type krijgt van de aangeklikte template, en dat de embed-URL
 * vervolgens naar /embed/calculator/:id wijst i.p.v. /embed/contact/:id.
 *
 * De Supabase REST-calls naar `web_widgets` worden gemockt om de test stabiel,
 * snel en isolatie-vrij te maken.
 */

const WIDGETS_URL = /\/rest\/v1\/web_widgets(\?|$)/;
const FAKE_WIDGET_ID = "00000000-0000-4000-8000-000000000abc";

test.describe("Webtools — widget aanmaken", () => {
  test("Thuisbatterij calculator wordt opgeslagen als calculator_thuisbatterij en gebruikt /embed/calculator/", async ({ page }) => {
    let capturedInsertBody: any = null;
    let createdWidget: any = null;

    await page.route(WIDGETS_URL, async (route) => {
      const req = route.request();
      const method = req.method();

      // 1) GET = lijst widgets ophalen
      if (method === "GET") {
        const body = createdWidget ? [createdWidget] : [];
        return route.fulfill({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      // 2) POST = nieuwe widget aanmaken — body opvangen voor assertie
      if (method === "POST") {
        try {
          capturedInsertBody = JSON.parse(req.postData() || "{}");
        } catch {
          capturedInsertBody = null;
        }
        const inserted = Array.isArray(capturedInsertBody) ? capturedInsertBody[0] : capturedInsertBody;
        createdWidget = {
          id: FAKE_WIDGET_ID,
          created_at: new Date().toISOString(),
          ...inserted,
        };
        return route.fulfill({
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([createdWidget]),
        });
      }

      return route.fulfill({ status: 200, body: "[]" });
    });

    await page.goto("/tools");

    // Open de Thuisbatterij Calculator template-configurator.
    // Eerst even bevestigen dat de Webtools-sectie geladen is.
    const thuisbatterijCard = page
      .locator("div", { hasText: /Thuisbatterij Calculator/i })
      .filter({ has: page.getByRole("button", { name: /Configureer|toevoegen/i }) })
      .first();
    await expect(thuisbatterijCard).toBeVisible({ timeout: 15_000 });

    await thuisbatterijCard.getByRole("button", { name: /Configureer|toevoegen/i }).click();

    // De dialog moet de juiste template tonen.
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/Thuisbatterij Calculator/i);

    // Vul de naam in en sla op.
    await dialog.getByLabel(/^Naam/i).fill("E2E thuisbatterij widget");
    await dialog.getByRole("button", { name: /Aanmaken/i }).click();

    // Wacht tot de POST gevangen is.
    await expect.poll(() => capturedInsertBody, { timeout: 10_000 }).not.toBeNull();

    const inserted = Array.isArray(capturedInsertBody) ? capturedInsertBody[0] : capturedInsertBody;
    expect(inserted.type).toBe("calculator_thuisbatterij");
    expect(inserted.naam).toBe("E2E thuisbatterij widget");

    // De widget moet daarna in de lijst verschijnen — open de embed-dialog.
    const embedTrigger = page
      .locator("div", { hasText: "E2E thuisbatterij widget" })
      .first()
      .locator("button")
      .filter({ has: page.locator("svg.lucide-code") })
      .first();
    await embedTrigger.click();

    const embedDialog = page.getByRole("dialog");
    await expect(embedDialog).toContainText(/Integratiecode/i);

    // Het iframe-snippet (Textarea readonly) moet naar /embed/calculator/ wijzen.
    const snippet = await embedDialog.getByRole("textbox").first().inputValue();
    expect(snippet).toContain(`/embed/calculator/${FAKE_WIDGET_ID}`);
    expect(snippet).not.toContain(`/embed/contact/`);
  });
});