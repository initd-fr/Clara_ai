import { test, expect } from "@playwright/test";

test.describe("Modale création de modèle", () => {
  test("ouvrir la modale de choix (Créer) depuis l’URL", async ({ page }) => {
    await page.goto("/?modal=choose-mode");
    if (page.url().includes("/auth")) {
      test.skip(true, "Modale réservée aux utilisateurs connectés");
      return;
    }
    await expect(
      page.getByRole("heading", { name: /créer un modèle/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: /agent ia/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /expert/i })
    ).toBeVisible();
  });

  test("étape 2 : choix Création rapide / Création avancée après avoir choisi Agent", async ({
    page,
  }) => {
    await page.goto("/?modal=choose-mode");
    if (page.url().includes("/auth")) {
      test.skip(true, "Modale réservée aux utilisateurs connectés");
      return;
    }
    await page.getByRole("button", { name: /agent ia/i }).click();
    await expect(
      page.getByRole("heading", { name: /création rapide/i })
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole("button", { name: /création avancée/i })
    ).toBeVisible();
  });
});
