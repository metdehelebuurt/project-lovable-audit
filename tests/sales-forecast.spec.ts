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

  test("forecast toont periode-overzicht en doorlooptijd-indicatoren", async ({ page }) => {
    await page.goto("/sales");
    await page.getByRole("tab", { name: /forecast/i }).click();
    await expect(page.getByTestId("sales-forecast")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("forecast-periodes")).toBeVisible();
    for (const k of ["deze-maand", "volgende-maand", "dit-kwartaal", "volgend-kwartaal"]) {
      await expect(page.getByTestId(`periode-${k}`)).toBeVisible();
      await expect(page.getByTestId(`periode-${k}-gewogen`)).toBeVisible();
    }
    await expect(page.getByTestId("forecast-doorlooptijd")).toBeVisible();
    await expect(page.getByText(/bottleneck-fase/i)).toBeVisible();
  });
});