++ tests/sales-trial-lifecycle.spec.ts
import { test, expect } from "../playwright-fixture";

const BULK_URL = /\/functions\/v1\/sales-trial-bulk-actie/;

test.describe("Trial lifecycle board", () => {
  test("board toont vier buckets", async ({ page }) => {
    await page.goto("/sales");
    const tab = page.getByRole("tab", { name: /trial-fases/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByTestId("trial-lifecycle")).toBeVisible({ timeout: 5000 });
    for (const key of ["d1", "d7", "d21", "d28"]) {
      await expect(page.getByTestId(`bucket-${key}`)).toBeVisible();
    }
  });

  test("bulk-actie: selecteer trials, verleng 14d, statusovergang verwerkt", async ({ page }) => {
    let ontvangenPayload: { actie?: string; partner_ids?: string[]; dagen?: number } | null = null;
    await page.route(BULK_URL, async (route) => {
      const req = route.request();
      try { ontvangenPayload = JSON.parse(req.postData() ?? "{}"); } catch { /* ignore */ }
      return route.fulfill({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: true, verwerkt: (ontvangenPayload?.partner_ids?.length ?? 0) }),
      });
    });

    await page.goto("/sales");
    const tab = page.getByRole("tab", { name: /trial-fases/i });
    await tab.click();
    await expect(page.getByTestId("trial-lifecycle")).toBeVisible({ timeout: 5000 });

    const items = page.getByTestId("trial-item");
    const aantal = await items.count();
    test.skip(aantal === 0, "geen trials om te bulk-selecteren in deze omgeving");

    // Selecteer de eerste twee trials (of alles wat er is als er minder zijn).
    const teSelecteren = Math.min(2, aantal);
    for (let i = 0; i < teSelecteren; i++) {
      await items.nth(i).getByTestId("trial-item-check").click();
    }

    await expect(page.getByTestId("bulk-actie-bar")).toBeVisible();
    await expect(page.getByTestId("bulk-selectie-aantal")).toHaveText(`${teSelecteren} geselecteerd`);

    await page.getByTestId("bulk-verleng-14").click();

    await expect.poll(() => ontvangenPayload?.actie, { timeout: 5000 }).toBe("verleng");
    expect(ontvangenPayload?.dagen).toBe(14);
    expect(ontvangenPayload?.partner_ids?.length).toBe(teSelecteren);

    // Na afronding moet de selectie-bar verdwijnen (selectie gewist).
    await expect(page.getByTestId("bulk-actie-bar")).toBeHidden();
  });
});