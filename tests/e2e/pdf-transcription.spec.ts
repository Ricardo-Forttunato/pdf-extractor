import { test, expect } from "@playwright/test";
test("a tela de envio apresenta o fluxo", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Quick Filler" }),
  ).toBeVisible();
  await expect(page.getByLabel("Tipo")).toBeVisible();
});
