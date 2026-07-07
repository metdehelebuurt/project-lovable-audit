import { test, expect } from "../playwright-fixture";

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
});