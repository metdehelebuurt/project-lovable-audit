import { test, expect } from "../playwright-fixture";

test.describe("Winning plays library", () => {
  test("tab opent en toont overzicht", async ({ page }) => {
    await page.goto("/sales");
    const tab = page.getByRole("tab", { name: /winning plays/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByTestId("winning-plays")).toBeVisible({ timeout: 5000 });
  });
});