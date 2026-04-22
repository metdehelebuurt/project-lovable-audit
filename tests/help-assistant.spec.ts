import { test, expect } from "../playwright-fixture";

/**
 * E2E checks voor de Hulp-assistent.
 * Edge function `help-assistant` wordt gemockt via route-intercept voor stabiliteit.
 */

const STREAM_URL = /\/functions\/v1\/help-assistant$/;

function sseAnswerWithLink(): string {
  const part1 = JSON.stringify({ choices: [{ delta: { content: "Maak een offerte via " } }] });
  const part2 = JSON.stringify({ choices: [{ delta: { content: "[Offertes → Nieuw](/offertes/nieuw)." } }] });
  return `data: ${part1}\n\ndata: ${part2}\n\ndata: [DONE]\n\n`;
}

test.describe("Hulp-assistent", () => {
  test("knop zichtbaar en link navigeert in-app", async ({ page }) => {
    await page.route(STREAM_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: sseAnswerWithLink() }),
    );
    await page.goto("/dashboard");
    const helpBtn = page.getByRole("button", { name: /hulp nodig/i });
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    const input = page.getByPlaceholder(/stel je vraag/i);
    await input.fill("Waar maak ik een offerte?");
    await input.press("Enter");

    const link = page.getByRole("link", { name: /offertes.*nieuw/i });
    await expect(link).toBeVisible({ timeout: 10_000 });
    await expect(link).toHaveAttribute("href", "/offertes/nieuw");

    await link.click();
    await expect(page).toHaveURL(/\/offertes\/nieuw$/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("wis gesprek leegt localStorage", async ({ page }) => {
    await page.route(STREAM_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: sseAnswerWithLink() }),
    );
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /hulp nodig/i }).click();
    const input = page.getByPlaceholder(/stel je vraag/i);
    await input.fill("test");
    await input.press("Enter");
    await expect(page.getByRole("link", { name: /offertes.*nieuw/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /wis gesprek/i }).click();
    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("help-chat:"));
      return keys.map((k) => localStorage.getItem(k));
    });
    expect(stored.every((v) => !v || v === "[]")).toBe(true);
  });

  test("mobiele viewport: paneel werkt", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.route(STREAM_URL, (route) =>
      route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: sseAnswerWithLink() }),
    );
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /hulp nodig/i }).click();
    const input = page.getByPlaceholder(/stel je vraag/i);
    await input.fill("offerte");
    await input.press("Enter");
    await expect(page.getByRole("link", { name: /offertes.*nieuw/i })).toBeVisible({ timeout: 10_000 });
  });

  test("toont vriendelijke melding bij 429", async ({ page }) => {
    await page.route(STREAM_URL, (route) =>
      route.fulfill({ status: 429, body: JSON.stringify({ error: "rate limited" }) }),
    );
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /hulp nodig/i }).click();
    const input = page.getByPlaceholder(/stel je vraag/i);
    await input.fill("test");
    await input.press("Enter");
    await expect(page.getByText(/even druk/i)).toBeVisible();
  });

  test("toont herstelmelding bij netwerkfout", async ({ page }) => {
    await page.route(STREAM_URL, (route) => route.abort("failed"));
    await page.goto("/dashboard");
    await page.getByRole("button", { name: /hulp nodig/i }).click();
    const input = page.getByPlaceholder(/stel je vraag/i);
    await input.fill("test");
    await input.press("Enter");
    await expect(page.getByText(/er ging iets mis/i)).toBeVisible();
  });
});