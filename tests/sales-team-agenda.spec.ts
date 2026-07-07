import { test, expect } from "../playwright-fixture";

test.describe("Team-agenda tab", () => {
  test("agenda toont zeven dagkolommen", async ({ page }) => {
    await page.goto("/sales");
    const tab = page.getByRole("tab", { name: /team-agenda/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByTestId("team-agenda")).toBeVisible({ timeout: 10_000 });
    for (let i = 0; i < 7; i++) {
      await expect(page.getByTestId(`agenda-dag-${i}`)).toBeVisible();
    }
  });
});