import { test, expect } from "../playwright-fixture";

test.describe("Team targets", () => {
  test("targets-kaart is zichtbaar op cockpit", async ({ page }) => {
    await page.goto("/sales");
    await expect(page.getByRole("tab", { name: /team/i })).toBeVisible();
    const cockpit = page.getByTestId("team-cockpit");
    const geen = page.getByTestId("team-cockpit-geen-toegang");
    const heeftToegang = await cockpit.isVisible().catch(() => false);
    if (!heeftToegang) {
      await expect(geen).toBeVisible();
      return;
    }
    await expect(page.getByTestId("targets-kaart")).toBeVisible();
    await expect(page.getByTestId("targets-totaal")).toBeVisible();
  });
});