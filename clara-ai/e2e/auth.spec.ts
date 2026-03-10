import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("page d'accueil auth affiche le formulaire de connexion", async ({
    page,
  }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: /connexion/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test("lien retour ou inscription présent sur la page auth", async ({
    page,
  }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: /inscription/i })
    ).toBeVisible({ timeout: 15000 });
  });
});
