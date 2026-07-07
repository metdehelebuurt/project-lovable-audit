import { test, expect } from "../playwright-fixture";

test.describe("Sales forecast tab", () => {
  test("forecast tab is zichtbaar en toont KPI's", async ({ page }) => {
    await page.goto("/sales");
    const tab = page.getByRole("tab", { name: /forecast/i });
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.getByTestId("sales-forecast")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/gewogen forecast/i)).toBeVisible();
  });
});