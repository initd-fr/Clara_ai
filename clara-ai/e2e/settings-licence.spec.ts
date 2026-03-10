import { test, expect } from "@playwright/test";

test.describe("Paramètres et licence", () => {
  test("page paramètres affiche le titre ou redirige vers auth si non connecté", async ({
    page,
  }) => {
    await page.goto("/settings");
    const onSettings =
      (await page.getByRole("heading", { name: /paramètres/i }).isVisible()) ||
      (await page.getByText(/informations légales/i).isVisible());
    const redirectedToAuth = page.url().includes("/auth");
    expect(onSettings || redirectedToAuth).toBe(true);
  });

  test("si connecté: section informations légales affiche le bouton Licence", async ({
    page,
  }) => {
    await page.goto("/settings");
    const heading = page.getByRole("heading", { name: /paramètres/i });
    if (!(await heading.isVisible())) {
      test.skip();
      return;
    }
    await page.getByRole("heading", { name: /informations légales/i }).click();
    await expect(
      page.getByRole("link", { name: /consulter la licence/i })
    ).toBeVisible();
  });

  test("page licence affiche le texte MIT si accédée directement", async ({
    page,
  }) => {
    await page.goto("/settings/licence");
    if (page.url().includes("/auth")) {
      test.skip(true, "Page licence réservée aux utilisateurs connectés");
      return;
    }
    await expect(
      page.getByRole("heading", { name: /licence/i })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/MIT License/i)).toBeVisible();
  });
});
